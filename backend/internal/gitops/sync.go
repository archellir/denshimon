// Package gitops provides base infrastructure synchronization engine.
// It handles automatic syncing of Kubernetes deployments to the base infrastructure repository.
package gitops

import (
	"context"
	"fmt"
	"path/filepath"
	"strings"
	"time"

	"github.com/archellir/denshimon/internal/git"
	"github.com/archellir/denshimon/pkg/logger"
	"log/slog"
)

// SyncEngine manages synchronization between Kubernetes deployments and Git repository
type SyncEngine struct {
	service *Service
	logger  *slog.Logger
}

// NewSyncEngine creates a new sync engine
func NewSyncEngine(service *Service) *SyncEngine {
	return &SyncEngine{
		service: service,
		logger:  logger.New(slog.LevelInfo),
	}
}

// SyncConfig represents synchronization configuration
type SyncConfig struct {
	AutoSync         bool          `json:"auto_sync"`
	SyncInterval     time.Duration `json:"sync_interval"`
	CommitMessage    string        `json:"commit_message"`
	TargetBranch     string        `json:"target_branch"`
	ManifestPath     string        `json:"manifest_path"`
	IncludeServices  bool          `json:"include_services"`
	IncludeIngress   bool          `json:"include_ingress"`
	IncludeConfigMap bool          `json:"include_configmap"`
	AutoScaling      bool          `json:"auto_scaling"`
}

// DefaultSyncConfig returns default synchronization configuration
func DefaultSyncConfig() *SyncConfig {
	return &SyncConfig{
		AutoSync:         true,
		SyncInterval:     5 * time.Minute,
		CommitMessage:    "feat(gitops): sync kubernetes deployment changes",
		TargetBranch:     "main",
		ManifestPath:     "k8s",
		IncludeServices:  true,
		IncludeIngress:   false,
		IncludeConfigMap: true,
		AutoScaling:      false,
	}
}

// SyncApplicationToGit synchronizes an application deployment to Git repository
func (se *SyncEngine) SyncApplicationToGit(ctx context.Context, appID string, config *SyncConfig) error {
	se.logger.Info("starting application sync", "app_id", appID)

	// Get application details
	apps, err := se.service.ListApplications(ctx)
	if err != nil {
		return fmt.Errorf("failed to list applications: %w", err)
	}

	var app *Application
	for _, a := range apps {
		if a.ID == appID {
			app = &a
			break
		}
	}

	if app == nil {
		return fmt.Errorf("application not found: %s", appID)
	}

	// Generate manifest with specified options
	manifestOptions := map[string]interface{}{
		"service":     config.IncludeServices,
		"ingress":     config.IncludeIngress,
		"configmap":   config.IncludeConfigMap,
		"autoscaling": config.AutoScaling,
		"labels": map[string]string{
			"synced-at": time.Now().Format(time.RFC3339),
			"sync-id":   fmt.Sprintf("sync-%d", time.Now().Unix()),
		},
		"annotations": map[string]string{
			"denshimon.io/last-sync": time.Now().Format(time.RFC3339),
			"denshimon.io/app-id":    appID,
		},
	}

	manifest, err := se.service.GenerateFullManifest(app, manifestOptions)
	if err != nil {
		return fmt.Errorf("failed to generate manifest: %w", err)
	}

	// Validate manifest before writing
	if err := se.service.ValidateManifest(manifest); err != nil {
		return fmt.Errorf("manifest validation failed: %w", err)
	}

	// Determine manifest file path
	manifestPath := filepath.Join(config.ManifestPath, app.Namespace, fmt.Sprintf("%s.yaml", app.Name))

	// Write manifest to repository
	if err := se.service.gitClient.WriteFile(manifestPath, []byte(manifest)); err != nil {
		return fmt.Errorf("failed to write manifest: %w", err)
	}

	// Generate commit message with deployment details
	commitMsg := se.generateCommitMessage(app, config.CommitMessage)

	// Commit and push changes
	if err := se.service.gitClient.CommitAndPush(commitMsg, manifestPath); err != nil {
		return fmt.Errorf("failed to sync to git: %w", err)
	}

	se.logger.Info("application synced successfully", 
		"app_id", appID, 
		"app_name", app.Name,
		"namespace", app.Namespace,
		"manifest_path", manifestPath)

	return nil
}

// SyncAllApplications synchronizes all applications to Git repository
func (se *SyncEngine) SyncAllApplications(ctx context.Context, config *SyncConfig) error {
	se.logger.Info("starting full sync of all applications")

	apps, err := se.service.ListApplications(ctx)
	if err != nil {
		return fmt.Errorf("failed to list applications: %w", err)
	}

	if len(apps) == 0 {
		se.logger.Info("no applications to sync")
		return nil
	}

	// Group applications by namespace for organized commit structure
	appsByNamespace := make(map[string][]Application)
	for _, app := range apps {
		appsByNamespace[app.Namespace] = append(appsByNamespace[app.Namespace], app)
	}

	var syncedFiles []string

	// Process each namespace
	for namespace, nsApps := range appsByNamespace {
		se.logger.Info("syncing namespace", "namespace", namespace, "app_count", len(nsApps))

		for _, app := range nsApps {
			// Generate manifest
			manifestOptions := map[string]interface{}{
				"service":     config.IncludeServices,
				"ingress":     config.IncludeIngress,
				"configmap":   config.IncludeConfigMap,
				"autoscaling": config.AutoScaling,
				"labels": map[string]string{
					"synced-at": time.Now().Format(time.RFC3339),
					"namespace": namespace,
				},
				"annotations": map[string]string{
					"denshimon.io/last-sync": time.Now().Format(time.RFC3339),
					"denshimon.io/app-id":    app.ID,
				},
			}

			manifest, err := se.service.GenerateFullManifest(&app, manifestOptions)
			if err != nil {
				se.logger.Error("failed to generate manifest", "app_id", app.ID, "error", err)
				continue
			}

			// Validate manifest
			if err := se.service.ValidateManifest(manifest); err != nil {
				se.logger.Error("manifest validation failed", "app_id", app.ID, "error", err)
				continue
			}

			// Write manifest
			manifestPath := filepath.Join(config.ManifestPath, namespace, fmt.Sprintf("%s.yaml", app.Name))
			if err := se.service.gitClient.WriteFile(manifestPath, []byte(manifest)); err != nil {
				se.logger.Error("failed to write manifest", "app_id", app.ID, "error", err)
				continue
			}

			syncedFiles = append(syncedFiles, manifestPath)
		}
	}

	if len(syncedFiles) == 0 {
		se.logger.Warn("no manifests were generated successfully")
		return fmt.Errorf("no manifests were generated successfully")
	}

	// Commit all changes
	commitMsg := se.generateBulkCommitMessage(len(syncedFiles), config.CommitMessage)
	if err := se.service.gitClient.CommitAndPush(commitMsg, syncedFiles...); err != nil {
		return fmt.Errorf("failed to commit bulk sync: %w", err)
	}

	se.logger.Info("bulk sync completed", "synced_files", len(syncedFiles))
	return nil
}

// StartAutoSync starts automatic synchronization background process
func (se *SyncEngine) StartAutoSync(ctx context.Context, config *SyncConfig) error {
	if !config.AutoSync {
		se.logger.Info("auto sync disabled")
		return nil
	}

	se.logger.Info("starting auto sync", "interval", config.SyncInterval)

	ticker := time.NewTicker(config.SyncInterval)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			se.logger.Info("auto sync stopped")
			return ctx.Err()
		case <-ticker.C:
			se.logger.Debug("running scheduled sync")
			if err := se.SyncAllApplications(ctx, config); err != nil {
				se.logger.Error("auto sync failed", "error", err)
			}
		}
	}
}

// GetSyncStatus returns current synchronization status
func (se *SyncEngine) GetSyncStatus(ctx context.Context) (*SyncStatus, error) {
	// Get git status to check for pending changes
	status, err := se.service.gitClient.Status()
	if err != nil {
		return nil, fmt.Errorf("failed to get git status: %w", err)
	}

	// Get recent commits
	commits, err := se.service.gitClient.Log(5)
	if err != nil {
		return nil, fmt.Errorf("failed to get git log: %w", err)
	}

	// Count applications
	apps, err := se.service.ListApplications(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to list applications: %w", err)
	}

	syncStatus := &SyncStatus{
		LastSync:         time.Now(),
		PendingChanges:   status != "",
		ApplicationCount: len(apps),
		RecentCommits:    commits,
		GitStatus:        status,
	}

	// Set last sync time from most recent commit
	if len(commits) > 0 {
		syncStatus.LastSync = commits[0].Timestamp
	}

	return syncStatus, nil
}

// SyncStatus represents current synchronization status
type SyncStatus struct {
	LastSync         time.Time                   `json:"last_sync"`
	PendingChanges   bool                       `json:"pending_changes"`
	ApplicationCount int                        `json:"application_count"`
	RecentCommits    []git.CommitInfo           `json:"recent_commits"`
	GitStatus        string                     `json:"git_status"`
}

// generateCommitMessage creates a descriptive commit message for single app sync
func (se *SyncEngine) generateCommitMessage(app *Application, template string) string {
	if template == "" {
		template = "feat(gitops): sync {{.AppName}} deployment in {{.Namespace}}"
	}

	message := strings.ReplaceAll(template, "{{.AppName}}", app.Name)
	message = strings.ReplaceAll(message, "{{.Namespace}}", app.Namespace)
	message = strings.ReplaceAll(message, "{{.Image}}", app.Image)
	message = strings.ReplaceAll(message, "{{.Replicas}}", fmt.Sprintf("%d", app.Replicas))

	// Add detailed description
	description := fmt.Sprintf(`
Update %s deployment manifest with:
- Image: %s
- Replicas: %d
- Environment variables: %d
- Resource limits: %v`,
		app.Name, app.Image, app.Replicas, len(app.Environment), len(app.Resources) > 0)

	return message + description
}

// generateBulkCommitMessage creates a commit message for bulk sync
func (se *SyncEngine) generateBulkCommitMessage(fileCount int, template string) string {
	if template == "" {
		template = "feat(gitops): bulk sync kubernetes deployments"
	}

	message := strings.ReplaceAll(template, "{{.FileCount}}", fmt.Sprintf("%d", fileCount))

	// Add description
	description := fmt.Sprintf(`
Synchronized %d Kubernetes manifests to base infrastructure repository
- Generated at: %s
- Auto-sync enabled
- All applications current with cluster state`,
		fileCount, time.Now().Format(time.RFC3339))

	return message + description
}

// ForceSync performs immediate synchronization regardless of auto-sync settings
func (se *SyncEngine) ForceSync(ctx context.Context, config *SyncConfig) error {
	se.logger.Info("performing force sync")
	
	// Backup original auto-sync setting
	originalAutoSync := config.AutoSync
	config.AutoSync = true
	defer func() {
		config.AutoSync = originalAutoSync
	}()

	return se.SyncAllApplications(ctx, config)
}
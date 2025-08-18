// Package gitops provides GitOps functionality for managing infrastructure as code.
// It handles repository synchronization, manifest generation, and deployment tracking.
package gitops

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"path/filepath"
	"time"

	"github.com/archellir/denshimon/internal/git"
	"github.com/google/uuid"
)

// Service provides GitOps operations
type Service struct {
	db               *sql.DB
	gitClient        *git.Client
	baseInfraRepoURL string
	localRepoPath    string
}

// NewService creates a new GitOps service
func NewService(db *sql.DB, baseInfraRepoURL, localRepoPath string) *Service {
	return &Service{
		db:               db,
		baseInfraRepoURL: baseInfraRepoURL,
		localRepoPath:    localRepoPath,
		gitClient:        git.NewClient(baseInfraRepoURL, localRepoPath, "main"),
	}
}

// Repository represents a GitOps repository
type Repository struct {
	ID          string     `json:"id"`
	Name        string     `json:"name"`
	URL         string     `json:"url"`
	Branch      string     `json:"branch"`
	Path        string     `json:"path"`
	LastSync    *time.Time `json:"last_sync,omitempty"`
	Status      string     `json:"status"`
	Description string     `json:"description"`
	CreatedAt   time.Time  `json:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at"`
}

// Application represents a deployed application
type Application struct {
	ID            string            `json:"id"`
	Name          string            `json:"name"`
	Namespace     string            `json:"namespace"`
	RepositoryID  string            `json:"repository_id"`
	Path          string            `json:"path"`
	Image         string            `json:"image"`
	Replicas      int               `json:"replicas"`
	Resources     map[string]string `json:"resources"`
	Environment   map[string]string `json:"environment"`
	LastDeployed  *time.Time        `json:"last_deployed,omitempty"`
	Status        string            `json:"status"`
	Health        string            `json:"health"`
	SyncStatus    string            `json:"sync_status"`
	CreatedAt     time.Time         `json:"created_at"`
	UpdatedAt     time.Time         `json:"updated_at"`
}

// DeploymentRecord represents a deployment history entry
type DeploymentRecord struct {
	ID            string            `json:"id"`
	ApplicationID string            `json:"application_id"`
	Image         string            `json:"image"`
	Replicas      int               `json:"replicas"`
	Environment   map[string]string `json:"environment"`
	GitHash       string            `json:"git_hash"`
	Status        string            `json:"status"`
	Message       string            `json:"message"`
	DeployedBy    string            `json:"deployed_by"`
	DeployedAt    time.Time         `json:"deployed_at"`
}

// Alert represents a GitOps monitoring alert
type Alert struct {
	ID          string            `json:"id"`
	Type        string            `json:"type"` // sync_failure, deployment_failure, repository_unreachable, drift_detected
	Severity    string            `json:"severity"` // critical, warning, info
	Title       string            `json:"title"`
	Message     string            `json:"message"`
	Metadata    map[string]string `json:"metadata"`
	Status      string            `json:"status"` // active, acknowledged, resolved
	CreatedAt   time.Time         `json:"created_at"`
	UpdatedAt   time.Time         `json:"updated_at"`
	ResolvedAt  *time.Time        `json:"resolved_at,omitempty"`
}

// HealthMetrics represents GitOps health metrics
type HealthMetrics struct {
	TotalRepositories      int                    `json:"total_repositories"`
	HealthyRepositories    int                    `json:"healthy_repositories"`
	TotalApplications      int                    `json:"total_applications"`
	HealthyApplications    int                    `json:"healthy_applications"`
	SyncedApplications     int                    `json:"synced_applications"`
	OutOfSyncApplications  int                    `json:"out_of_sync_applications"`
	FailedDeployments      int                    `json:"failed_deployments"`
	RecentSyncFailures     int                    `json:"recent_sync_failures"`
	ActiveAlerts           int                    `json:"active_alerts"`
	CriticalAlerts         int                    `json:"critical_alerts"`
	LastSyncTime           *time.Time             `json:"last_sync_time,omitempty"`
	AverageSyncDuration    *time.Duration         `json:"average_sync_duration,omitempty"`
	RepositoryHealth       map[string]string      `json:"repository_health"`
	ApplicationHealth      map[string]string      `json:"application_health"`
	SyncTrends             []SyncTrendPoint       `json:"sync_trends"`
}

// SyncTrendPoint represents a point in sync trend data
type SyncTrendPoint struct {
	Timestamp    time.Time `json:"timestamp"`
	SuccessRate  float64   `json:"success_rate"`
	SyncCount    int       `json:"sync_count"`
	FailureCount int       `json:"failure_count"`
}



// InitializeRepository initializes the GitOps repository
func (s *Service) InitializeRepository() error {
	return s.gitClient.Clone()
}

// SyncRepository pulls the latest changes from the remote repository
func (s *Service) SyncRepository(ctx context.Context, repoID string) error {
	if err := s.gitClient.Pull(); err != nil {
		return fmt.Errorf("failed to sync repository: %w", err)
	}

	// Update last sync time in database
	_, err := s.db.ExecContext(ctx, `
		UPDATE gitops_repositories 
		SET last_sync = ?, updated_at = ? 
		WHERE id = ?`,
		time.Now(), time.Now(), repoID)
	
	return err
}

// CreateRepository creates a new GitOps repository record
func (s *Service) CreateRepository(ctx context.Context, name, url, branch, description string) (*Repository, error) {
	repo := &Repository{
		ID:          uuid.New().String(),
		Name:        name,
		URL:         url,
		Branch:      branch,
		Path:        filepath.Join(s.localRepoPath, name),
		Status:      "pending",
		Description: description,
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}

	_, err := s.db.ExecContext(ctx, `
		INSERT INTO gitops_repositories (id, name, url, branch, path, status, description, created_at, updated_at)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		repo.ID, repo.Name, repo.URL, repo.Branch, repo.Path, repo.Status, repo.Description, repo.CreatedAt, repo.UpdatedAt)

	if err != nil {
		return nil, fmt.Errorf("failed to create repository: %w", err)
	}

	return repo, nil
}

// ListRepositories returns all GitOps repositories
func (s *Service) ListRepositories(ctx context.Context) ([]Repository, error) {
	rows, err := s.db.QueryContext(ctx, `
		SELECT id, name, url, branch, path, status, description, last_sync, created_at, updated_at
		FROM gitops_repositories
		ORDER BY created_at DESC`)
	if err != nil {
		return nil, fmt.Errorf("failed to list repositories: %w", err)
	}
	defer rows.Close()

	var repos []Repository
	for rows.Next() {
		var repo Repository
		var lastSync sql.NullTime
		
		err := rows.Scan(&repo.ID, &repo.Name, &repo.URL, &repo.Branch, &repo.Path, 
			&repo.Status, &repo.Description, &lastSync, &repo.CreatedAt, &repo.UpdatedAt)
		if err != nil {
			return nil, fmt.Errorf("failed to scan repository: %w", err)
		}

		if lastSync.Valid {
			repo.LastSync = &lastSync.Time
		}

		repos = append(repos, repo)
	}

	return repos, nil
}

// CreateApplication creates a new application deployment
func (s *Service) CreateApplication(ctx context.Context, name, namespace, repoID, path, image string, replicas int, resources, environment map[string]string) (*Application, error) {
	app := &Application{
		ID:           uuid.New().String(),
		Name:         name,
		Namespace:    namespace,
		RepositoryID: repoID,
		Path:         path,
		Image:        image,
		Replicas:     replicas,
		Resources:    resources,
		Environment:  environment,
		Status:       "pending",
		Health:       "unknown",
		SyncStatus:   "out-of-sync",
		CreatedAt:    time.Now(),
		UpdatedAt:    time.Now(),
	}

	// Serialize maps to JSON
	resourcesJSON, _ := json.Marshal(resources)
	envJSON, _ := json.Marshal(environment)

	_, err := s.db.ExecContext(ctx, `
		INSERT INTO gitops_applications (id, name, namespace, repository_id, path, image, replicas, resources, environment, status, health, sync_status, created_at, updated_at)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		app.ID, app.Name, app.Namespace, app.RepositoryID, app.Path, app.Image, app.Replicas, 
		string(resourcesJSON), string(envJSON), app.Status, app.Health, app.SyncStatus, app.CreatedAt, app.UpdatedAt)

	if err != nil {
		return nil, fmt.Errorf("failed to create application: %w", err)
	}

	return app, nil
}

// ListApplications returns all applications
func (s *Service) ListApplications(ctx context.Context) ([]Application, error) {
	rows, err := s.db.QueryContext(ctx, `
		SELECT id, name, namespace, repository_id, path, image, replicas, resources, environment, 
			   status, health, sync_status, last_deployed, created_at, updated_at
		FROM gitops_applications
		ORDER BY created_at DESC`)
	if err != nil {
		return nil, fmt.Errorf("failed to list applications: %w", err)
	}
	defer rows.Close()

	var apps []Application
	for rows.Next() {
		var app Application
		var resourcesJSON, envJSON string
		var lastDeployed sql.NullTime
		
		err := rows.Scan(&app.ID, &app.Name, &app.Namespace, &app.RepositoryID, &app.Path, 
			&app.Image, &app.Replicas, &resourcesJSON, &envJSON, &app.Status, &app.Health, 
			&app.SyncStatus, &lastDeployed, &app.CreatedAt, &app.UpdatedAt)
		if err != nil {
			return nil, fmt.Errorf("failed to scan application: %w", err)
		}

		// Deserialize JSON maps
		json.Unmarshal([]byte(resourcesJSON), &app.Resources)
		json.Unmarshal([]byte(envJSON), &app.Environment)

		if lastDeployed.Valid {
			app.LastDeployed = &lastDeployed.Time
		}

		apps = append(apps, app)
	}

	return apps, nil
}

// DeployApplication deploys an application and records the deployment
func (s *Service) DeployApplication(ctx context.Context, appID string, deployedBy string) (*DeploymentRecord, error) {
	// Get application details
	var app Application
	var resourcesJSON, envJSON string
	err := s.db.QueryRowContext(ctx, `
		SELECT id, name, namespace, repository_id, path, image, replicas, resources, environment
		FROM gitops_applications WHERE id = ?`, appID).Scan(
		&app.ID, &app.Name, &app.Namespace, &app.RepositoryID, &app.Path, 
		&app.Image, &app.Replicas, &resourcesJSON, &envJSON)
	if err != nil {
		return nil, fmt.Errorf("failed to get application: %w", err)
	}

	json.Unmarshal([]byte(resourcesJSON), &app.Resources)
	json.Unmarshal([]byte(envJSON), &app.Environment)

	// Generate Kubernetes manifest
	manifest, err := s.generateDeploymentManifest(&app)
	if err != nil {
		return nil, fmt.Errorf("failed to generate manifest: %w", err)
	}

	// Write manifest to repository
	manifestPath := filepath.Join("k8s", app.Namespace, fmt.Sprintf("%s-deployment.yaml", app.Name))
	if err := s.gitClient.WriteFile(manifestPath, []byte(manifest)); err != nil {
		return nil, fmt.Errorf("failed to write manifest: %w", err)
	}

	// Commit and push changes
	commitMsg := fmt.Sprintf("feat(%s): deploy %s to %s\n\nUpdate deployment with image %s and %d replicas", 
		app.Namespace, app.Name, app.Namespace, app.Image, app.Replicas)
	if err := s.gitClient.CommitAndPush(commitMsg, manifestPath); err != nil {
		return nil, fmt.Errorf("failed to commit changes: %w", err)
	}

	// Get current git hash
	commits, err := s.gitClient.Log(1)
	if err != nil {
		return nil, fmt.Errorf("failed to get git hash: %w", err)
	}

	var gitHash string
	if len(commits) > 0 {
		gitHash = commits[0].Hash
	}

	// Create deployment record
	deployment := &DeploymentRecord{
		ID:            uuid.New().String(),
		ApplicationID: appID,
		Image:         app.Image,
		Replicas:      app.Replicas,
		Environment:   app.Environment,
		GitHash:       gitHash,
		Status:        "deployed",
		Message:       "Successfully deployed to base infrastructure",
		DeployedBy:    deployedBy,
		DeployedAt:    time.Now(),
	}

	envJSONBytes, _ := json.Marshal(deployment.Environment)
	_, err = s.db.ExecContext(ctx, `
		INSERT INTO gitops_deployments (id, application_id, image, replicas, environment, git_hash, status, message, deployed_by, deployed_at)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		deployment.ID, deployment.ApplicationID, deployment.Image, deployment.Replicas, 
		string(envJSONBytes), deployment.GitHash, deployment.Status, deployment.Message, deployment.DeployedBy, deployment.DeployedAt)

	if err != nil {
		return nil, fmt.Errorf("failed to record deployment: %w", err)
	}

	// Update application status
	_, err = s.db.ExecContext(ctx, `
		UPDATE gitops_applications 
		SET status = 'deployed', sync_status = 'synced', last_deployed = ?, updated_at = ?
		WHERE id = ?`,
		time.Now(), time.Now(), appID)
	if err != nil {
		return nil, fmt.Errorf("failed to update application status: %w", err)
	}

	return deployment, nil
}

// GetDeploymentHistory returns deployment history for an application
func (s *Service) GetDeploymentHistory(ctx context.Context, appID string) ([]DeploymentRecord, error) {
	rows, err := s.db.QueryContext(ctx, `
		SELECT id, application_id, image, replicas, environment, git_hash, status, message, deployed_by, deployed_at
		FROM gitops_deployments 
		WHERE application_id = ?
		ORDER BY deployed_at DESC`,
		appID)
	if err != nil {
		return nil, fmt.Errorf("failed to get deployment history: %w", err)
	}
	defer rows.Close()

	var deployments []DeploymentRecord
	for rows.Next() {
		var deployment DeploymentRecord
		var envJSON string
		
		err := rows.Scan(&deployment.ID, &deployment.ApplicationID, &deployment.Image, 
			&deployment.Replicas, &envJSON, &deployment.GitHash, &deployment.Status, 
			&deployment.Message, &deployment.DeployedBy, &deployment.DeployedAt)
		if err != nil {
			return nil, fmt.Errorf("failed to scan deployment: %w", err)
		}

		json.Unmarshal([]byte(envJSON), &deployment.Environment)
		deployments = append(deployments, deployment)
	}

	return deployments, nil
}

// RollbackApplication rolls back an application to a previous deployment
func (s *Service) RollbackApplication(ctx context.Context, appID string, targetDeploymentID string, rolledBackBy string) (*DeploymentRecord, error) {
	// Get the target deployment to rollback to
	var targetDeployment DeploymentRecord
	var envJSON string
	err := s.db.QueryRowContext(ctx, `
		SELECT id, application_id, image, replicas, environment, git_hash, status, message, deployed_by, deployed_at
		FROM gitops_deployments 
		WHERE id = ? AND application_id = ?`,
		targetDeploymentID, appID).Scan(
		&targetDeployment.ID, &targetDeployment.ApplicationID, &targetDeployment.Image,
		&targetDeployment.Replicas, &envJSON, &targetDeployment.GitHash, &targetDeployment.Status,
		&targetDeployment.Message, &targetDeployment.DeployedBy, &targetDeployment.DeployedAt)
	if err != nil {
		return nil, fmt.Errorf("failed to get target deployment: %w", err)
	}

	json.Unmarshal([]byte(envJSON), &targetDeployment.Environment)

	// Get application details
	var app Application
	var resourcesJSON, appEnvJSON string
	err = s.db.QueryRowContext(ctx, `
		SELECT id, name, namespace, repository_id, path, image, replicas, resources, environment
		FROM gitops_applications WHERE id = ?`, appID).Scan(
		&app.ID, &app.Name, &app.Namespace, &app.RepositoryID, &app.Path,
		&app.Image, &app.Replicas, &resourcesJSON, &appEnvJSON)
	if err != nil {
		return nil, fmt.Errorf("failed to get application: %w", err)
	}

	json.Unmarshal([]byte(resourcesJSON), &app.Resources)
	json.Unmarshal([]byte(appEnvJSON), &app.Environment)

	// Update application with rollback values
	app.Image = targetDeployment.Image
	app.Replicas = targetDeployment.Replicas
	app.Environment = targetDeployment.Environment

	// Generate Kubernetes manifest with rollback values
	manifest, err := s.generateDeploymentManifest(&app)
	if err != nil {
		return nil, fmt.Errorf("failed to generate rollback manifest: %w", err)
	}

	// Write manifest to repository
	manifestPath := filepath.Join("k8s", app.Namespace, fmt.Sprintf("%s-deployment.yaml", app.Name))
	if err := s.gitClient.WriteFile(manifestPath, []byte(manifest)); err != nil {
		return nil, fmt.Errorf("failed to write rollback manifest: %w", err)
	}

	// Commit and push rollback changes
	commitMsg := fmt.Sprintf("fix(%s): rollback %s to previous deployment\n\nRollback to image %s and %d replicas\nTarget deployment: %s", 
		app.Namespace, app.Name, targetDeployment.Image, targetDeployment.Replicas, targetDeploymentID)
	if err := s.gitClient.CommitAndPush(commitMsg, manifestPath); err != nil {
		return nil, fmt.Errorf("failed to commit rollback changes: %w", err)
	}

	// Get current git hash after rollback
	commits, err := s.gitClient.Log(1)
	if err != nil {
		return nil, fmt.Errorf("failed to get git hash: %w", err)
	}

	var gitHash string
	if len(commits) > 0 {
		gitHash = commits[0].Hash
	}

	// Create rollback deployment record
	rollbackDeployment := &DeploymentRecord{
		ID:            uuid.New().String(),
		ApplicationID: appID,
		Image:         targetDeployment.Image,
		Replicas:      targetDeployment.Replicas,
		Environment:   targetDeployment.Environment,
		GitHash:       gitHash,
		Status:        "rolled_back",
		Message:       fmt.Sprintf("Rolled back to deployment %s", targetDeploymentID),
		DeployedBy:    rolledBackBy,
		DeployedAt:    time.Now(),
	}

	rollbackEnvJSON, _ := json.Marshal(rollbackDeployment.Environment)
	_, err = s.db.ExecContext(ctx, `
		INSERT INTO gitops_deployments (id, application_id, image, replicas, environment, git_hash, status, message, deployed_by, deployed_at)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		rollbackDeployment.ID, rollbackDeployment.ApplicationID, rollbackDeployment.Image, rollbackDeployment.Replicas,
		string(rollbackEnvJSON), rollbackDeployment.GitHash, rollbackDeployment.Status, rollbackDeployment.Message, rollbackDeployment.DeployedBy, rollbackDeployment.DeployedAt)

	if err != nil {
		return nil, fmt.Errorf("failed to record rollback deployment: %w", err)
	}

	// Update application with rollback values and mark as rolled back
	updatedEnvJSON, _ := json.Marshal(app.Environment)
	_, err = s.db.ExecContext(ctx, `
		UPDATE gitops_applications 
		SET image = ?, replicas = ?, environment = ?, status = 'deployed', sync_status = 'synced', last_deployed = ?, updated_at = ?
		WHERE id = ?`,
		app.Image, app.Replicas, string(updatedEnvJSON), time.Now(), time.Now(), appID)
	if err != nil {
		return nil, fmt.Errorf("failed to update application after rollback: %w", err)
	}

	return rollbackDeployment, nil
}

// GetRollbackTargets returns available rollback targets for an application
func (s *Service) GetRollbackTargets(ctx context.Context, appID string, limit int) ([]DeploymentRecord, error) {
	if limit <= 0 {
		limit = 10 // Default to last 10 deployments
	}

	rows, err := s.db.QueryContext(ctx, `
		SELECT id, application_id, image, replicas, environment, git_hash, status, message, deployed_by, deployed_at
		FROM gitops_deployments 
		WHERE application_id = ? AND status IN ('deployed', 'rolled_back')
		ORDER BY deployed_at DESC
		LIMIT ?`,
		appID, limit)
	if err != nil {
		return nil, fmt.Errorf("failed to get rollback targets: %w", err)
	}
	defer rows.Close()

	var deployments []DeploymentRecord
	for rows.Next() {
		var deployment DeploymentRecord
		var envJSON string

		err := rows.Scan(&deployment.ID, &deployment.ApplicationID, &deployment.Image,
			&deployment.Replicas, &envJSON, &deployment.GitHash, &deployment.Status,
			&deployment.Message, &deployment.DeployedBy, &deployment.DeployedAt)
		if err != nil {
			return nil, fmt.Errorf("failed to scan rollback target: %w", err)
		}

		json.Unmarshal([]byte(envJSON), &deployment.Environment)
		deployments = append(deployments, deployment)
	}

	return deployments, nil
}

// generateDeploymentManifest generates a Kubernetes deployment manifest using templates
func (s *Service) generateDeploymentManifest(app *Application) (string, error) {
	options := map[string]interface{}{
		"service":     true,
		"ingress":     false,
		"autoscaling": false,
	}
	
	return s.GenerateFullManifest(app, options)
}

// CreateAlert creates a new monitoring alert
func (s *Service) CreateAlert(ctx context.Context, alertType, severity, title, message string, metadata map[string]string) (*Alert, error) {
	alert := &Alert{
		ID:        uuid.New().String(),
		Type:      alertType,
		Severity:  severity,
		Title:     title,
		Message:   message,
		Metadata:  metadata,
		Status:    "active",
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	metadataJSON, _ := json.Marshal(alert.Metadata)

	_, err := s.db.ExecContext(ctx, `
		INSERT INTO gitops_alerts (id, type, severity, title, message, metadata, status, created_at, updated_at)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		alert.ID, alert.Type, alert.Severity, alert.Title, alert.Message,
		string(metadataJSON), alert.Status, alert.CreatedAt, alert.UpdatedAt)
	if err != nil {
		return nil, fmt.Errorf("failed to create alert: %w", err)
	}

	return alert, nil
}

// ListAlerts returns all active alerts
func (s *Service) ListAlerts(ctx context.Context) ([]Alert, error) {
	rows, err := s.db.QueryContext(ctx, `
		SELECT id, type, severity, title, message, metadata, status, created_at, updated_at, resolved_at
		FROM gitops_alerts
		WHERE status IN ('active', 'acknowledged')
		ORDER BY created_at DESC`)
	if err != nil {
		return nil, fmt.Errorf("failed to list alerts: %w", err)
	}
	defer rows.Close()

	var alerts []Alert
	for rows.Next() {
		var alert Alert
		var metadataJSON string
		var resolvedAt *time.Time

		err := rows.Scan(&alert.ID, &alert.Type, &alert.Severity, &alert.Title,
			&alert.Message, &metadataJSON, &alert.Status, &alert.CreatedAt, &alert.UpdatedAt, &resolvedAt)
		if err != nil {
			return nil, fmt.Errorf("failed to scan alert: %w", err)
		}

		json.Unmarshal([]byte(metadataJSON), &alert.Metadata)
		alert.ResolvedAt = resolvedAt
		alerts = append(alerts, alert)
	}

	return alerts, nil
}

// AcknowledgeAlert acknowledges an alert
func (s *Service) AcknowledgeAlert(ctx context.Context, alertID string) error {
	_, err := s.db.ExecContext(ctx, `
		UPDATE gitops_alerts 
		SET status = 'acknowledged', updated_at = ?
		WHERE id = ?`,
		time.Now(), alertID)
	if err != nil {
		return fmt.Errorf("failed to acknowledge alert: %w", err)
	}

	return nil
}

// ResolveAlert resolves an alert
func (s *Service) ResolveAlert(ctx context.Context, alertID string) error {
	now := time.Now()
	_, err := s.db.ExecContext(ctx, `
		UPDATE gitops_alerts 
		SET status = 'resolved', updated_at = ?, resolved_at = ?
		WHERE id = ?`,
		now, now, alertID)
	if err != nil {
		return fmt.Errorf("failed to resolve alert: %w", err)
	}

	return nil
}

// GetHealthMetrics returns GitOps health metrics
func (s *Service) GetHealthMetrics(ctx context.Context) (*HealthMetrics, error) {
	metrics := &HealthMetrics{
		RepositoryHealth:  make(map[string]string),
		ApplicationHealth: make(map[string]string),
		SyncTrends:        make([]SyncTrendPoint, 0),
	}

	// Get repository counts
	err := s.db.QueryRowContext(ctx, `
		SELECT 
			COUNT(*) as total,
			COUNT(CASE WHEN status = 'active' THEN 1 END) as healthy
		FROM gitops_repositories`).Scan(&metrics.TotalRepositories, &metrics.HealthyRepositories)
	if err != nil {
		return nil, fmt.Errorf("failed to get repository metrics: %w", err)
	}

	// Get application counts
	err = s.db.QueryRowContext(ctx, `
		SELECT 
			COUNT(*) as total,
			COUNT(CASE WHEN health = 'healthy' THEN 1 END) as healthy,
			COUNT(CASE WHEN sync_status = 'synced' THEN 1 END) as synced,
			COUNT(CASE WHEN sync_status = 'out_of_sync' THEN 1 END) as out_of_sync
		FROM gitops_applications`).Scan(&metrics.TotalApplications, &metrics.HealthyApplications,
		&metrics.SyncedApplications, &metrics.OutOfSyncApplications)
	if err != nil {
		return nil, fmt.Errorf("failed to get application metrics: %w", err)
	}

	// Get deployment failure count (last 24 hours)
	err = s.db.QueryRowContext(ctx, `
		SELECT COUNT(*) 
		FROM gitops_deployments 
		WHERE status = 'failed' AND deployed_at > datetime('now', '-1 day')`).Scan(&metrics.FailedDeployments)
	if err != nil {
		return nil, fmt.Errorf("failed to get deployment failure metrics: %w", err)
	}

	// Get sync failure count (last 24 hours) 
	err = s.db.QueryRowContext(ctx, `
		SELECT COUNT(*) 
		FROM gitops_deployments 
		WHERE status = 'failed' AND message LIKE '%sync%' AND deployed_at > datetime('now', '-1 day')`).Scan(&metrics.RecentSyncFailures)
	if err != nil {
		return nil, fmt.Errorf("failed to get sync failure metrics: %w", err)
	}

	// Get alert counts
	err = s.db.QueryRowContext(ctx, `
		SELECT 
			COUNT(*) as total,
			COUNT(CASE WHEN severity = 'critical' THEN 1 END) as critical
		FROM gitops_alerts 
		WHERE status = 'active'`).Scan(&metrics.ActiveAlerts, &metrics.CriticalAlerts)
	if err != nil {
		return nil, fmt.Errorf("failed to get alert metrics: %w", err)
	}

	// Get last sync time
	var lastSyncTime *time.Time
	err = s.db.QueryRowContext(ctx, `
		SELECT MAX(last_sync) 
		FROM gitops_repositories 
		WHERE last_sync IS NOT NULL`).Scan(&lastSyncTime)
	if err == nil {
		metrics.LastSyncTime = lastSyncTime
	}

	// Get repository health
	repoRows, err := s.db.QueryContext(ctx, `
		SELECT name, status FROM gitops_repositories`)
	if err == nil {
		defer repoRows.Close()
		for repoRows.Next() {
			var name, status string
			if err := repoRows.Scan(&name, &status); err == nil {
				metrics.RepositoryHealth[name] = status
			}
		}
	}

	// Get application health
	appRows, err := s.db.QueryContext(ctx, `
		SELECT name, health FROM gitops_applications`)
	if err == nil {
		defer appRows.Close()
		for appRows.Next() {
			var name, health string
			if err := appRows.Scan(&name, &health); err == nil {
				metrics.ApplicationHealth[name] = health
			}
		}
	}

	// Get sync trends (last 24 hours in 4-hour intervals)
	trendRows, err := s.db.QueryContext(ctx, `
		SELECT 
			datetime(deployed_at, 'start of hour', printf('-%d hours', (strftime('%H', deployed_at) % 4))) as interval_start,
			COUNT(*) as total_syncs,
			COUNT(CASE WHEN status = 'deployed' THEN 1 END) as successful_syncs,
			COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_syncs
		FROM gitops_deployments 
		WHERE deployed_at > datetime('now', '-1 day')
		GROUP BY interval_start
		ORDER BY interval_start`)
	if err == nil {
		defer trendRows.Close()
		for trendRows.Next() {
			var intervalStart time.Time
			var totalSyncs, successfulSyncs, failedSyncs int
			if err := trendRows.Scan(&intervalStart, &totalSyncs, &successfulSyncs, &failedSyncs); err == nil {
				successRate := float64(successfulSyncs) / float64(totalSyncs) * 100
				if totalSyncs == 0 {
					successRate = 100.0
				}
				
				metrics.SyncTrends = append(metrics.SyncTrends, SyncTrendPoint{
					Timestamp:    intervalStart,
					SuccessRate:  successRate,
					SyncCount:    totalSyncs,
					FailureCount: failedSyncs,
				})
			}
		}
	}

	return metrics, nil
}

// MonitorHealth performs health checks and creates alerts as needed
func (s *Service) MonitorHealth(ctx context.Context) error {
	// Check repository connectivity
	repos, err := s.ListRepositories(ctx)
	if err != nil {
		s.CreateAlert(ctx, "repository_check_failed", "warning", "Repository Check Failed",
			"Failed to check repository health", map[string]string{"error": err.Error()})
		return err
	}

	for _, repo := range repos {
		// Check if repository is reachable
		if !s.gitClient.IsReachable() {
			s.CreateAlert(ctx, "repository_unreachable", "critical", "Repository Unreachable",
				fmt.Sprintf("Repository %s is unreachable", repo.Name),
				map[string]string{"repository": repo.Name, "url": repo.URL})
		}

		// Check if repository hasn't synced recently (last 6 hours)
		if repo.LastSync != nil && time.Since(*repo.LastSync) > 6*time.Hour {
			s.CreateAlert(ctx, "sync_outdated", "warning", "Sync Outdated",
				fmt.Sprintf("Repository %s hasn't synced in over 6 hours", repo.Name),
				map[string]string{"repository": repo.Name, "last_sync": repo.LastSync.String()})
		}
	}

	// Check application health
	apps, err := s.ListApplications(ctx)
	if err != nil {
		s.CreateAlert(ctx, "application_check_failed", "warning", "Application Check Failed",
			"Failed to check application health", map[string]string{"error": err.Error()})
		return err
	}

	for _, app := range apps {
		// Check if application is unhealthy
		if app.Health == "degraded" || app.Health == "missing" {
			s.CreateAlert(ctx, "application_unhealthy", "critical", "Application Unhealthy",
				fmt.Sprintf("Application %s is %s", app.Name, app.Health),
				map[string]string{"application": app.Name, "health": app.Health, "namespace": app.Namespace})
		}

		// Check if application is out of sync
		if app.SyncStatus == "out_of_sync" {
			s.CreateAlert(ctx, "drift_detected", "warning", "Configuration Drift Detected",
				fmt.Sprintf("Application %s is out of sync with Git", app.Name),
				map[string]string{"application": app.Name, "namespace": app.Namespace})
		}
	}

	// Check for recent deployment failures
	failureCount := 0
	err = s.db.QueryRowContext(ctx, `
		SELECT COUNT(*) 
		FROM gitops_deployments 
		WHERE status = 'failed' AND deployed_at > datetime('now', '-1 hour')`).Scan(&failureCount)
	if err == nil && failureCount > 3 {
		s.CreateAlert(ctx, "deployment_failure", "critical", "High Deployment Failure Rate",
			fmt.Sprintf("%d deployments failed in the last hour", failureCount),
			map[string]string{"failure_count": fmt.Sprintf("%d", failureCount)})
	}

	return nil
}



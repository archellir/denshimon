package http

import (
	"context"
	"database/sql"
	"encoding/json"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/archellir/denshimon/internal/gitops"
	"github.com/archellir/denshimon/pkg/response"
	"log/slog"
)

// GitOpsHandler handles GitOps-related HTTP requests
type GitOpsHandler struct {
	service    *gitops.Service
	syncEngine *gitops.SyncEngine
	logger     *slog.Logger
}

// NewGitOpsHandler creates a new GitOps handler
func NewGitOpsHandler(db *sql.DB, baseInfraRepoURL, localRepoPath string, logger *slog.Logger) *GitOpsHandler {
	service := gitops.NewService(db, baseInfraRepoURL, localRepoPath)
	syncEngine := gitops.NewSyncEngine(service)
	
	return &GitOpsHandler{
		service:    service,
		syncEngine: syncEngine,
		logger:     logger,
	}
}

// extractGitOpsIDFromPath extracts ID from GitOps URL path
func extractGitOpsIDFromPath(path, prefix string) string {
	if !strings.HasPrefix(path, prefix) {
		return ""
	}
	
	remaining := strings.TrimPrefix(path, prefix)
	if remaining == "" {
		return ""
	}
	
	// Remove leading slash
	if strings.HasPrefix(remaining, "/") {
		remaining = remaining[1:]
	}
	
	// Get first segment
	parts := strings.Split(remaining, "/")
	if len(parts) > 0 {
		return parts[0]
	}
	
	return ""
}

// ListRepositories lists all GitOps repositories
func (h *GitOpsHandler) ListRepositories(w http.ResponseWriter, r *http.Request) {
	repos, err := h.service.ListRepositories(r.Context())
	if err != nil {
		h.logger.Error("failed to list repositories", "error", err)
		response.SendError(w, http.StatusInternalServerError, "Failed to list repositories")
		return
	}

	response.SendSuccess(w, repos)
}

// CreateRepository creates a new GitOps repository
func (h *GitOpsHandler) CreateRepository(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Name        string `json:"name"`
		URL         string `json:"url"`
		Branch      string `json:"branch"`
		Description string `json:"description"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.SendError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if req.Name == "" || req.URL == "" {
		response.SendError(w, http.StatusBadRequest, "Name and URL are required")
		return
	}

	if req.Branch == "" {
		req.Branch = "main"
	}

	repo, err := h.service.CreateRepository(r.Context(), req.Name, req.URL, req.Branch, req.Description)
	if err != nil {
		h.logger.Error("failed to create repository", "error", err)
		response.SendError(w, http.StatusInternalServerError, "Failed to create repository")
		return
	}

	response.SendSuccess(w, repo)
}

// SyncRepository synchronizes a repository
func (h *GitOpsHandler) SyncRepository(w http.ResponseWriter, r *http.Request) {
	repoID := extractGitOpsIDFromPath(r.URL.Path, "/api/gitops/repositories/")
	if repoID == "" {
		response.SendError(w, http.StatusBadRequest, "Invalid repository ID")
		return
	}

	if err := h.service.SyncRepository(r.Context(), repoID); err != nil {
		h.logger.Error("failed to sync repository", "repo_id", repoID, "error", err)
		response.SendError(w, http.StatusInternalServerError, "Failed to sync repository")
		return
	}

	response.SendSuccess(w, map[string]string{"status": "synced"})
}

// InitializeRepository initializes the GitOps repository
func (h *GitOpsHandler) InitializeRepository(w http.ResponseWriter, r *http.Request) {
	if err := h.service.InitializeRepository(); err != nil {
		h.logger.Error("failed to initialize repository", "error", err)
		response.SendError(w, http.StatusInternalServerError, "Failed to initialize repository")
		return
	}

	response.SendSuccess(w, map[string]string{"status": "initialized"})
}

// ListApplications lists all GitOps applications
func (h *GitOpsHandler) ListApplications(w http.ResponseWriter, r *http.Request) {
	apps, err := h.service.ListApplications(r.Context())
	if err != nil {
		h.logger.Error("failed to list applications", "error", err)
		response.SendError(w, http.StatusInternalServerError, "Failed to list applications")
		return
	}

	response.SendSuccess(w, apps)
}

// CreateApplication creates a new GitOps application
func (h *GitOpsHandler) CreateApplication(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Name         string            `json:"name"`
		Namespace    string            `json:"namespace"`
		RepositoryID string            `json:"repository_id"`
		Path         string            `json:"path"`
		Image        string            `json:"image"`
		Replicas     int               `json:"replicas"`
		Resources    map[string]string `json:"resources"`
		Environment  map[string]string `json:"environment"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.SendError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if req.Name == "" || req.Namespace == "" || req.Image == "" {
		response.SendError(w, http.StatusBadRequest, "Name, namespace, and image are required")
		return
	}

	if req.Replicas <= 0 {
		req.Replicas = 1
	}

	app, err := h.service.CreateApplication(r.Context(), req.Name, req.Namespace, req.RepositoryID, 
		req.Path, req.Image, req.Replicas, req.Resources, req.Environment)
	if err != nil {
		h.logger.Error("failed to create application", "error", err)
		response.SendError(w, http.StatusInternalServerError, "Failed to create application")
		return
	}

	response.SendSuccess(w, app)
}

// GetApplication returns a specific application
func (h *GitOpsHandler) GetApplication(w http.ResponseWriter, r *http.Request) {
	appID := extractGitOpsIDFromPath(r.URL.Path, "/api/gitops/applications/")
	if appID == "" {
		response.SendError(w, http.StatusBadRequest, "Invalid application ID")
		return
	}

	apps, err := h.service.ListApplications(r.Context())
	if err != nil {
		h.logger.Error("failed to get application", "error", err)
		response.SendError(w, http.StatusInternalServerError, "Failed to get application")
		return
	}

	for _, app := range apps {
		if app.ID == appID {
			response.SendSuccess(w, app)
			return
		}
	}

	response.SendError(w, http.StatusNotFound, "Application not found")
}

// DeployApplication deploys an application
func (h *GitOpsHandler) DeployApplication(w http.ResponseWriter, r *http.Request) {
	appID := extractGitOpsIDFromPath(r.URL.Path, "/api/gitops/applications/")
	if appID == "" {
		response.SendError(w, http.StatusBadRequest, "Invalid application ID")
		return
	}

	var req struct {
		DeployedBy string `json:"deployed_by"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.SendError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if req.DeployedBy == "" {
		req.DeployedBy = "system"
	}

	deployment, err := h.service.DeployApplication(r.Context(), appID, req.DeployedBy)
	if err != nil {
		h.logger.Error("failed to deploy application", "app_id", appID, "error", err)
		response.SendError(w, http.StatusInternalServerError, "Failed to deploy application")
		return
	}

	response.SendSuccess(w, deployment)
}

// GetDeploymentHistory returns deployment history for an application
func (h *GitOpsHandler) GetDeploymentHistory(w http.ResponseWriter, r *http.Request) {
	appID := extractGitOpsIDFromPath(r.URL.Path, "/api/gitops/applications/")
	if appID == "" {
		response.SendError(w, http.StatusBadRequest, "Invalid application ID")
		return
	}

	history, err := h.service.GetDeploymentHistory(r.Context(), appID)
	if err != nil {
		h.logger.Error("failed to get deployment history", "app_id", appID, "error", err)
		response.SendError(w, http.StatusInternalServerError, "Failed to get deployment history")
		return
	}

	response.SendSuccess(w, history)
}

// GenerateManifest generates a Kubernetes manifest
func (h *GitOpsHandler) GenerateManifest(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Application  gitops.Application    `json:"application"`
		ResourceType string                `json:"resource_type"`
		Options      map[string]interface{} `json:"options"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.SendError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if req.ResourceType == "" {
		req.ResourceType = "Deployment"
	}

	if req.Options == nil {
		req.Options = make(map[string]interface{})
	}

	var manifest string
	var err error

	if req.ResourceType == "Full" {
		manifest, err = h.service.GenerateFullManifest(&req.Application, req.Options)
	} else {
		manifest, err = h.service.GenerateManifest(&req.Application, req.ResourceType, req.Options)
	}

	if err != nil {
		h.logger.Error("failed to generate manifest", "resource_type", req.ResourceType, "error", err)
		response.SendError(w, http.StatusInternalServerError, "Failed to generate manifest")
		return
	}

	response.SendSuccess(w, map[string]string{"manifest": manifest})
}

// ValidateManifest validates a Kubernetes manifest
func (h *GitOpsHandler) ValidateManifest(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Manifest string `json:"manifest"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.SendError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if err := h.service.ValidateManifest(req.Manifest); err != nil {
		response.SendError(w, http.StatusBadRequest, err.Error())
		return
	}

	response.SendSuccess(w, map[string]string{"status": "valid"})
}

// GetSupportedTypes returns supported resource types
func (h *GitOpsHandler) GetSupportedTypes(w http.ResponseWriter, r *http.Request) {
	types := h.service.GetSupportedResourceTypes()
	response.SendSuccess(w, types)
}

// GetSyncStatus returns current sync status
func (h *GitOpsHandler) GetSyncStatus(w http.ResponseWriter, r *http.Request) {
	status, err := h.syncEngine.GetSyncStatus(r.Context())
	if err != nil {
		h.logger.Error("failed to get sync status", "error", err)
		response.SendError(w, http.StatusInternalServerError, "Failed to get sync status")
		return
	}

	response.SendSuccess(w, status)
}

// StartSync starts automatic synchronization
func (h *GitOpsHandler) StartSync(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Config *gitops.SyncConfig `json:"config"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.SendError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if req.Config == nil {
		req.Config = gitops.DefaultSyncConfig()
	}

	// Start sync in background
	go func() {
		ctx := context.Background()
		if err := h.syncEngine.StartAutoSync(ctx, req.Config); err != nil {
			h.logger.Error("auto sync failed", "error", err)
		}
	}()

	response.SendSuccess(w, map[string]string{"status": "started"})
}

// ForceSync forces immediate synchronization
func (h *GitOpsHandler) ForceSync(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Config *gitops.SyncConfig `json:"config"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.SendError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if req.Config == nil {
		req.Config = gitops.DefaultSyncConfig()
	}

	if err := h.syncEngine.ForceSync(r.Context(), req.Config); err != nil {
		h.logger.Error("failed to force sync", "error", err)
		response.SendError(w, http.StatusInternalServerError, "Failed to force sync")
		return
	}

	response.SendSuccess(w, map[string]string{"status": "completed"})
}

// SyncApplication synchronizes a specific application
func (h *GitOpsHandler) SyncApplication(w http.ResponseWriter, r *http.Request) {
	appID := extractGitOpsIDFromPath(r.URL.Path, "/api/gitops/sync/application/")
	if appID == "" {
		response.SendError(w, http.StatusBadRequest, "Invalid application ID")
		return
	}

	var req struct {
		Config *gitops.SyncConfig `json:"config"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.SendError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if req.Config == nil {
		req.Config = gitops.DefaultSyncConfig()
	}

	if err := h.syncEngine.SyncApplicationToGit(r.Context(), appID, req.Config); err != nil {
		h.logger.Error("failed to sync application", "app_id", appID, "error", err)
		response.SendError(w, http.StatusInternalServerError, "Failed to sync application")
		return
	}

	response.SendSuccess(w, map[string]string{"status": "synced"})
}

// RollbackApplication rolls back an application to a previous deployment
func (h *GitOpsHandler) RollbackApplication(w http.ResponseWriter, r *http.Request) {
	appID := extractGitOpsIDFromPath(r.URL.Path, "/api/gitops/applications/")
	if appID == "" {
		response.SendError(w, http.StatusBadRequest, "Invalid application ID")
		return
	}

	var req struct {
		TargetDeploymentID string `json:"target_deployment_id"`
		RolledBackBy       string `json:"rolled_back_by"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.SendError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if req.TargetDeploymentID == "" {
		response.SendError(w, http.StatusBadRequest, "Target deployment ID is required")
		return
	}

	if req.RolledBackBy == "" {
		req.RolledBackBy = "system"
	}

	deployment, err := h.service.RollbackApplication(r.Context(), appID, req.TargetDeploymentID, req.RolledBackBy)
	if err != nil {
		h.logger.Error("failed to rollback application", "app_id", appID, "target_deployment", req.TargetDeploymentID, "error", err)
		response.SendError(w, http.StatusInternalServerError, "Failed to rollback application")
		return
	}

	response.SendSuccess(w, deployment)
}

// GetRollbackTargets returns available rollback targets for an application
func (h *GitOpsHandler) GetRollbackTargets(w http.ResponseWriter, r *http.Request) {
	appID := extractGitOpsIDFromPath(r.URL.Path, "/api/gitops/applications/")
	if appID == "" {
		response.SendError(w, http.StatusBadRequest, "Invalid application ID")
		return
	}

	// Parse limit from query parameters
	limit := 10 // default
	if limitStr := r.URL.Query().Get("limit"); limitStr != "" {
		if parsedLimit, err := strconv.Atoi(limitStr); err == nil && parsedLimit > 0 {
			limit = parsedLimit
		}
	}

	targets, err := h.service.GetRollbackTargets(r.Context(), appID, limit)
	if err != nil {
		h.logger.Error("failed to get rollback targets", "app_id", appID, "error", err)
		response.SendError(w, http.StatusInternalServerError, "Failed to get rollback targets")
		return
	}

	response.SendSuccess(w, targets)
}

// ProcessWebhook handles incoming Git webhook notifications for auto-sync
func (h *GitOpsHandler) ProcessWebhook(w http.ResponseWriter, r *http.Request) {
	var payload gitops.WebhookPayload

	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		h.logger.Error("failed to decode webhook payload", "error", err)
		response.SendError(w, http.StatusBadRequest, "Invalid webhook payload")
		return
	}

	// Validate webhook payload
	if payload.Repository.FullName == "" || payload.Ref == "" {
		h.logger.Error("incomplete webhook payload", "repository", payload.Repository.FullName, "ref", payload.Ref)
		response.SendError(w, http.StatusBadRequest, "Incomplete webhook payload")
		return
	}

	h.logger.Info("received webhook", 
		"repository", payload.Repository.FullName,
		"ref", payload.Ref,
		"pusher", payload.Pusher.Name)

	// Process webhook in background to avoid timeout
	go func() {
		ctx := context.Background()
		result := &gitops.WebhookSyncResult{
			Repository:  payload.Repository.FullName,
			Branch:      strings.TrimPrefix(payload.Ref, "refs/heads/"),
			CommitHash:  payload.After,
			ProcessedAt: time.Now(),
		}

		if err := h.syncEngine.ProcessWebhook(ctx, &payload); err != nil {
			h.logger.Error("webhook processing failed", "error", err, "repository", payload.Repository.FullName)
			result.Error = err.Error()
		} else {
			result.Triggered = true
			// Count synced applications
			apps, err := h.service.ListApplications(ctx)
			if err == nil {
				result.SyncedApps = len(apps)
			}
		}

		h.logger.Info("webhook processing completed", 
			"repository", result.Repository,
			"triggered", result.Triggered,
			"synced_apps", result.SyncedApps)
	}()

	// Return immediate response to avoid webhook timeout
	response.SendSuccess(w, map[string]string{
		"status":     "received",
		"repository": payload.Repository.FullName,
		"ref":        payload.Ref,
		"processed":  "async",
	})
}

// ConfigureWebhook provides webhook configuration details
func (h *GitOpsHandler) ConfigureWebhook(w http.ResponseWriter, r *http.Request) {
	config := map[string]interface{}{
		"webhook_url": "/api/gitops/webhook",
		"method":      "POST",
		"content_type": "application/json",
		"events": []string{
			"push",
			"repository",
		},
		"description": "GitOps auto-sync webhook for base infrastructure repository",
		"example_payload": map[string]interface{}{
			"repository": map[string]string{
				"name":           "base_infrastructure",
				"full_name":      "org/base_infrastructure", 
				"clone_url":      "https://github.com/org/base_infrastructure.git",
				"default_branch": "main",
			},
			"ref":    "refs/heads/main",
			"before": "0000000000000000000000000000000000000000",
			"after":  "abcdef1234567890abcdef1234567890abcdef12",
			"commits": []map[string]interface{}{
				{
					"id":       "abcdef1234567890abcdef1234567890abcdef12",
					"message":  "feat(k8s): update deployment manifests",
					"modified": []string{"k8s/production/api.yaml"},
					"added":    []string{},
					"removed":  []string{},
				},
			},
			"pusher": map[string]string{
				"name":  "user",
				"email": "user@example.com",
			},
		},
	}

	response.SendSuccess(w, config)
}

// GetHealthMetrics returns GitOps health metrics
func (h *GitOpsHandler) GetHealthMetrics(w http.ResponseWriter, r *http.Request) {
	metrics, err := h.service.GetHealthMetrics(r.Context())
	if err != nil {
		h.logger.Error("failed to get health metrics", "error", err)
		response.SendError(w, http.StatusInternalServerError, "Failed to get health metrics")
		return
	}

	response.SendSuccess(w, metrics)
}

// ListAlerts returns active GitOps alerts
func (h *GitOpsHandler) ListAlerts(w http.ResponseWriter, r *http.Request) {
	alerts, err := h.service.ListAlerts(r.Context())
	if err != nil {
		h.logger.Error("failed to list alerts", "error", err)
		response.SendError(w, http.StatusInternalServerError, "Failed to list alerts")
		return
	}

	response.SendSuccess(w, alerts)
}

// AcknowledgeAlert acknowledges a GitOps alert
func (h *GitOpsHandler) AcknowledgeAlert(w http.ResponseWriter, r *http.Request) {
	var req struct {
		AlertID string `json:"alert_id"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.SendError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if req.AlertID == "" {
		response.SendError(w, http.StatusBadRequest, "Alert ID is required")
		return
	}

	if err := h.service.AcknowledgeAlert(r.Context(), req.AlertID); err != nil {
		h.logger.Error("failed to acknowledge alert", "alert_id", req.AlertID, "error", err)
		response.SendError(w, http.StatusInternalServerError, "Failed to acknowledge alert")
		return
	}

	response.SendSuccess(w, map[string]string{"status": "acknowledged"})
}

// ResolveAlert resolves a GitOps alert
func (h *GitOpsHandler) ResolveAlert(w http.ResponseWriter, r *http.Request) {
	var req struct {
		AlertID string `json:"alert_id"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.SendError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if req.AlertID == "" {
		response.SendError(w, http.StatusBadRequest, "Alert ID is required")
		return
	}

	if err := h.service.ResolveAlert(r.Context(), req.AlertID); err != nil {
		h.logger.Error("failed to resolve alert", "alert_id", req.AlertID, "error", err)
		response.SendError(w, http.StatusInternalServerError, "Failed to resolve alert")
		return
	}

	response.SendSuccess(w, map[string]string{"status": "resolved"})
}

// TriggerHealthCheck triggers a health check and monitoring scan
func (h *GitOpsHandler) TriggerHealthCheck(w http.ResponseWriter, r *http.Request) {
	// Run health check in background to avoid timeout
	go func() {
		ctx := context.Background()
		if err := h.service.MonitorHealth(ctx); err != nil {
			h.logger.Error("health check failed", "error", err)
		}
	}()

	response.SendSuccess(w, map[string]string{"status": "triggered"})
}

// ListTemplates returns all available templates
func (h *GitOpsHandler) ListTemplates(w http.ResponseWriter, r *http.Request) {
	templates, err := h.service.ListTemplates(r.Context())
	if err != nil {
		h.logger.Error("failed to list templates", "error", err)
		response.SendError(w, http.StatusInternalServerError, "Failed to list templates")
		return
	}

	response.SendSuccess(w, map[string]interface{}{"templates": templates})
}

// GetTemplate returns a specific template
func (h *GitOpsHandler) GetTemplate(w http.ResponseWriter, r *http.Request) {
	templateID := extractGitOpsIDFromPath(r.URL.Path, "/api/gitops/templates/")
	if templateID == "" {
		response.SendError(w, http.StatusBadRequest, "Invalid template ID")
		return
	}

	template, err := h.service.GetTemplate(r.Context(), templateID)
	if err != nil {
		h.logger.Error("failed to get template", "template_id", templateID, "error", err)
		response.SendError(w, http.StatusInternalServerError, "Failed to get template")
		return
	}

	response.SendSuccess(w, template)
}
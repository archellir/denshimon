package http

import (
	"context"
	"database/sql"
	"encoding/json"
	"net/http"
	"strings"

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
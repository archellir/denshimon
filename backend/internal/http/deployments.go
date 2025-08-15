package http

import (
	"encoding/json"
	"net/http"
	"strings"
	"time"

	"github.com/archellir/denshimon/internal/deployments"
	"github.com/archellir/denshimon/internal/providers"
	"github.com/archellir/denshimon/internal/providers/registries"
	"github.com/google/uuid"
)

// DeploymentHandlers handles HTTP requests for deployments
type DeploymentHandlers struct {
	service          *deployments.Service
	registryManager  *providers.RegistryManager
	providerRegistry *providers.ProviderRegistry
}

// NewDeploymentHandlers creates new deployment handlers
func NewDeploymentHandlers(service *deployments.Service, registryManager *providers.RegistryManager, providerRegistry *providers.ProviderRegistry) *DeploymentHandlers {
	return &DeploymentHandlers{
		service:          service,
		registryManager:  registryManager,
		providerRegistry: providerRegistry,
	}
}

// Registry Management

// ListRegistries returns all configured registries
func (h *DeploymentHandlers) ListRegistries(w http.ResponseWriter, r *http.Request) {
	registries := []providers.Registry{} // This would come from database
	writeJSON(w, registries)
}

// AddRegistry adds a new registry configuration
func (h *DeploymentHandlers) AddRegistry(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Name   string                   `json:"name"`
		Type   string                   `json:"type"`
		Config providers.RegistryConfig `json:"config"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	// Validate required fields
	if req.Name == "" || req.Type == "" {
		http.Error(w, "Name and type are required", http.StatusBadRequest)
		return
	}

	// Create registry record
	registry := providers.Registry{
		ID:        uuid.New().String(),
		Name:      req.Name,
		Type:      req.Type,
		Config:    req.Config,
		Status:    "pending",
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	// Test connection
	if err := h.registryManager.AddRegistry(r.Context(), registry); err != nil {
		registry.Status = "error"
		registry.Error = err.Error()
		writeJSON(w, registry)
		return
	}

	registry.Status = "connected"
	// In a real implementation, save to database here

	writeJSON(w, registry)
}

// DeleteRegistry removes a registry configuration
func (h *DeploymentHandlers) DeleteRegistry(w http.ResponseWriter, r *http.Request) {
	registryID := extractIDFromPath(r.URL.Path, "/api/deployments/registries/")
	if registryID == "" {
		http.Error(w, "Registry ID is required", http.StatusBadRequest)
		return
	}

	h.registryManager.RemoveRegistry(r.Context(), registryID)
	// In a real implementation, delete from database here

	w.WriteHeader(http.StatusNoContent)
}

// TestRegistry tests connection to a registry
func (h *DeploymentHandlers) TestRegistry(w http.ResponseWriter, r *http.Request) {
	registryID := extractIDFromPath(r.URL.Path, "/api/deployments/registries/")
	registryID = strings.TrimSuffix(registryID, "/test")

	if registryID == "" {
		http.Error(w, "Registry ID is required", http.StatusBadRequest)
		return
	}

	provider, err := h.registryManager.GetProvider(registryID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusNotFound)
		return
	}

	if err := provider.TestConnection(r.Context()); err != nil {
		writeJSON(w, map[string]interface{}{
			"success": false,
			"error":   err.Error(),
		})
		return
	}

	writeJSON(w, map[string]interface{}{
		"success": true,
		"message": "Connection successful",
	})
}

// Image Management

// ListImages returns images from all or specific registries
func (h *DeploymentHandlers) ListImages(w http.ResponseWriter, r *http.Request) {
	registryID := r.URL.Query().Get("registry")
	namespace := r.URL.Query().Get("namespace")

	var allImages []providers.ContainerImage

	if registryID != "" {
		// Get images from specific registry
		provider, err := h.registryManager.GetProvider(registryID)
		if err != nil {
			http.Error(w, err.Error(), http.StatusNotFound)
			return
		}

		images, err := provider.ListImages(r.Context(), namespace)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		allImages = images
	} else {
		// Get images from all registries
		registryIDs := h.registryManager.ListRegistries()
		for _, id := range registryIDs {
			provider, err := h.registryManager.GetProvider(id)
			if err != nil {
				continue
			}

			images, err := provider.ListImages(r.Context(), namespace)
			if err != nil {
				continue
			}
			allImages = append(allImages, images...)
		}
	}

	writeJSON(w, allImages)
}

// SearchImages searches for images across registries
func (h *DeploymentHandlers) SearchImages(w http.ResponseWriter, r *http.Request) {
	query := r.URL.Query().Get("q")
	if query == "" {
		http.Error(w, "Search query is required", http.StatusBadRequest)
		return
	}

	var results []providers.ContainerImage

	// Search across all registries
	registryIDs := h.registryManager.ListRegistries()
	for _, registryID := range registryIDs {
		provider, err := h.registryManager.GetProvider(registryID)
		if err != nil {
			continue
		}

		images, err := provider.ListImages(r.Context(), "")
		if err != nil {
			continue
		}

		// Filter images by search query
		for _, img := range images {
			if strings.Contains(strings.ToLower(img.Repository), strings.ToLower(query)) ||
				strings.Contains(strings.ToLower(img.Tag), strings.ToLower(query)) {
				results = append(results, img)
			}
		}
	}

	writeJSON(w, results)
}

// GetImageTags returns available tags for an image
func (h *DeploymentHandlers) GetImageTags(w http.ResponseWriter, r *http.Request) {
	// Extract registry and repo from path: /api/deployments/images/{registry}/{repo}/tags
	pathParts := strings.Split(strings.TrimPrefix(r.URL.Path, "/api/deployments/images/"), "/")
	if len(pathParts) < 3 {
		http.Error(w, "Invalid path format", http.StatusBadRequest)
		return
	}

	registryID := pathParts[0]
	repository := strings.Join(pathParts[1:len(pathParts)-1], "/") // Handle multi-part repo names

	provider, err := h.registryManager.GetProvider(registryID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusNotFound)
		return
	}

	tags, err := provider.GetImageTags(r.Context(), repository)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	writeJSON(w, map[string][]string{"tags": tags})
}

// Deployment Management

// CreateDeployment creates a new deployment
func (h *DeploymentHandlers) CreateDeployment(w http.ResponseWriter, r *http.Request) {
	var req deployments.CreateDeploymentRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	// Validate required fields
	if req.Name == "" || req.Namespace == "" || req.Image == "" {
		http.Error(w, "Name, namespace, and image are required", http.StatusBadRequest)
		return
	}

	if req.Replicas == 0 {
		req.Replicas = 1
	}

	deployment, err := h.service.CreateDeployment(r.Context(), req)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	writeJSON(w, deployment)
}

// ListDeployments returns all deployments
func (h *DeploymentHandlers) ListDeployments(w http.ResponseWriter, r *http.Request) {
	namespace := r.URL.Query().Get("namespace")

	deployments, err := h.service.ListDeployments(r.Context(), namespace)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	writeJSON(w, deployments)
}

// GetDeployment returns a specific deployment
func (h *DeploymentHandlers) GetDeployment(w http.ResponseWriter, r *http.Request) {
	deploymentID := extractIDFromPath(r.URL.Path, "/api/deployments/")
	if deploymentID == "" {
		http.Error(w, "Deployment ID is required", http.StatusBadRequest)
		return
	}

	deployment, err := h.service.GetDeployment(r.Context(), deploymentID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusNotFound)
		return
	}

	writeJSON(w, deployment)
}

// ScaleDeployment changes the number of replicas
func (h *DeploymentHandlers) ScaleDeployment(w http.ResponseWriter, r *http.Request) {
	deploymentID := extractIDFromPath(r.URL.Path, "/api/deployments/")
	deploymentID = strings.TrimSuffix(deploymentID, "/scale")

	if deploymentID == "" {
		http.Error(w, "Deployment ID is required", http.StatusBadRequest)
		return
	}

	var req deployments.ScaleDeploymentRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	if req.Replicas < 0 {
		http.Error(w, "Replicas must be non-negative", http.StatusBadRequest)
		return
	}

	if err := h.service.ScaleDeployment(r.Context(), deploymentID, req.Replicas); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	writeJSON(w, map[string]string{"message": "Deployment scaled successfully"})
}

// UpdateDeployment updates a deployment
func (h *DeploymentHandlers) UpdateDeployment(w http.ResponseWriter, r *http.Request) {
	deploymentID := extractIDFromPath(r.URL.Path, "/api/deployments/")
	if deploymentID == "" {
		http.Error(w, "Deployment ID is required", http.StatusBadRequest)
		return
	}

	var req deployments.UpdateDeploymentRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	if err := h.service.UpdateDeployment(r.Context(), deploymentID, req); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	deployment, err := h.service.GetDeployment(r.Context(), deploymentID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	writeJSON(w, deployment)
}

// DeleteDeployment removes a deployment
func (h *DeploymentHandlers) DeleteDeployment(w http.ResponseWriter, r *http.Request) {
	deploymentID := extractIDFromPath(r.URL.Path, "/api/deployments/")
	if deploymentID == "" {
		http.Error(w, "Deployment ID is required", http.StatusBadRequest)
		return
	}

	if err := h.service.DeleteDeployment(r.Context(), deploymentID); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// GetDeploymentPods returns pods for a deployment
func (h *DeploymentHandlers) GetDeploymentPods(w http.ResponseWriter, r *http.Request) {
	deploymentID := extractIDFromPath(r.URL.Path, "/api/deployments/")
	deploymentID = strings.TrimSuffix(deploymentID, "/pods")

	if deploymentID == "" {
		http.Error(w, "Deployment ID is required", http.StatusBadRequest)
		return
	}

	deployment, err := h.service.GetDeployment(r.Context(), deploymentID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusNotFound)
		return
	}

	writeJSON(w, deployment.Pods)
}

// GetAvailableNodes returns information about available nodes
func (h *DeploymentHandlers) GetAvailableNodes(w http.ResponseWriter, r *http.Request) {
	nodes, err := h.service.GetAvailableNodes(r.Context())
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	writeJSON(w, nodes)
}

// RestartDeployment restarts all pods in a deployment
func (h *DeploymentHandlers) RestartDeployment(w http.ResponseWriter, r *http.Request) {
	deploymentID := extractIDFromPath(r.URL.Path, "/api/deployments/")
	deploymentID = strings.TrimSuffix(deploymentID, "/restart")

	if deploymentID == "" {
		http.Error(w, "Deployment ID is required", http.StatusBadRequest)
		return
	}

	if err := h.service.RestartDeployment(r.Context(), deploymentID); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	writeJSON(w, map[string]string{"message": "Deployment restart initiated"})
}

// GetDeploymentHistory returns the history of changes for a deployment
func (h *DeploymentHandlers) GetDeploymentHistory(w http.ResponseWriter, r *http.Request) {
	deploymentID := extractIDFromPath(r.URL.Path, "/api/deployments/")
	deploymentID = strings.TrimSuffix(deploymentID, "/history")

	if deploymentID == "" {
		http.Error(w, "Deployment ID is required", http.StatusBadRequest)
		return
	}

	history, err := h.service.GetDeploymentHistory(r.Context(), deploymentID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	writeJSON(w, history)
}

// Helper functions

func writeJSON(w http.ResponseWriter, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(data)
}

func extractIDFromPath(path, prefix string) string {
	if !strings.HasPrefix(path, prefix) {
		return ""
	}

	remaining := strings.TrimPrefix(path, prefix)
	parts := strings.Split(remaining, "/")
	if len(parts) > 0 && parts[0] != "" {
		return parts[0]
	}

	return ""
}

// InitializeProviders sets up all registry providers
func InitializeProviders() *providers.ProviderRegistry {
	registry := providers.NewProviderRegistry()

	// Register all supported providers
	registry.Register("dockerhub", func(config providers.RegistryConfig) (providers.RegistryProvider, error) {
		return registries.NewDockerHubProvider(config)
	})

	registry.Register("gitea", func(config providers.RegistryConfig) (providers.RegistryProvider, error) {
		return registries.NewGiteaProvider(config)
	})

	registry.Register("generic", func(config providers.RegistryConfig) (providers.RegistryProvider, error) {
		return registries.NewGenericProvider(config)
	})

	return registry
}

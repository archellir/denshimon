package http

import (
	"encoding/json"
	"net/http"

	"github.com/archellir/denshimon/internal/secrets"
)

type SecretsHandlers struct {
	secretsService *secrets.SecretsService
}

func NewSecretsHandlers(secretsService *secrets.SecretsService) *SecretsHandlers {
	return &SecretsHandlers{
		secretsService: secretsService,
	}
}

// GetSecrets handles GET /api/secrets
func (h *SecretsHandlers) GetSecrets(w http.ResponseWriter, r *http.Request) {
	secrets, err := h.secretsService.GetSecrets()
	if err != nil {
		http.Error(w, "Failed to get secrets: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"data":    secrets,
	})
}

// UpdateSecret handles PUT /api/secrets/{key}
func (h *SecretsHandlers) UpdateSecret(w http.ResponseWriter, r *http.Request) {
	// Extract key from URL path
	key := r.URL.Path[len("/api/secrets/"):]
	if key == "" {
		http.Error(w, "Secret key is required", http.StatusBadRequest)
		return
	}

	var request struct {
		Value string `json:"value"`
	}

	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		http.Error(w, "Invalid JSON: "+err.Error(), http.StatusBadRequest)
		return
	}

	if request.Value == "" {
		http.Error(w, "Secret value is required", http.StatusBadRequest)
		return
	}

	if err := h.secretsService.UpdateSecret(key, request.Value); err != nil {
		http.Error(w, "Failed to update secret: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"message": "Secret updated successfully",
	})
}

// SetAllSecrets handles PUT /api/secrets
func (h *SecretsHandlers) SetAllSecrets(w http.ResponseWriter, r *http.Request) {
	var request struct {
		Secrets []secrets.Secret `json:"secrets"`
	}

	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		http.Error(w, "Invalid JSON: "+err.Error(), http.StatusBadRequest)
		return
	}

	// Validate secrets
	if err := h.secretsService.ValidateSecrets(request.Secrets); err != nil {
		http.Error(w, "Validation failed: "+err.Error(), http.StatusBadRequest)
		return
	}

	if err := h.secretsService.SetSecrets(request.Secrets); err != nil {
		http.Error(w, "Failed to set secrets: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"message": "Secrets updated successfully",
	})
}

// GetTemplate handles GET /api/secrets/template
func (h *SecretsHandlers) GetTemplate(w http.ResponseWriter, r *http.Request) {
	template, err := h.secretsService.GetTemplate()
	if err != nil {
		http.Error(w, "Failed to get template: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"data":    template,
	})
}

// ApplySecrets handles POST /api/secrets/apply
func (h *SecretsHandlers) ApplySecrets(w http.ResponseWriter, r *http.Request) {
	var request struct {
		Namespace string `json:"namespace"`
	}

	// Parse request body (optional namespace)
	json.NewDecoder(r.Body).Decode(&request)

	namespace := request.Namespace
	if namespace == "" {
		namespace = "default"
	}

	if err := h.secretsService.ApplyToKubernetes(r.Context(), namespace); err != nil {
		http.Error(w, "Failed to apply secrets to Kubernetes: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"message": "Secrets applied to Kubernetes successfully",
	})
}

// GetSecretStatus handles GET /api/secrets/status
func (h *SecretsHandlers) GetSecretStatus(w http.ResponseWriter, r *http.Request) {
	namespace := r.URL.Query().Get("namespace")
	if namespace == "" {
		namespace = "default"
	}

	// Get local secrets status
	localStatus := h.secretsService.GetSecretsStatus()

	// Get Kubernetes status
	k8sStatus, err := h.secretsService.GetKubernetesSecretStatus(r.Context(), namespace)
	if err != nil {
		// Don't fail completely if K8s check fails
		k8sStatus = map[string]interface{}{
			"exists_in_k8s": false,
			"matches_local": false,
			"namespace":     namespace,
			"error":         err.Error(),
		}
	}

	// Combine statuses
	status := map[string]interface{}{
		"local":      localStatus,
		"kubernetes": k8sStatus,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"data":    status,
	})
}
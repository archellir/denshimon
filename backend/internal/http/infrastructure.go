package http

import (
	"net/http"
	"sync"
	"time"

	"github.com/archellir/denshimon/pkg/response"
)

// InfrastructureHandlers handles infrastructure-related HTTP requests
type InfrastructureHandlers struct {
	mu     sync.RWMutex
	alerts map[string]*InfrastructureAlert
}

// InfrastructureAlert represents an infrastructure alert
type InfrastructureAlert struct {
	ID           string    `json:"id"`
	Type         string    `json:"type"`
	Severity     string    `json:"severity"`
	Message      string    `json:"message"`
	Timestamp    time.Time `json:"timestamp"`
	Acknowledged bool      `json:"acknowledged"`
	Source       string    `json:"source"`
}

// NewInfrastructureHandlers creates a new infrastructure handlers instance
func NewInfrastructureHandlers() *InfrastructureHandlers {
	h := &InfrastructureHandlers{
		alerts: make(map[string]*InfrastructureAlert),
	}
	
	// Note: Alerts should be populated from real infrastructure monitoring
	// Mock alerts removed - frontend will handle mock data when needed
	
	return h
}

// Mock alert initialization removed - alerts should come from real monitoring systems
// Frontend will handle mock data display when backend returns empty results

// GetAlerts returns all infrastructure alerts
func (h *InfrastructureHandlers) GetAlerts(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		response.SendError(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	h.mu.RLock()
	defer h.mu.RUnlock()

	// Convert map to slice
	alerts := make([]*InfrastructureAlert, 0, len(h.alerts))
	for _, alert := range h.alerts {
		alerts = append(alerts, alert)
	}

	response.SendSuccess(w, alerts)
}

// AcknowledgeAlert marks an infrastructure alert as acknowledged
func (h *InfrastructureHandlers) AcknowledgeAlert(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		response.SendError(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	// Extract alert ID from URL path
	// URL pattern: /api/infrastructure/alerts/{alertId}/acknowledge
	path := r.URL.Path
	// Remove the prefix to get the alert ID
	// Expected format: /api/infrastructure/alerts/{alertId}/acknowledge
	var alertID string
	
	// Parse path to extract alert ID
	if len(path) > len("/api/infrastructure/alerts/") {
		pathWithoutPrefix := path[len("/api/infrastructure/alerts/"):]
		if acknowledgeIndex := len(pathWithoutPrefix) - len("/acknowledge"); acknowledgeIndex > 0 {
			alertID = pathWithoutPrefix[:acknowledgeIndex]
		}
	}

	if alertID == "" {
		response.SendError(w, http.StatusBadRequest, "Alert ID is required")
		return
	}

	h.mu.Lock()
	defer h.mu.Unlock()

	alert, exists := h.alerts[alertID]
	if !exists {
		response.SendError(w, http.StatusNotFound, "Alert not found")
		return
	}

	// Mark as acknowledged
	alert.Acknowledged = true
	h.alerts[alertID] = alert

	response.SendSuccess(w, map[string]interface{}{
		"message": "Alert acknowledged successfully",
		"alertId": alertID,
	})
}

// GetServices returns mock service health data (placeholder for now)
func (h *InfrastructureHandlers) GetServices(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		response.SendError(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	// Return empty for now - service health data is handled by mock data in frontend
	response.SendSuccess(w, []interface{}{})
}

// GetStatus returns infrastructure status (placeholder for now)
func (h *InfrastructureHandlers) GetStatus(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		response.SendError(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	// Return empty for now - infrastructure status is handled by mock data in frontend
	response.SendSuccess(w, map[string]interface{}{})
}

// RefreshServices triggers a refresh of infrastructure services
func (h *InfrastructureHandlers) RefreshServices(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		response.SendError(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	// For now, just return success - in a real implementation this would trigger
	// actual service health checks and data refresh
	response.SendSuccess(w, map[string]string{
		"message": "Service refresh triggered successfully",
	})
}
package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/archellir/denshimon/internal/common"
	"github.com/archellir/denshimon/internal/providers/certificates"
)

type CertificateHandlers struct {
	manager certificates.CertificateProvider
}

func NewCertificateHandlers(manager certificates.CertificateProvider) *CertificateHandlers {
	return &CertificateHandlers{
		manager: manager,
	}
}

// APIResponse represents a standard API response

// GetCertificates returns all monitored certificates
func (h *CertificateHandlers) GetCertificates(w http.ResponseWriter, r *http.Request) {
	certificates, err := h.manager.GetAllCertificates()
	if err != nil {
		h.writeError(w, http.StatusInternalServerError, "Failed to get certificates", err)
		return
	}

	h.writeSuccess(w, certificates)
}

// GetCertificate returns a specific certificate by domain
func (h *CertificateHandlers) GetCertificate(w http.ResponseWriter, r *http.Request) {
	domain := r.URL.Query().Get("domain")
	if domain == "" {
		h.writeError(w, http.StatusBadRequest, "Domain parameter is required", nil)
		return
	}

	certificate, err := h.manager.GetCertificate(domain)
	if err != nil {
		h.writeError(w, http.StatusNotFound, "Certificate not found", err)
		return
	}

	h.writeSuccess(w, certificate)
}

// CheckCertificate performs a fresh certificate check for a domain
func (h *CertificateHandlers) CheckCertificate(w http.ResponseWriter, r *http.Request) {
	domain := r.URL.Query().Get("domain")
	if domain == "" {
		h.writeError(w, http.StatusBadRequest, "Domain parameter is required", nil)
		return
	}

	portStr := r.URL.Query().Get("port")
	port := 443 // default HTTPS port
	if portStr != "" {
		if p, err := strconv.Atoi(portStr); err == nil {
			port = p
		}
	}

	check, err := h.manager.CheckCertificate(domain, port)
	if err != nil {
		h.writeError(w, http.StatusInternalServerError, "Failed to check certificate", err)
		return
	}

	h.writeSuccess(w, check)
}

// GetCertificateStats returns certificate statistics
func (h *CertificateHandlers) GetCertificateStats(w http.ResponseWriter, r *http.Request) {
	stats, err := h.manager.GetCertificateStats()
	if err != nil {
		h.writeError(w, http.StatusInternalServerError, "Failed to get certificate statistics", err)
		return
	}

	h.writeSuccess(w, stats)
}

// GetDomainConfigs returns all domain configurations
func (h *CertificateHandlers) GetDomainConfigs(w http.ResponseWriter, r *http.Request) {
	configs, err := h.manager.GetDomainConfigs()
	if err != nil {
		h.writeError(w, http.StatusInternalServerError, "Failed to get domain configurations", err)
		return
	}

	h.writeSuccess(w, configs)
}

// AddDomainConfig adds a new domain to monitor
func (h *CertificateHandlers) AddDomainConfig(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		h.writeError(w, http.StatusMethodNotAllowed, "Method not allowed", nil)
		return
	}

	var config certificates.DomainConfig
	if err := json.NewDecoder(r.Body).Decode(&config); err != nil {
		h.writeError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}

	// Validate required fields
	if config.Domain == "" {
		h.writeError(w, http.StatusBadRequest, "Domain is required", nil)
		return
	}
	if config.Port == 0 {
		config.Port = 443 // default HTTPS port
	}
	if config.CheckInterval == 0 {
		config.CheckInterval = 60 // default 1 hour
	}

	err := h.manager.AddDomainConfig(config)
	if err != nil {
		h.writeError(w, http.StatusInternalServerError, "Failed to add domain configuration", err)
		return
	}

	h.writeSuccess(w, config)
}

// RemoveDomainConfig removes a domain from monitoring
func (h *CertificateHandlers) RemoveDomainConfig(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodDelete {
		h.writeError(w, http.StatusMethodNotAllowed, "Method not allowed", nil)
		return
	}

	domain := r.URL.Query().Get("domain")
	if domain == "" {
		h.writeError(w, http.StatusBadRequest, "Domain parameter is required", nil)
		return
	}

	err := h.manager.RemoveDomainConfig(domain)
	if err != nil {
		h.writeError(w, http.StatusInternalServerError, "Failed to remove domain configuration", err)
		return
	}

	h.writeSuccess(w, map[string]string{"message": "Domain configuration removed successfully"})
}

// GetAlerts returns active certificate alerts
func (h *CertificateHandlers) GetAlerts(w http.ResponseWriter, r *http.Request) {
	alerts, err := h.manager.GetAlerts()
	if err != nil {
		h.writeError(w, http.StatusInternalServerError, "Failed to get certificate alerts", err)
		return
	}

	h.writeSuccess(w, alerts)
}

// AcknowledgeAlert marks an alert as acknowledged
func (h *CertificateHandlers) AcknowledgeAlert(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		h.writeError(w, http.StatusMethodNotAllowed, "Method not allowed", nil)
		return
	}

	alertID := r.URL.Query().Get("alert_id")
	if alertID == "" {
		h.writeError(w, http.StatusBadRequest, "Alert ID parameter is required", nil)
		return
	}

	err := h.manager.AcknowledgeAlert(alertID)
	if err != nil {
		h.writeError(w, http.StatusInternalServerError, "Failed to acknowledge alert", err)
		return
	}

	h.writeSuccess(w, map[string]string{"message": "Alert acknowledged successfully"})
}

// RefreshCertificates triggers a refresh of all certificates
func (h *CertificateHandlers) RefreshCertificates(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		h.writeError(w, http.StatusMethodNotAllowed, "Method not allowed", nil)
		return
	}

	// Cast to Manager to access RefreshAllCertificates
	if manager, ok := h.manager.(*certificates.Manager); ok {
		err := manager.RefreshAllCertificates()
		if err != nil {
			h.writeError(w, http.StatusInternalServerError, "Failed to refresh certificates", err)
			return
		}
	} else {
		h.writeError(w, http.StatusInternalServerError, "Refresh not supported", nil)
		return
	}

	h.writeSuccess(w, map[string]string{"message": "Certificate refresh completed"})
}

// Helper methods
func (h *CertificateHandlers) writeSuccess(w http.ResponseWriter, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)

	response := common.APIResponse{
		Success: true,
		Data:    data,
	}

	json.NewEncoder(w).Encode(response)
}

func (h *CertificateHandlers) writeError(w http.ResponseWriter, statusCode int, message string, err error) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)

	response := common.APIResponse{
		Success: false,
		Message: message,
	}

	if err != nil {
		response.Error = err.Error()
	}

	json.NewEncoder(w).Encode(response)
}

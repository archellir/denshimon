package certificates

import (
	"fmt"
	"sync"
	"time"
)

// Manager manages SSL certificate monitoring for multiple domains
type Manager struct {
	checker      *SSLChecker
	domains      map[string]DomainConfig
	certificates map[string]*Certificate
	alerts       map[string]*CertificateAlert
	mutex        sync.RWMutex
}

// NewManager creates a new certificate manager
func NewManager() *Manager {
	manager := &Manager{
		checker:      NewSSLChecker(),
		domains:      make(map[string]DomainConfig),
		certificates: make(map[string]*Certificate),
		alerts:       make(map[string]*CertificateAlert),
	}

	// Initialize with default base infrastructure domains
	manager.initializeDefaultDomains()

	return manager
}

// initializeDefaultDomains sets up monitoring for base infrastructure domains
func (m *Manager) initializeDefaultDomains() {
	defaultDomains := []DomainConfig{
		{
			Domain:        "git.arcbjorn.com",
			Service:       "Gitea",
			Port:          443,
			Enabled:       true,
			CheckInterval: 60, // 1 hour
		},
		{
			Domain:        "analytics.arcbjorn.com",
			Service:       "Umami",
			Port:          443,
			Enabled:       true,
			CheckInterval: 60,
		},
		{
			Domain:        "memos.arcbjorn.com",
			Service:       "Memos",
			Port:          443,
			Enabled:       true,
			CheckInterval: 60,
		},
		{
			Domain:        "server.arcbjorn.com",
			Service:       "Filebrowser",
			Port:          443,
			Enabled:       true,
			CheckInterval: 60,
		},
		{
			Domain:        "uptime.arcbjorn.com",
			Service:       "Uptime Kuma",
			Port:          443,
			Enabled:       true,
			CheckInterval: 60,
		},
		{
			Domain:        "dashboard.arcbjorn.com",
			Service:       "Dashboard",
			Port:          443,
			Enabled:       true,
			CheckInterval: 60,
		},
		{
			Domain:        "homepage.arcbjorn.com",
			Service:       "Homepage",
			Port:          443,
			Enabled:       true,
			CheckInterval: 60,
		},
		{
			Domain:        "argentinamusic.space",
			Service:       "Argentina Music",
			Port:          443,
			Enabled:       true,
			CheckInterval: 60,
		},
		{
			Domain:        "humansconnect.ai",
			Service:       "Humans Connect",
			Port:          443,
			Enabled:       true,
			CheckInterval: 60,
		},
	}

	for _, domain := range defaultDomains {
		m.domains[domain.Domain] = domain
	}
}

// CheckCertificate checks the SSL certificate for a specific domain
func (m *Manager) CheckCertificate(domain string, port int) (*CertificateCheck, error) {
	return m.checker.CheckCertificate(domain, port)
}

// GetCertificate gets certificate information for a domain
func (m *Manager) GetCertificate(domain string) (*Certificate, error) {
	m.mutex.RLock()
	cert, exists := m.certificates[domain]
	m.mutex.RUnlock()

	if !exists {
		// Check if domain is configured
		domainConfig, domainExists := m.domains[domain]
		if !domainExists {
			return nil, fmt.Errorf("domain %s not configured for monitoring", domain)
		}

		// Perform fresh check
		check, err := m.checker.CheckCertificate(domain, domainConfig.Port)
		if err != nil {
			return nil, fmt.Errorf("failed to check certificate for %s: %v", domain, err)
		}

		if !check.Success {
			return nil, fmt.Errorf("certificate check failed for %s: %s", domain, *check.ErrorMessage)
		}

		m.mutex.Lock()
		m.certificates[domain] = check.Certificate
		m.mutex.Unlock()

		return check.Certificate, nil
	}

	return cert, nil
}

// GetAllCertificates returns all monitored certificates
func (m *Manager) GetAllCertificates() ([]Certificate, error) {
	m.mutex.RLock()
	defer m.mutex.RUnlock()

	certificates := make([]Certificate, 0, len(m.certificates))
	for _, cert := range m.certificates {
		certificates = append(certificates, *cert)
	}

	return certificates, nil
}

// RefreshAllCertificates checks all configured domains and updates certificates
func (m *Manager) RefreshAllCertificates() error {
	m.mutex.RLock()
	domains := make([]DomainConfig, 0, len(m.domains))
	for _, domain := range m.domains {
		if domain.Enabled {
			domains = append(domains, domain)
		}
	}
	m.mutex.RUnlock()

	for _, domain := range domains {
		check, err := m.checker.CheckCertificate(domain.Domain, domain.Port)
		if err != nil {
			// Log error but continue with other domains
			continue
		}

		m.mutex.Lock()
		if check.Success && check.Certificate != nil {
			m.certificates[domain.Domain] = check.Certificate
			m.updateAlertsForCertificate(check.Certificate)
		} else {
			// Create unreachable alert
			m.createUnreachableAlert(domain.Domain, check.ErrorMessage)
		}

		// Update last check time
		now := time.Now()
		domainConfig := m.domains[domain.Domain]
		domainConfig.LastCheck = &now
		m.domains[domain.Domain] = domainConfig
		m.mutex.Unlock()
	}

	return nil
}

// GetCertificateStats returns certificate statistics
func (m *Manager) GetCertificateStats() (*CertificateStats, error) {
	m.mutex.RLock()
	defer m.mutex.RUnlock()

	stats := &CertificateStats{}

	for _, cert := range m.certificates {
		stats.Total++

		switch cert.Status {
		case StatusValid:
			stats.Valid++
		case StatusExpiringSoon:
			stats.ExpiringSoon++
		case StatusExpiringCritical:
			stats.ExpiringCritical++
		case StatusExpired:
			stats.Expired++
		case StatusInvalid:
			stats.Invalid++
		case StatusUnreachable:
			stats.Unreachable++
		}
	}

	return stats, nil
}

// AddDomainConfig adds a domain to monitor
func (m *Manager) AddDomainConfig(config DomainConfig) error {
	m.mutex.Lock()
	defer m.mutex.Unlock()

	m.domains[config.Domain] = config
	return nil
}

// RemoveDomainConfig removes a domain from monitoring
func (m *Manager) RemoveDomainConfig(domain string) error {
	m.mutex.Lock()
	defer m.mutex.Unlock()

	delete(m.domains, domain)
	delete(m.certificates, domain)

	// Remove related alerts
	for alertID, alert := range m.alerts {
		if alert.Domain == domain {
			delete(m.alerts, alertID)
		}
	}

	return nil
}

// GetDomainConfigs returns all domain configurations
func (m *Manager) GetDomainConfigs() ([]DomainConfig, error) {
	m.mutex.RLock()
	defer m.mutex.RUnlock()

	configs := make([]DomainConfig, 0, len(m.domains))
	for _, config := range m.domains {
		configs = append(configs, config)
	}

	return configs, nil
}

// GetAlerts returns active certificate alerts
func (m *Manager) GetAlerts() ([]CertificateAlert, error) {
	m.mutex.RLock()
	defer m.mutex.RUnlock()

	alerts := make([]CertificateAlert, 0, len(m.alerts))
	for _, alert := range m.alerts {
		if !alert.Acknowledged {
			alerts = append(alerts, *alert)
		}
	}

	return alerts, nil
}

// AcknowledgeAlert marks an alert as acknowledged
func (m *Manager) AcknowledgeAlert(alertID string) error {
	m.mutex.Lock()
	defer m.mutex.Unlock()

	if alert, exists := m.alerts[alertID]; exists {
		alert.Acknowledged = true
		return nil
	}

	return fmt.Errorf("alert %s not found", alertID)
}

// updateAlertsForCertificate creates/updates alerts for a certificate
func (m *Manager) updateAlertsForCertificate(cert *Certificate) {
	alertID := fmt.Sprintf("%s-expiry", cert.Domain)

	// Remove existing expiry alert if certificate is valid
	if cert.Status == StatusValid {
		delete(m.alerts, alertID)
		return
	}

	// Create/update expiry alert
	var alertType, severity, message string

	switch cert.Status {
	case StatusExpiringCritical:
		alertType = "expiration"
		severity = "critical"
		message = fmt.Sprintf("SSL certificate for %s expires in %d days", cert.Domain, cert.DaysUntilExpiry)
	case StatusExpiringSoon:
		alertType = "expiration"
		severity = "warning"
		message = fmt.Sprintf("SSL certificate for %s expires in %d days", cert.Domain, cert.DaysUntilExpiry)
	case StatusExpired:
		alertType = "expiration"
		severity = "critical"
		message = fmt.Sprintf("SSL certificate for %s has expired", cert.Domain)
	case StatusInvalid:
		alertType = "invalid"
		severity = "critical"
		message = fmt.Sprintf("SSL certificate for %s is invalid", cert.Domain)
	}

	m.alerts[alertID] = &CertificateAlert{
		ID:           alertID,
		Domain:       cert.Domain,
		Type:         alertType,
		Severity:     severity,
		Message:      message,
		Timestamp:    time.Now(),
		Acknowledged: false,
	}
}

// createUnreachableAlert creates an alert for unreachable domains
func (m *Manager) createUnreachableAlert(domain string, errorMessage *string) {
	alertID := fmt.Sprintf("%s-unreachable", domain)

	message := fmt.Sprintf("Unable to check SSL certificate for %s", domain)
	if errorMessage != nil {
		message = fmt.Sprintf("Unable to check SSL certificate for %s: %s", domain, *errorMessage)
	}

	m.alerts[alertID] = &CertificateAlert{
		ID:           alertID,
		Domain:       domain,
		Type:         "unreachable",
		Severity:     "warning",
		Message:      message,
		Timestamp:    time.Now(),
		Acknowledged: false,
	}
}

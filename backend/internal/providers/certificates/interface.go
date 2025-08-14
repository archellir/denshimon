package certificates

// CertificateProvider defines the interface for SSL certificate monitoring
type CertificateProvider interface {
	// CheckCertificate checks the SSL certificate for a specific domain
	CheckCertificate(domain string, port int) (*CertificateCheck, error)
	
	// GetCertificate gets certificate information for a domain
	GetCertificate(domain string) (*Certificate, error)
	
	// GetAllCertificates returns all monitored certificates
	GetAllCertificates() ([]Certificate, error)
	
	// GetCertificateStats returns certificate statistics
	GetCertificateStats() (*CertificateStats, error)
	
	// AddDomainConfig adds a domain to monitor
	AddDomainConfig(config DomainConfig) error
	
	// RemoveDomainConfig removes a domain from monitoring
	RemoveDomainConfig(domain string) error
	
	// GetDomainConfigs returns all domain configurations
	GetDomainConfigs() ([]DomainConfig, error)
	
	// GetAlerts returns active certificate alerts
	GetAlerts() ([]CertificateAlert, error)
	
	// AcknowledgeAlert marks an alert as acknowledged
	AcknowledgeAlert(alertID string) error
}
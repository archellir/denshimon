package certificates

import (
	"time"
)

// CertificateStatus represents the status of an SSL certificate
type CertificateStatus string

const (
	StatusValid           CertificateStatus = "valid"
	StatusExpiringSoon    CertificateStatus = "expiring_soon"    // < 30 days
	StatusExpiringCritical CertificateStatus = "expiring_critical" // < 7 days
	StatusExpired         CertificateStatus = "expired"
	StatusInvalid         CertificateStatus = "invalid"
	StatusUnreachable     CertificateStatus = "unreachable"
)

// Certificate represents SSL certificate information
type Certificate struct {
	ID              string                `json:"id"`
	Domain          string                `json:"domain"`
	Service         string                `json:"service"`
	Issuer          string                `json:"issuer"`
	SerialNumber    string                `json:"serialNumber"`
	Subject         string                `json:"subject"`
	NotBefore       time.Time             `json:"notBefore"`
	NotAfter        time.Time             `json:"notAfter"`
	DaysUntilExpiry int                   `json:"daysUntilExpiry"`
	Status          CertificateStatus     `json:"status"`
	Algorithm       string                `json:"algorithm"`
	KeySize         int                   `json:"keySize"`
	Fingerprint     string                `json:"fingerprint"`
	Chain           []CertificateChainInfo `json:"chain"`
	LastChecked     time.Time             `json:"lastChecked"`
}

// CertificateChainInfo represents a certificate in the chain
type CertificateChainInfo struct {
	Subject      string    `json:"subject"`
	Issuer       string    `json:"issuer"`
	NotBefore    time.Time `json:"notBefore"`
	NotAfter     time.Time `json:"notAfter"`
	SerialNumber string    `json:"serialNumber"`
}

// CertificateCheck represents the result of checking a certificate
type CertificateCheck struct {
	Domain      string       `json:"domain"`
	Timestamp   time.Time    `json:"timestamp"`
	Success     bool         `json:"success"`
	ErrorMessage *string     `json:"errorMessage,omitempty"`
	Certificate *Certificate `json:"certificate,omitempty"`
}

// CertificateAlert represents an alert for certificate issues
type CertificateAlert struct {
	ID           string    `json:"id"`
	Domain       string    `json:"domain"`
	Type         string    `json:"type"`         // expiration, invalid, unreachable
	Severity     string    `json:"severity"`     // warning, critical
	Message      string    `json:"message"`
	Timestamp    time.Time `json:"timestamp"`
	Acknowledged bool      `json:"acknowledged"`
}

// CertificateStats represents certificate statistics
type CertificateStats struct {
	Total             int `json:"total"`
	Valid             int `json:"valid"`
	ExpiringSoon      int `json:"expiringSoon"`
	ExpiringCritical  int `json:"expiringCritical"`
	Expired           int `json:"expired"`
	Invalid           int `json:"invalid"`
	Unreachable       int `json:"unreachable"`
}

// DomainConfig represents configuration for monitoring a domain
type DomainConfig struct {
	Domain        string     `json:"domain"`
	Service       string     `json:"service"`
	Port          int        `json:"port"`
	Enabled       bool       `json:"enabled"`
	CheckInterval int        `json:"checkInterval"` // minutes
	LastCheck     *time.Time `json:"lastCheck,omitempty"`
}

// GetStatus determines certificate status based on expiration
func (c *Certificate) GetStatus() CertificateStatus {
	now := time.Now()
	daysUntilExpiry := int(c.NotAfter.Sub(now).Hours() / 24)
	c.DaysUntilExpiry = daysUntilExpiry

	if now.After(c.NotAfter) {
		return StatusExpired
	}
	
	if daysUntilExpiry <= 7 {
		return StatusExpiringCritical
	}
	
	if daysUntilExpiry <= 30 {
		return StatusExpiringSoon
	}
	
	return StatusValid
}
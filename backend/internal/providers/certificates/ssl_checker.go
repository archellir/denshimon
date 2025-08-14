package certificates

import (
	"crypto/sha1"
	"crypto/tls"
	"crypto/x509"
	"fmt"
	"net"
	"strings"
	"time"
)

// SSLChecker implements SSL certificate checking functionality
type SSLChecker struct {
	timeout time.Duration
}

// NewSSLChecker creates a new SSL certificate checker
func NewSSLChecker() *SSLChecker {
	return &SSLChecker{
		timeout: 10 * time.Second,
	}
}

// CheckCertificate checks the SSL certificate for a domain
func (s *SSLChecker) CheckCertificate(domain string, port int) (*CertificateCheck, error) {
	check := &CertificateCheck{
		Domain:    domain,
		Timestamp: time.Now(),
		Success:   false,
	}

	// Create TLS connection
	dialer := &net.Dialer{
		Timeout: s.timeout,
	}

	address := fmt.Sprintf("%s:%d", domain, port)
	conn, err := tls.DialWithDialer(dialer, "tcp", address, &tls.Config{
		ServerName: domain,
	})

	if err != nil {
		errorMsg := fmt.Sprintf("Failed to connect to %s: %v", address, err)
		check.ErrorMessage = &errorMsg
		return check, nil
	}
	defer conn.Close()

	// Get certificate chain
	certs := conn.ConnectionState().PeerCertificates
	if len(certs) == 0 {
		errorMsg := "No certificates found in chain"
		check.ErrorMessage = &errorMsg
		return check, nil
	}

	// Process the leaf certificate (first in chain)
	cert := certs[0]
	
	// Create certificate chain info
	chain := make([]CertificateChainInfo, len(certs))
	for i, c := range certs {
		chain[i] = CertificateChainInfo{
			Subject:      c.Subject.String(),
			Issuer:       c.Issuer.String(),
			NotBefore:    c.NotBefore,
			NotAfter:     c.NotAfter,
			SerialNumber: c.SerialNumber.String(),
		}
	}

	// Calculate fingerprint
	fingerprint := fmt.Sprintf("%x", sha1.Sum(cert.Raw))
	
	// Determine key size
	keySize := 0
	switch pub := cert.PublicKey.(type) {
	case *x509.PublicKey:
		// RSA key
		if rsaKey, ok := pub.(*x509.PublicKey); ok {
			if rsaPubKey, ok := rsaKey.(*interface{}).(interface{ Size() int }); ok {
				keySize = rsaPubKey.Size() * 8
			}
		}
	default:
		keySize = cert.PublicKeyAlgorithm.String() // fallback
	}

	// Create certificate object
	certificate := &Certificate{
		ID:           fmt.Sprintf("%s-%s", domain, cert.SerialNumber.String()),
		Domain:       domain,
		Service:      s.getServiceName(domain),
		Issuer:       cert.Issuer.CommonName,
		SerialNumber: cert.SerialNumber.String(),
		Subject:      cert.Subject.String(),
		NotBefore:    cert.NotBefore,
		NotAfter:     cert.NotAfter,
		Algorithm:    cert.SignatureAlgorithm.String(),
		KeySize:      keySize,
		Fingerprint:  fingerprint,
		Chain:        chain,
		LastChecked:  time.Now(),
	}

	// Set status
	certificate.Status = certificate.GetStatus()

	check.Certificate = certificate
	check.Success = true

	return check, nil
}

// getServiceName maps domain to service name
func (s *SSLChecker) getServiceName(domain string) string {
	serviceMap := map[string]string{
		"git.arcbjorn.com":       "Gitea",
		"analytics.arcbjorn.com": "Umami",
		"memos.arcbjorn.com":     "Memos",
		"server.arcbjorn.com":    "Filebrowser",
		"uptime.arcbjorn.com":    "Uptime Kuma",
		"dashboard.arcbjorn.com": "Dashboard",
		"homepage.arcbjorn.com":  "Homepage",
		"argentinamusic.space":   "Argentina Music",
		"humansconnect.ai":       "Humans Connect",
	}

	if service, exists := serviceMap[strings.ToLower(domain)]; exists {
		return service
	}

	return "Unknown Service"
}

// VerifyHostname verifies if the certificate is valid for the given hostname
func (s *SSLChecker) VerifyHostname(cert *x509.Certificate, hostname string) error {
	return cert.VerifyHostname(hostname)
}

// IsExpiringSoon checks if certificate is expiring within the given days
func (s *SSLChecker) IsExpiringSoon(cert *x509.Certificate, days int) bool {
	return time.Until(cert.NotAfter) <= time.Duration(days)*24*time.Hour
}

// GetCertificateStatus determines the status of a certificate
func (s *SSLChecker) GetCertificateStatus(cert *x509.Certificate) CertificateStatus {
	now := time.Now()
	
	if now.After(cert.NotAfter) {
		return StatusExpired
	}
	
	daysUntilExpiry := int(cert.NotAfter.Sub(now).Hours() / 24)
	
	if daysUntilExpiry <= 7 {
		return StatusExpiringCritical
	}
	
	if daysUntilExpiry <= 30 {
		return StatusExpiringSoon
	}
	
	return StatusValid
}
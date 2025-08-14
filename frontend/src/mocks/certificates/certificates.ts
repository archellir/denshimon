import { Certificate, CertificateAlert, CertificateStats, DomainConfig, CertificateCheck, CertificateStatus } from '@/types/certificates';

export const mockCertificates: Certificate[] = [
  {
    id: 'git.arcbjorn.com-cert',
    domain: 'git.arcbjorn.com',
    service: 'Gitea',
    issuer: 'Let\'s Encrypt Authority X3',
    serialNumber: '03:b2:e1:72:5a:8b:9f:4e:12:3d:45:67:89:ab:cd:ef',
    subject: 'CN=git.arcbjorn.com',
    notBefore: '2024-01-15T10:30:00Z',
    notAfter: '2024-04-15T10:30:00Z',
    daysUntilExpiry: 45,
    status: CertificateStatus.VALID,
    algorithm: 'SHA256-RSA',
    keySize: 2048,
    fingerprint: '2f:d4:e1:6c:90:78:45:12:ab:cd:ef:90:12:34:56:78:9a:bc:de:f0',
    chain: [
      {
        subject: 'CN=git.arcbjorn.com',
        issuer: 'CN=Let\'s Encrypt Authority X3',
        notBefore: '2024-01-15T10:30:00Z',
        notAfter: '2024-04-15T10:30:00Z',
        serialNumber: '03:b2:e1:72:5a:8b:9f:4e:12:3d:45:67:89:ab:cd:ef'
      },
      {
        subject: 'CN=Let\'s Encrypt Authority X3, O=Let\'s Encrypt, C=US',
        issuer: 'CN=DST Root CA X3, O=Digital Signature Trust Co.',
        notBefore: '2021-01-20T19:14:03Z',
        notAfter: '2024-09-30T18:14:03Z',
        serialNumber: '0a:01:41:42:00:00:01:53:85:73:6a:0b:85:ec:a7:08'
      }
    ],
    lastChecked: '2024-01-20T14:30:00Z'
  },
  {
    id: 'analytics.arcbjorn.com-cert',
    domain: 'analytics.arcbjorn.com',
    service: 'Umami',
    issuer: 'Let\'s Encrypt Authority X3',
    serialNumber: '04:c3:f2:83:6b:9c:af:5f:23:4e:56:78:9a:bc:de:f0',
    subject: 'CN=analytics.arcbjorn.com',
    notBefore: '2024-01-10T08:15:00Z',
    notAfter: '2024-04-10T08:15:00Z',
    daysUntilExpiry: 40,
    status: CertificateStatus.VALID,
    algorithm: 'SHA256-RSA',
    keySize: 2048,
    fingerprint: '3a:e5:f2:7d:a1:89:56:23:bc:de:fa:01:23:45:67:89:ab:cd:ef:01',
    chain: [
      {
        subject: 'CN=analytics.arcbjorn.com',
        issuer: 'CN=Let\'s Encrypt Authority X3',
        notBefore: '2024-01-10T08:15:00Z',
        notAfter: '2024-04-10T08:15:00Z',
        serialNumber: '04:c3:f2:83:6b:9c:af:5f:23:4e:56:78:9a:bc:de:f0'
      }
    ],
    lastChecked: '2024-01-20T14:30:00Z'
  },
  {
    id: 'memos.arcbjorn.com-cert',
    domain: 'memos.arcbjorn.com',
    service: 'Memos',
    issuer: 'Let\'s Encrypt Authority X3',
    serialNumber: '05:d4:03:94:7c:ad:bf:6f:34:5f:67:89:ab:cd:ef:01',
    subject: 'CN=memos.arcbjorn.com',
    notBefore: '2024-01-05T16:45:00Z',
    notAfter: '2024-02-05T16:45:00Z',
    daysUntilExpiry: 15,
    status: CertificateStatus.EXPIRING_SOON,
    algorithm: 'SHA256-RSA',
    keySize: 2048,
    fingerprint: '4b:f6:03:8e:b2:9a:67:34:cd:ef:0b:12:34:56:78:9a:bc:de:f0:12',
    chain: [
      {
        subject: 'CN=memos.arcbjorn.com',
        issuer: 'CN=Let\'s Encrypt Authority X3',
        notBefore: '2024-01-05T16:45:00Z',
        notAfter: '2024-02-05T16:45:00Z',
        serialNumber: '05:d4:03:94:7c:ad:bf:6f:34:5f:67:89:ab:cd:ef:01'
      }
    ],
    lastChecked: '2024-01-20T14:30:00Z'
  },
  {
    id: 'server.arcbjorn.com-cert',
    domain: 'server.arcbjorn.com',
    service: 'Filebrowser',
    issuer: 'Let\'s Encrypt Authority X3',
    serialNumber: '06:e5:14:a5:8d:be:cf:7f:45:60:78:9a:bc:de:f0:12',
    subject: 'CN=server.arcbjorn.com',
    notBefore: '2024-01-08T12:20:00Z',
    notAfter: '2024-01-25T12:20:00Z',
    daysUntilExpiry: 5,
    status: CertificateStatus.EXPIRING_CRITICAL,
    algorithm: 'SHA256-RSA',
    keySize: 2048,
    fingerprint: '5c:07:14:9f:c3:ab:78:45:de:f0:1c:23:45:67:89:ab:cd:ef:01:23',
    chain: [
      {
        subject: 'CN=server.arcbjorn.com',
        issuer: 'CN=Let\'s Encrypt Authority X3',
        notBefore: '2024-01-08T12:20:00Z',
        notAfter: '2024-01-25T12:20:00Z',
        serialNumber: '06:e5:14:a5:8d:be:cf:7f:45:60:78:9a:bc:de:f0:12'
      }
    ],
    lastChecked: '2024-01-20T14:30:00Z'
  },
  {
    id: 'uptime.arcbjorn.com-cert',
    domain: 'uptime.arcbjorn.com',
    service: 'Uptime Kuma',
    issuer: 'Let\'s Encrypt Authority X3',
    serialNumber: '07:f6:25:b6:9e:cf:df:8f:56:71:89:ab:cd:ef:01:23',
    subject: 'CN=uptime.arcbjorn.com',
    notBefore: '2024-01-12T09:00:00Z',
    notAfter: '2024-04-12T09:00:00Z',
    daysUntilExpiry: 42,
    status: CertificateStatus.VALID,
    algorithm: 'SHA256-RSA',
    keySize: 2048,
    fingerprint: '6d:18:25:a0:d4:bc:89:56:ef:01:2d:34:56:78:9a:bc:de:f0:12:34',
    chain: [
      {
        subject: 'CN=uptime.arcbjorn.com',
        issuer: 'CN=Let\'s Encrypt Authority X3',
        notBefore: '2024-01-12T09:00:00Z',
        notAfter: '2024-04-12T09:00:00Z',
        serialNumber: '07:f6:25:b6:9e:cf:df:8f:56:71:89:ab:cd:ef:01:23'
      }
    ],
    lastChecked: '2024-01-20T14:30:00Z'
  },
  {
    id: 'dashboard.arcbjorn.com-cert',
    domain: 'dashboard.arcbjorn.com',
    service: 'Dashboard',
    issuer: 'Let\'s Encrypt Authority X3',
    serialNumber: '08:07:36:c7:af:d0:ef:9f:67:82:9a:bc:de:f0:12:34',
    subject: 'CN=dashboard.arcbjorn.com',
    notBefore: '2024-01-18T11:30:00Z',
    notAfter: '2024-04-18T11:30:00Z',
    daysUntilExpiry: 48,
    status: CertificateStatus.VALID,
    algorithm: 'SHA256-RSA',
    keySize: 2048,
    fingerprint: '7e:29:36:b1:e5:cd:9a:67:f0:12:3e:45:67:89:ab:cd:ef:01:23:45',
    chain: [
      {
        subject: 'CN=dashboard.arcbjorn.com',
        issuer: 'CN=Let\'s Encrypt Authority X3',
        notBefore: '2024-01-18T11:30:00Z',
        notAfter: '2024-04-18T11:30:00Z',
        serialNumber: '08:07:36:c7:af:d0:ef:9f:67:82:9a:bc:de:f0:12:34'
      }
    ],
    lastChecked: '2024-01-20T14:30:00Z'
  },
  {
    id: 'homepage.arcbjorn.com-cert',
    domain: 'homepage.arcbjorn.com',
    service: 'Homepage',
    issuer: 'Let\'s Encrypt Authority X3',
    serialNumber: '09:18:47:d8:b0:e1:f0:af:78:93:ab:cd:ef:01:23:45',
    subject: 'CN=homepage.arcbjorn.com',
    notBefore: '2024-01-20T13:45:00Z',
    notAfter: '2024-04-20T13:45:00Z',
    daysUntilExpiry: 50,
    status: CertificateStatus.VALID,
    algorithm: 'SHA256-RSA',
    keySize: 2048,
    fingerprint: '8f:3a:47:c2:f6:de:ab:78:01:23:4f:56:78:9a:bc:de:f0:12:34:56',
    chain: [
      {
        subject: 'CN=homepage.arcbjorn.com',
        issuer: 'CN=Let\'s Encrypt Authority X3',
        notBefore: '2024-01-20T13:45:00Z',
        notAfter: '2024-04-20T13:45:00Z',
        serialNumber: '09:18:47:d8:b0:e1:f0:af:78:93:ab:cd:ef:01:23:45'
      }
    ],
    lastChecked: '2024-01-20T14:30:00Z'
  }
];

export const mockCertificateStats: CertificateStats = {
  total: 7,
  valid: 5,
  expiringSoon: 1,
  expiringCritical: 1,
  expired: 0,
  invalid: 0,
  unreachable: 0
};

export const mockCertificateAlerts: CertificateAlert[] = [
  {
    id: 'server.arcbjorn.com-expiry',
    domain: 'server.arcbjorn.com',
    type: 'expiration',
    severity: 'critical',
    message: 'SSL certificate for server.arcbjorn.com expires in 5 days',
    timestamp: '2024-01-20T14:30:00Z',
    acknowledged: false
  },
  {
    id: 'memos.arcbjorn.com-expiry',
    domain: 'memos.arcbjorn.com',
    type: 'expiration',
    severity: 'warning',
    message: 'SSL certificate for memos.arcbjorn.com expires in 15 days',
    timestamp: '2024-01-20T14:30:00Z',
    acknowledged: false
  }
];

export const mockDomainConfigs: DomainConfig[] = [
  { 
    domain: 'git.arcbjorn.com', 
    service: 'Gitea', 
    port: 443, 
    enabled: true, 
    checkInterval: 60,
    lastCheck: '2024-01-20T14:30:00Z'
  },
  { 
    domain: 'analytics.arcbjorn.com', 
    service: 'Umami', 
    port: 443, 
    enabled: true, 
    checkInterval: 60,
    lastCheck: '2024-01-20T14:30:00Z'
  },
  { 
    domain: 'memos.arcbjorn.com', 
    service: 'Memos', 
    port: 443, 
    enabled: true, 
    checkInterval: 60,
    lastCheck: '2024-01-20T14:30:00Z'
  },
  { 
    domain: 'server.arcbjorn.com', 
    service: 'Filebrowser', 
    port: 443, 
    enabled: true, 
    checkInterval: 60,
    lastCheck: '2024-01-20T14:30:00Z'
  },
  { 
    domain: 'uptime.arcbjorn.com', 
    service: 'Uptime Kuma', 
    port: 443, 
    enabled: true, 
    checkInterval: 60,
    lastCheck: '2024-01-20T14:30:00Z'
  },
  { 
    domain: 'dashboard.arcbjorn.com', 
    service: 'Dashboard', 
    port: 443, 
    enabled: true, 
    checkInterval: 60,
    lastCheck: '2024-01-20T14:30:00Z'
  },
  { 
    domain: 'homepage.arcbjorn.com', 
    service: 'Homepage', 
    port: 443, 
    enabled: true, 
    checkInterval: 60,
    lastCheck: '2024-01-20T14:30:00Z'
  }
];

export const mockCertificateChecks: CertificateCheck[] = [
  {
    domain: 'git.arcbjorn.com',
    timestamp: '2024-01-20T14:30:00Z',
    success: true,
    certificate: mockCertificates.find(c => c.domain === 'git.arcbjorn.com')
  },
  {
    domain: 'analytics.arcbjorn.com',
    timestamp: '2024-01-20T14:30:00Z',
    success: true,
    certificate: mockCertificates.find(c => c.domain === 'analytics.arcbjorn.com')
  },
  {
    domain: 'invalid-domain.example.com',
    timestamp: '2024-01-20T14:30:00Z',
    success: false,
    errorMessage: 'Connection timeout: unable to connect to domain'
  }
];

export const generateMockCertificateCheck = (domain: string, success: boolean = true): CertificateCheck => {
  const certificate = mockCertificates.find(c => c.domain === domain);
  
  if (success && certificate) {
    return {
      domain,
      timestamp: new Date().toISOString(),
      success: true,
      certificate
    };
  }
  
  return {
    domain,
    timestamp: new Date().toISOString(),
    success: false,
    errorMessage: `Failed to check certificate for ${domain}: Connection timeout`
  };
};
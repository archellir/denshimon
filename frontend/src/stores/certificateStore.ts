import { create } from 'zustand';
import { Certificate, CertificateAlert, CertificateStats, DomainConfig, CertificateStatus } from '@/types/certificates';
import { API_ENDPOINTS } from '@/constants';
import { MOCK_ENABLED } from '@/mocks';

interface CertificateStore {
  // State
  certificates: Certificate[];
  stats: CertificateStats | null;
  alerts: CertificateAlert[];
  domains: DomainConfig[];
  isLoading: boolean;
  error: string | null;
  lastUpdated: string | null;

  // Actions
  fetchCertificates: () => Promise<void>;
  fetchCertificateStats: () => Promise<void>;
  fetchAlerts: () => Promise<void>;
  fetchDomains: () => Promise<void>;
  checkCertificate: (domain: string, port?: number) => Promise<void>;
  refreshAllCertificates: () => Promise<void>;
  addDomain: (config: DomainConfig) => Promise<void>;
  removeDomain: (domain: string) => Promise<void>;
  acknowledgeAlert: (alertId: string) => Promise<void>;
  setError: (error: string | null) => void;
  clearError: () => void;
}

// Mock data for development
const mockCertificates: Certificate[] = [
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
  }
];

const mockStats: CertificateStats = {
  total: 5,
  valid: 3,
  expiringSoon: 1,
  expiringCritical: 1,
  expired: 0,
  invalid: 0,
  unreachable: 0
};

const mockAlerts: CertificateAlert[] = [
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

const mockDomains: DomainConfig[] = [
  { domain: 'git.arcbjorn.com', service: 'Gitea', port: 443, enabled: true, checkInterval: 60 },
  { domain: 'analytics.arcbjorn.com', service: 'Umami', port: 443, enabled: true, checkInterval: 60 },
  { domain: 'memos.arcbjorn.com', service: 'Memos', port: 443, enabled: true, checkInterval: 60 },
  { domain: 'server.arcbjorn.com', service: 'Filebrowser', port: 443, enabled: true, checkInterval: 60 },
  { domain: 'uptime.arcbjorn.com', service: 'Uptime Kuma', port: 443, enabled: true, checkInterval: 60 }
];

const useCertificateStore = create<CertificateStore>((set, get) => ({
  // Initial state
  certificates: mockCertificates,
  stats: mockStats,
  alerts: mockAlerts,
  domains: mockDomains,
  isLoading: false,
  error: null,
  lastUpdated: new Date().toISOString(),

  // Actions
  fetchCertificates: async () => {
    set({ isLoading: true, error: null });
    
    try {
      if (MOCK_ENABLED) {
        await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay
        set({ 
          certificates: mockCertificates, 
          isLoading: false,
          lastUpdated: new Date().toISOString()
        });
        return;
      }

      const response = await fetch(API_ENDPOINTS.CERTIFICATES.LIST, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch certificates: ${response.statusText}`);
      }

      const data = await response.json();
      set({ 
        certificates: data.data || [], 
        isLoading: false,
        lastUpdated: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to fetch certificates:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch certificates',
        isLoading: false 
      });
    }
  },

  fetchCertificateStats: async () => {
    try {
      if (MOCK_ENABLED) {
        set({ stats: mockStats });
        return;
      }

      const response = await fetch(API_ENDPOINTS.CERTIFICATES.STATS, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch certificate stats: ${response.statusText}`);
      }

      const data = await response.json();
      set({ stats: data.data });
    } catch (error) {
      console.error('Failed to fetch certificate stats:', error);
    }
  },

  fetchAlerts: async () => {
    try {
      if (MOCK_ENABLED) {
        set({ alerts: mockAlerts });
        return;
      }

      const response = await fetch(API_ENDPOINTS.CERTIFICATES.ALERTS, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch certificate alerts: ${response.statusText}`);
      }

      const data = await response.json();
      set({ alerts: data.data || [] });
    } catch (error) {
      console.error('Failed to fetch certificate alerts:', error);
    }
  },

  fetchDomains: async () => {
    try {
      if (MOCK_ENABLED) {
        set({ domains: mockDomains });
        return;
      }

      const response = await fetch(API_ENDPOINTS.CERTIFICATES.DOMAINS, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch domain configs: ${response.statusText}`);
      }

      const data = await response.json();
      set({ domains: data.data || [] });
    } catch (error) {
      console.error('Failed to fetch domain configs:', error);
    }
  },

  checkCertificate: async (domain: string, port = 443) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await fetch(`/api/certificates/check?domain=${domain}&port=${port}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to check certificate: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Update the certificate in the store if check was successful
      if (data.success && data.data.certificate) {
        const { certificates } = get();
        const updatedCertificates = certificates.map(cert => 
          cert.domain === domain ? data.data.certificate : cert
        );
        
        set({ 
          certificates: updatedCertificates,
          isLoading: false,
          lastUpdated: new Date().toISOString()
        });
      } else {
        set({ isLoading: false });
      }
    } catch (error) {
      console.error('Failed to check certificate:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to check certificate',
        isLoading: false 
      });
    }
  },

  refreshAllCertificates: async () => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await fetch(API_ENDPOINTS.CERTIFICATES.REFRESH, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to refresh certificates: ${response.statusText}`);
      }

      // Fetch updated certificates after refresh
      await get().fetchCertificates();
      await get().fetchCertificateStats();
      await get().fetchAlerts();
      
      set({ isLoading: false });
    } catch (error) {
      console.error('Failed to refresh certificates:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to refresh certificates',
        isLoading: false 
      });
    }
  },

  addDomain: async (config: DomainConfig) => {
    try {
      const response = await fetch(API_ENDPOINTS.CERTIFICATES.DOMAINS, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify(config)
      });

      if (!response.ok) {
        throw new Error(`Failed to add domain: ${response.statusText}`);
      }

      // Refresh domains list
      await get().fetchDomains();
    } catch (error) {
      console.error('Failed to add domain:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to add domain' });
    }
  },

  removeDomain: async (domain: string) => {
    try {
      const response = await fetch(`/api/certificates/domains?domain=${domain}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to remove domain: ${response.statusText}`);
      }

      // Refresh domains list and certificates
      await get().fetchDomains();
      await get().fetchCertificates();
    } catch (error) {
      console.error('Failed to remove domain:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to remove domain' });
    }
  },

  acknowledgeAlert: async (alertId: string) => {
    try {
      const response = await fetch(`/api/certificates/alerts/acknowledge?alert_id=${alertId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to acknowledge alert: ${response.statusText}`);
      }

      // Update alert in store
      const { alerts } = get();
      const updatedAlerts = alerts.map(alert => 
        alert.id === alertId ? { ...alert, acknowledged: true } : alert
      );
      
      set({ alerts: updatedAlerts });
    } catch (error) {
      console.error('Failed to acknowledge alert:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to acknowledge alert' });
    }
  },

  setError: (error: string | null) => {
    set({ error });
  },

  clearError: () => {
    set({ error: null });
  }
}));

export default useCertificateStore;
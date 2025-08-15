import { create } from 'zustand';
import { 
  ServiceHealth, 
  ServiceHealthStats, 
  InfrastructureStatus, 
  InfrastructureAlert,
  ServiceType,
  AlertType
} from '@/types/serviceHealth';
import { API_ENDPOINTS, Status } from '@/constants';

interface ServiceHealthStore {
  services: ServiceHealth[];
  stats: ServiceHealthStats | null;
  infrastructureStatus: InfrastructureStatus | null;
  alerts: InfrastructureAlert[];
  isLoading: boolean;
  error: string | null;
  lastUpdated: string | null;
  fetchServiceHealth: () => Promise<void>;
  fetchInfrastructureStatus: () => Promise<void>;
  fetchAlerts: () => Promise<void>;
  refreshAllServices: () => Promise<void>;
  acknowledgeAlert: (alertId: string) => Promise<void>;
  setError: (error: string | null) => void;
  clearError: () => void;
}

const mockServices: ServiceHealth[] = [
  {
    id: 'gitea-service',
    name: 'Gitea',
    type: ServiceType.GITEA,
    status: Status.HEALTHY,
    url: 'https://git.arcbjorn.com',
    lastChecked: '2024-01-20T15:30:00Z',
    responseTime: 145,
    uptime: 99.8,
    metrics: {
      cpuUsage: 15.2,
      memoryUsage: 68.4,
      diskUsage: 45.1,
      networkIO: { bytesIn: 1024000, bytesOut: 2048000 },
      activeRunners: 2,
      queuedJobs: 3,
      runningJobs: 1,
      completedJobs24h: 45,
      failedJobs24h: 2,
      totalRepositories: 127,
      totalUsers: 8,
      diskSpaceUsed: 5368709120, // ~5GB
      avgBuildTime: 3.2,
      registrySize: 2147483648 // ~2GB
    },
    alerts: []
  },
  {
    id: 'filebrowser-service',
    name: 'Filebrowser',
    type: ServiceType.FILEBROWSER,
    status: Status.HEALTHY,
    url: 'https://server.arcbjorn.com',
    lastChecked: '2024-01-20T15:30:00Z',
    responseTime: 89,
    uptime: 99.9,
    metrics: {
      cpuUsage: 5.1,
      memoryUsage: 32.8,
      diskUsage: 78.3,
      totalFiles: 15420,
      totalDirectories: 1834,
      storageUsed: 42949672960, // ~40GB
      storageAvailable: 12884901888, // ~12GB
      recentUploads24h: 23,
      recentDownloads24h: 156,
      activeConnections: 4,
      avgResponseTime: 67
    },
    alerts: [
      {
        id: 'fb-storage-warning',
        serviceId: 'filebrowser-service',
        type: AlertType.RESOURCE,
        severity: Status.WARNING,
        message: 'Storage usage approaching 80% capacity',
        timestamp: '2024-01-20T14:15:00Z',
        acknowledged: false
      }
    ]
  },
  {
    id: 'umami-service',
    name: 'Umami',
    type: ServiceType.UMAMI,
    status: Status.HEALTHY,
    url: 'https://analytics.arcbjorn.com',
    lastChecked: '2024-01-20T15:30:00Z',
    responseTime: 203,
    uptime: 99.5,
    metrics: {
      cpuUsage: 8.7,
      memoryUsage: 45.6,
      diskUsage: 12.1,
      totalWebsites: 5,
      totalEvents24h: 2847,
      totalPageviews24h: 1934,
      totalSessions24h: 387,
      databaseConnections: 3,
      dataRetentionDays: 365,
      avgQueryTime: 12.4,
      cacheHitRatio: 94.2
    },
    alerts: []
  },
  {
    id: 'memos-service',
    name: 'Memos',
    type: ServiceType.MEMOS,
    status: Status.WARNING,
    url: 'https://memos.arcbjorn.com',
    lastChecked: '2024-01-20T15:30:00Z',
    responseTime: 456,
    uptime: 98.2,
    metrics: {
      cpuUsage: 12.3,
      memoryUsage: 67.9,
      diskUsage: 23.4,
      totalNotes: 1247,
      notesCreated24h: 12,
      notesUpdated24h: 31,
      totalUsers: 3,
      databaseSize: 104857600, // ~100MB
      avgNoteLength: 487,
      syncStatus: 'syncing',
      lastSyncTime: '2024-01-20T15:25:00Z'
    },
    alerts: [
      {
        id: 'memos-sync-slow',
        serviceId: 'memos-service',
        type: AlertType.PERFORMANCE,
        severity: Status.WARNING,
        message: 'Note synchronization taking longer than usual',
        timestamp: '2024-01-20T15:20:00Z',
        acknowledged: false
      }
    ]
  },
  {
    id: 'uptime-kuma-service',
    name: 'Uptime Kuma',
    type: ServiceType.UPTIME_KUMA,
    status: Status.HEALTHY,
    url: 'https://uptime.arcbjorn.com',
    lastChecked: '2024-01-20T15:30:00Z',
    responseTime: 134,
    uptime: 99.7,
    metrics: {
      cpuUsage: 6.8,
      memoryUsage: 38.2,
      diskUsage: 8.9,
      totalMonitors: 15,
      upMonitors: 14,
      downMonitors: 1,
      pausedMonitors: 0,
      avgResponseTime: 287,
      totalIncidents24h: 2,
      resolvedIncidents24h: 2,
      notificationsSent24h: 8,
      maintenanceWindows: 0
    },
    alerts: [
      {
        id: 'uptime-monitor-down',
        serviceId: 'uptime-kuma-service',
        type: AlertType.CONNECTIVITY,
        severity: Status.CRITICAL,
        message: 'External service monitor is down',
        timestamp: '2024-01-20T14:45:00Z',
        acknowledged: false
      }
    ]
  },
  {
    id: 'postgresql-service',
    name: 'PostgreSQL',
    type: ServiceType.POSTGRESQL,
    status: Status.HEALTHY,
    lastChecked: '2024-01-20T15:30:00Z',
    responseTime: 23,
    uptime: 99.9,
    metrics: {
      cpuUsage: 18.4,
      memoryUsage: 76.3,
      diskUsage: 34.7,
      totalDatabases: 7,
      totalConnections: 12,
      maxConnections: 100,
      activeQueries: 3,
      longRunningQueries: 0,
      databaseSize: 1073741824, // ~1GB
      cacheHitRatio: 98.7,
      transactionsPerSecond: 45.6,
      avgQueryTime: 8.2,
      vacuumStatus: 'idle',
      lastBackup: '2024-01-20T06:00:00Z'
    },
    alerts: []
  }
];

const mockStats: ServiceHealthStats = {
  total: 6,
  healthy: 4,
  warning: 2,
  critical: 0,
  down: 0,
  unknown: 0
};

const mockInfrastructureStatus: InfrastructureStatus = {
  overall: Status.HEALTHY,
  services: mockServices,
  domainAccessibility: [
    {
      domain: 'git.arcbjorn.com',
      accessible: true,
      responseTime: 145,
      httpStatus: 200,
      sslValid: true,
      lastChecked: '2024-01-20T15:30:00Z'
    },
    {
      domain: 'analytics.arcbjorn.com',
      accessible: true,
      responseTime: 203,
      httpStatus: 200,
      sslValid: true,
      lastChecked: '2024-01-20T15:30:00Z'
    },
    {
      domain: 'memos.arcbjorn.com',
      accessible: true,
      responseTime: 456,
      httpStatus: 200,
      sslValid: true,
      lastChecked: '2024-01-20T15:30:00Z'
    },
    {
      domain: 'server.arcbjorn.com',
      accessible: true,
      responseTime: 89,
      httpStatus: 200,
      sslValid: false, // Expiring certificate
      lastChecked: '2024-01-20T15:30:00Z',
      error: 'SSL certificate expires in 5 days'
    },
    {
      domain: 'uptime.arcbjorn.com',
      accessible: true,
      responseTime: 134,
      httpStatus: 200,
      sslValid: true,
      lastChecked: '2024-01-20T15:30:00Z'
    }
  ],
  ingressRules: [
    {
      name: 'gitea-ingress',
      namespace: 'base-infra',
      host: 'git.arcbjorn.com',
      path: '/',
      backend: 'gitea:3000',
      status: 'active',
      lastChecked: '2024-01-20T15:30:00Z'
    },
    {
      name: 'umami-ingress',
      namespace: 'base-infra',
      host: 'analytics.arcbjorn.com', 
      path: '/',
      backend: 'umami:3000',
      status: 'active',
      lastChecked: '2024-01-20T15:30:00Z'
    }
  ],
  networkPolicies: [
    {
      name: 'base-infra-policy',
      namespace: 'base-infra',
      podSelector: 'app in (gitea,umami,memos,filebrowser,uptime-kuma)',
      policyTypes: ['Ingress', 'Egress'],
      status: 'active',
      rulesApplied: 8,
      lastChecked: '2024-01-20T15:30:00Z'
    }
  ],
  lastChecked: '2024-01-20T15:30:00Z'
};

const mockAlerts: InfrastructureAlert[] = [
  {
    id: 'fb-storage-alert',
    type: 'service',
    severity: Status.WARNING,
    message: 'Filebrowser storage usage approaching 80% capacity',
    timestamp: '2024-01-20T14:15:00Z',
    acknowledged: false,
    source: 'filebrowser-service'
  },
  {
    id: 'memos-sync-alert',
    type: 'service',
    severity: Status.WARNING,
    message: 'Memos note synchronization running slower than usual',
    timestamp: '2024-01-20T15:20:00Z',
    acknowledged: false,
    source: 'memos-service'
  },
  {
    id: 'uptime-monitor-alert',
    type: 'service',
    severity: Status.CRITICAL,
    message: 'Uptime Kuma reports external service monitor down',
    timestamp: '2024-01-20T14:45:00Z',
    acknowledged: false,
    source: 'uptime-kuma-service'
  },
  {
    id: 'ssl-expiring-alert',
    type: 'domain',
    severity: Status.CRITICAL,
    message: 'SSL certificate for server.arcbjorn.com expires in 5 days',
    timestamp: '2024-01-20T14:30:00Z',
    acknowledged: false,
    source: 'server.arcbjorn.com'
  }
];

const useServiceHealthStore = create<ServiceHealthStore>((set, get) => ({
  services: mockServices,
  stats: mockStats,
  infrastructureStatus: mockInfrastructureStatus,
  alerts: mockAlerts,
  isLoading: false,
  error: null,
  lastUpdated: new Date().toISOString(),
  fetchServiceHealth: async () => {
    set({ isLoading: true, error: null });
    
    try {
      if (import.meta.env.DEV) {
        await new Promise(resolve => setTimeout(resolve, 500));
        set({ 
          services: mockServices,
          stats: mockStats,
          isLoading: false,
          lastUpdated: new Date().toISOString()
        });
        return;
      }

      const response = await fetch(API_ENDPOINTS.INFRASTRUCTURE.SERVICES, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch service health: ${response.statusText}`);
      }

      const data = await response.json();
      set({ 
        services: data.data || [],
        isLoading: false,
        lastUpdated: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to fetch service health:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch service health',
        isLoading: false 
      });
    }
  },

  fetchInfrastructureStatus: async () => {
    try {
      if (import.meta.env.DEV) {
        set({ infrastructureStatus: mockInfrastructureStatus });
        return;
      }

      const response = await fetch(API_ENDPOINTS.INFRASTRUCTURE.STATUS, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch infrastructure status: ${response.statusText}`);
      }

      const data = await response.json();
      set({ infrastructureStatus: data.data });
    } catch (error) {
      console.error('Failed to fetch infrastructure status:', error);
    }
  },

  fetchAlerts: async () => {
    try {
      if (import.meta.env.DEV) {
        set({ alerts: mockAlerts });
        return;
      }

      const response = await fetch(API_ENDPOINTS.INFRASTRUCTURE.ALERTS, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch infrastructure alerts: ${response.statusText}`);
      }

      const data = await response.json();
      set({ alerts: data.data || [] });
    } catch (error) {
      console.error('Failed to fetch infrastructure alerts:', error);
    }
  },

  refreshAllServices: async () => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await fetch(API_ENDPOINTS.INFRASTRUCTURE.REFRESH, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to refresh services: ${response.statusText}`);
      }

      await get().fetchServiceHealth();
      await get().fetchInfrastructureStatus();
      await get().fetchAlerts();
      
      set({ isLoading: false });
    } catch (error) {
      console.error('Failed to refresh services:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to refresh services',
        isLoading: false 
      });
    }
  },

  acknowledgeAlert: async (alertId: string) => {
    try {
      const response = await fetch(`/api/infrastructure/alerts/${alertId}/acknowledge`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to acknowledge alert: ${response.statusText}`);
      }

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

export default useServiceHealthStore;
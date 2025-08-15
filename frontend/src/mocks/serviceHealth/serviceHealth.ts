import { 
  ServiceHealth, 
  ServiceType, 
  ServiceHealthStats,
  InfrastructureStatus,
  InfrastructureAlert,
  GiteaHealth,
  FilebrowserHealth,
  UmamiHealth,
  MemosHealth,
  UptimeKumaHealth,
  PostgreSQLHealth
} from '@/types/serviceHealth';
import { Status } from '@/constants';

// Mock Service Health Data - Base Infrastructure Services
export const mockServiceHealthData: ServiceHealth[] = [
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
  } as GiteaHealth,
  
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
        type: 'resource',
        severity: Status.WARNING,
        message: 'Storage usage approaching 80% capacity',
        timestamp: '2024-01-20T14:15:00Z',
        acknowledged: false
      }
    ]
  } as FilebrowserHealth,
  
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
  } as UmamiHealth,
  
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
        type: 'performance',
        severity: Status.WARNING,
        message: 'Note synchronization taking longer than usual',
        timestamp: '2024-01-20T15:20:00Z',
        acknowledged: false
      }
    ]
  } as MemosHealth,
  
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
        type: 'connectivity',
        severity: Status.CRITICAL,
        message: 'External service monitor is down',
        timestamp: '2024-01-20T14:45:00Z',
        acknowledged: false
      }
    ]
  } as UptimeKumaHealth,
  
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
  } as PostgreSQLHealth
];

export const mockServiceHealthStats: ServiceHealthStats = {
  total: 6,
  healthy: 4,
  warning: 2,
  critical: 0,
  down: 0,
  unknown: 0
};

export const mockInfrastructureStatus: InfrastructureStatus = {
  overall: Status.HEALTHY,
  services: mockServiceHealthData,
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
    },
    {
      name: 'memos-ingress',
      namespace: 'base-infra',
      host: 'memos.arcbjorn.com',
      path: '/',
      backend: 'memos:5230',
      status: 'active',
      lastChecked: '2024-01-20T15:30:00Z'
    },
    {
      name: 'filebrowser-ingress',
      namespace: 'base-infra',
      host: 'server.arcbjorn.com',
      path: '/',
      backend: 'filebrowser:80',
      status: 'active',
      lastChecked: '2024-01-20T15:30:00Z'
    },
    {
      name: 'uptime-kuma-ingress',
      namespace: 'base-infra',
      host: 'uptime.arcbjorn.com',
      path: '/',
      backend: 'uptime-kuma:3001',
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
    },
    {
      name: 'postgresql-policy',
      namespace: 'base-infra',
      podSelector: 'app=postgresql',
      policyTypes: ['Ingress'],
      status: 'active',
      rulesApplied: 3,
      lastChecked: '2024-01-20T15:30:00Z'
    }
  ],
  lastChecked: '2024-01-20T15:30:00Z'
};

export const mockInfrastructureAlerts: InfrastructureAlert[] = [
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
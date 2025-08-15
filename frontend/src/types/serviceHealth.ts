import { Status } from '@/constants';

export interface ServiceHealth {
  id: string;
  name: string;
  type: ServiceType;
  status: Status;
  url?: string;
  lastChecked: string;
  responseTime?: number;
  uptime: number; // percentage
  metrics: ServiceMetrics;
  alerts: ServiceAlert[];
}

export enum ServiceType {
  GITEA = 'gitea',
  FILEBROWSER = 'filebrowser', 
  UMAMI = 'umami',
  MEMOS = 'memos',
  UPTIME_KUMA = 'uptime_kuma',
  POSTGRESQL = 'postgresql'
}

// ServiceStatus is now deprecated - use Status enum from constants instead

export interface ServiceMetrics {
  // Common metrics
  cpuUsage?: number;
  memoryUsage?: number;
  diskUsage?: number;
  networkIO?: {
    bytesIn: number;
    bytesOut: number;
  };
  
  // Service-specific metrics
  [key: string]: unknown;
}

export interface ServiceAlert {
  id: string;
  serviceId: string;
  type: AlertType;
  severity: Status;
  message: string;
  timestamp: string;
  acknowledged: boolean;
}

export enum AlertType {
  PERFORMANCE = 'performance',
  CONNECTIVITY = 'connectivity',
  RESOURCE = 'resource',
  SECURITY = 'security',
  CONFIGURATION = 'configuration'
}

// AlertSeverity is now deprecated - use Status enum from constants instead

// Service-specific interfaces

export interface GiteaHealth extends ServiceHealth {
  type: ServiceType.GITEA;
  metrics: GiteaMetrics;
}

export interface GiteaMetrics extends ServiceMetrics {
  activeRunners: number;
  queuedJobs: number;
  runningJobs: number;
  completedJobs24h: number;
  failedJobs24h: number;
  totalRepositories: number;
  totalUsers: number;
  diskSpaceUsed: number; // bytes
  avgBuildTime: number; // minutes
  registrySize: number; // bytes
}

export interface FilebrowserHealth extends ServiceHealth {
  type: ServiceType.FILEBROWSER;
  metrics: FilebrowserMetrics;
}

export interface FilebrowserMetrics extends ServiceMetrics {
  totalFiles: number;
  totalDirectories: number;
  storageUsed: number; // bytes
  storageAvailable: number; // bytes
  recentUploads24h: number;
  recentDownloads24h: number;
  activeConnections: number;
  avgResponseTime: number; // ms
}

export interface UmamiHealth extends ServiceHealth {
  type: ServiceType.UMAMI;
  metrics: UmamiMetrics;
}

export interface UmamiMetrics extends ServiceMetrics {
  totalWebsites: number;
  totalEvents24h: number;
  totalPageviews24h: number;
  totalSessions24h: number;
  databaseConnections: number;
  dataRetentionDays: number;
  avgQueryTime: number; // ms
  cacheHitRatio: number; // percentage
}

export interface MemosHealth extends ServiceHealth {
  type: ServiceType.MEMOS;
  metrics: MemosMetrics;
}

export interface MemosMetrics extends ServiceMetrics {
  totalNotes: number;
  notesCreated24h: number;
  notesUpdated24h: number;
  totalUsers: number;
  databaseSize: number; // bytes
  avgNoteLength: number; // characters
  syncStatus: 'synced' | 'syncing' | 'error';
  lastSyncTime: string;
}

export interface UptimeKumaHealth extends ServiceHealth {
  type: ServiceType.UPTIME_KUMA;
  metrics: UptimeKumaMetrics;
}

export interface UptimeKumaMetrics extends ServiceMetrics {
  totalMonitors: number;
  upMonitors: number;
  downMonitors: number;
  pausedMonitors: number;
  avgResponseTime: number; // ms
  totalIncidents24h: number;
  resolvedIncidents24h: number;
  notificationsSent24h: number;
  maintenanceWindows: number;
}

export interface PostgreSQLHealth extends ServiceHealth {
  type: ServiceType.POSTGRESQL;
  metrics: PostgreSQLMetrics;
}

export interface PostgreSQLMetrics extends ServiceMetrics {
  totalDatabases: number;
  totalConnections: number;
  maxConnections: number;
  activeQueries: number;
  longRunningQueries: number;
  databaseSize: number; // bytes
  cacheHitRatio: number; // percentage
  transactionsPerSecond: number;
  avgQueryTime: number; // ms
  replicationLag?: number; // ms
  vacuumStatus: 'running' | 'idle' | 'error';
  lastBackup?: string;
}

// Infrastructure status interfaces

export interface InfrastructureStatus {
  overall: Status;
  services: ServiceHealth[];
  domainAccessibility: DomainAccessibilityCheck[];
  ingressRules: IngressRuleStatus[];
  networkPolicies: NetworkPolicyStatus[];
  lastChecked: string;
}

export interface DomainAccessibilityCheck {
  domain: string;
  accessible: boolean;
  responseTime?: number; // ms
  httpStatus?: number;
  sslValid: boolean;
  lastChecked: string;
  error?: string;
}

export interface IngressRuleStatus {
  name: string;
  namespace: string;
  host: string;
  path: string;
  backend: string;
  status: 'active' | 'inactive' | 'error';
  lastChecked: string;
  error?: string;
}

export interface NetworkPolicyStatus {
  name: string;
  namespace: string;
  podSelector: string;
  policyTypes: string[];
  status: 'active' | 'inactive' | 'error';
  rulesApplied: number;
  lastChecked: string;
}

export interface ServiceHealthStats {
  total: number;
  healthy: number;
  warning: number;
  critical: number;
  down: number;
  unknown: number;
}

export interface InfrastructureAlert {
  id: string;
  type: 'service' | 'domain' | 'ingress' | 'network';
  severity: Status;
  message: string;
  timestamp: string;
  acknowledged: boolean;
  source: string; // service name, domain, etc.
}
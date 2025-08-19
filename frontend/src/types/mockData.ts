/**
 * Comprehensive TypeScript types for all mock data structures
 * This ensures type safety and consistency across the entire application
 */

import { z } from 'zod';
import {
  Status,
  DeploymentStatus,
  RegistryStatus,
  RegistryType,
  PodStatus,
  LogLevel,
} from '@constants';

// ==================== CORE INFRASTRUCTURE TYPES ====================

export const MasterNamespaceSchema = z.enum([
  'default',
  'kube-system',
  'monitoring',
  'production',
  'staging',
  'denshimon'
]);
export type MasterNamespace = z.infer<typeof MasterNamespaceSchema>;

export const MasterNodeSchema = z.enum(['cluster-main']);
export type MasterNode = z.infer<typeof MasterNodeSchema>;

// ==================== APPLICATION & POD TYPES ====================

export const ApplicationSchema = z.object({
  name: z.string(),
  namespace: MasterNamespaceSchema,
  replicas: z.number().int().min(0),
  pods: z.array(z.string()),
});
export type Application = z.infer<typeof ApplicationSchema>;

export const PodSchema = z.object({
  name: z.string(),
  namespace: MasterNamespaceSchema,
  node: MasterNodeSchema,
  app: z.string(),
});
export type Pod = z.infer<typeof PodSchema>;

export const ServiceSchema = z.object({
  name: z.string(),
  namespace: MasterNamespaceSchema,
  type: z.enum(['ClusterIP', 'NodePort', 'LoadBalancer', 'ExternalName']),
  ports: z.array(z.object({
    port: z.number().int().min(1).max(65535),
    targetPort: z.number().int().min(1).max(65535),
    protocol: z.enum(['TCP', 'UDP']),
  })),
  selector: z.record(z.string(), z.string()),
  clusterIP: z.string().optional(),
  endpoints: z.object({
    ready: z.number().int().min(0),
    not_ready: z.number().int().min(0),
    total: z.number().int().min(0),
  }).optional(),
});
export type Service = z.infer<typeof ServiceSchema>;

// ==================== METRICS & MONITORING TYPES ====================

export const TrendDirectionSchema = z.enum(['up', 'down', 'stable']);
export type TrendDirection = z.infer<typeof TrendDirectionSchema>;

export const MetricsSchema = z.object({
  cpu: z.number().min(0).max(100),
  memory: z.number().min(0).max(100),
  network_rx: z.number().min(0),
  network_tx: z.number().min(0),
  disk_read: z.number().min(0),
  disk_write: z.number().min(0),
  trend: TrendDirectionSchema,
  lastUpdated: z.string(),
});
export type Metrics = z.infer<typeof MetricsSchema>;

export const PodMetricsSchema = z.object({
  name: z.string(),
  namespace: z.string(),
  cpu_usage: z.number().min(0),
  memory_usage: z.number().min(0),
  network_rx_bytes: z.number().min(0),
  network_tx_bytes: z.number().min(0),
  disk_read_bytes: z.number().min(0),
  disk_write_bytes: z.number().min(0),
  restarts: z.number().int().min(0),
  status: z.nativeEnum(PodStatus),
  ready: z.boolean(),
  age: z.string(),
  node: z.string(),
});
export type PodMetrics = z.infer<typeof PodMetricsSchema>;

// ==================== DEPLOYMENT TYPES ====================

export const RegistrySchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  type: z.nativeEnum(RegistryType),
  url: z.string().url(),
  username: z.string().optional(),
  password: z.string().optional(),
  token: z.string().optional(),
  status: z.nativeEnum(RegistryStatus),
  lastTested: z.string().datetime(),
  created: z.string().datetime(),
  description: z.string().optional(),
  isDefault: z.boolean().default(false),
});
export type Registry = z.infer<typeof RegistrySchema>;

export const ImageTagSchema = z.object({
  name: z.string(),
  digest: z.string(),
  size: z.number().int().min(0),
  created: z.string().datetime(),
  os: z.string(),
  architecture: z.string(),
});
export type ImageTag = z.infer<typeof ImageTagSchema>;

export const ContainerImageSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  tags: z.array(ImageTagSchema),
  registry: z.string(),
  pulls: z.number().int().min(0),
  stars: z.number().int().min(0),
  lastUpdated: z.string().datetime(),
  official: z.boolean().default(false),
  verified: z.boolean().default(false),
  size: z.number().int().min(0),
});
export type ContainerImage = z.infer<typeof ContainerImageSchema>;

export const DeploymentSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  namespace: z.string().min(1),
  image: z.string(),
  tag: z.string(),
  replicas: z.number().int().min(0),
  status: z.nativeEnum(DeploymentStatus),
  strategy: z.enum(['RollingUpdate', 'Recreate']),
  created: z.string().datetime(),
  updated: z.string().datetime(),
  labels: z.record(z.string(), z.string()),
  annotations: z.record(z.string(), z.string()).optional(),
  ports: z.array(z.object({
    name: z.string().optional(),
    port: z.number().int().min(1).max(65535),
    targetPort: z.number().int().min(1).max(65535),
    protocol: z.enum(['TCP', 'UDP']).default('TCP'),
  })),
  env: z.array(z.object({
    name: z.string(),
    value: z.string(),
  })).optional(),
  resources: z.object({
    requests: z.object({
      cpu: z.string(),
      memory: z.string(),
    }).optional(),
    limits: z.object({
      cpu: z.string(),
      memory: z.string(),
    }).optional(),
  }).optional(),
  readyReplicas: z.number().int().min(0),
  availableReplicas: z.number().int().min(0),
  health: z.nativeEnum(Status),
});
export type Deployment = z.infer<typeof DeploymentSchema>;

export const DeploymentHistorySchema = z.object({
  id: z.string().uuid(),
  deploymentId: z.string().uuid(),
  revision: z.number().int().min(1),
  status: z.nativeEnum(DeploymentStatus),
  created: z.string().datetime(),
  completed: z.string().datetime().optional(),
  changes: z.array(z.object({
    field: z.string(),
    oldValue: z.unknown(),
    newValue: z.unknown(),
  })),
  rollbackAvailable: z.boolean(),
  author: z.string(),
  message: z.string().optional(),
});
export type DeploymentHistory = z.infer<typeof DeploymentHistorySchema>;

// ==================== DATABASE TYPES ====================

export const DatabaseConnectionSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  type: z.enum(['postgresql', 'mysql', 'sqlite', 'mongodb']),
  host: z.string(),
  port: z.number().int().min(1).max(65535),
  database: z.string(),
  username: z.string(),
  password: z.string(),
  ssl: z.boolean().default(false),
  status: z.enum(['connected', 'disconnected', 'error']),
  created: z.string().datetime(),
  lastConnected: z.string().datetime().optional(),
  description: z.string().optional(),
});
export type DatabaseConnection = z.infer<typeof DatabaseConnectionSchema>;

export const DatabaseTableSchema = z.object({
  name: z.string(),
  columns: z.number().int().min(0),
  rows: z.number().int().min(0),
  size: z.string(),
  type: z.enum(['table', 'view', 'index']),
  schema: z.string().optional(),
});
export type DatabaseTable = z.infer<typeof DatabaseTableSchema>;

export const DatabaseColumnSchema = z.object({
  name: z.string(),
  type: z.string(),
  nullable: z.boolean(),
  defaultValue: z.string().optional(),
  isPrimary: z.boolean().default(false),
  isForeign: z.boolean().default(false),
  isUnique: z.boolean().default(false),
  isIndexed: z.boolean().default(false),
  comment: z.string().optional(),
});
export type DatabaseColumn = z.infer<typeof DatabaseColumnSchema>;

export const QueryResultSchema = z.object({
  columns: z.array(z.object({
    name: z.string(),
    type: z.string(),
  })),
  rows: z.array(z.record(z.string(), z.unknown())),
  rowCount: z.number().int().min(0),
  executionTime: z.number().min(0),
  affectedRows: z.number().int().min(0).optional(),
});
export type QueryResult = z.infer<typeof QueryResultSchema>;

// ==================== LOG & MONITORING TYPES ====================

export const LogEntrySchema = z.object({
  timestamp: z.string().datetime(),
  level: z.nativeEnum(LogLevel),
  source: z.string(),
  message: z.string(),
  pod: z.string().optional(),
  namespace: z.string().optional(),
  container: z.string().optional(),
  labels: z.record(z.string(), z.string()).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});
export type LogEntry = z.infer<typeof LogEntrySchema>;

export const ServiceHealthSchema = z.object({
  name: z.string(),
  status: z.nativeEnum(Status),
  uptime: z.number().min(0),
  responseTime: z.number().min(0),
  errorRate: z.number().min(0).max(100),
  requestCount: z.number().int().min(0),
  lastCheck: z.string().datetime(),
  endpoints: z.array(z.object({
    url: z.string().url(),
    status: z.nativeEnum(Status),
    responseTime: z.number().min(0),
    lastCheck: z.string().datetime(),
  })),
  dependencies: z.array(z.string()).optional(),
});
export type ServiceHealth = z.infer<typeof ServiceHealthSchema>;

// ==================== WEBSOCKET TYPES ====================

export const WebSocketEventSchema = z.object({
  type: z.string(),
  data: z.record(z.string(), z.unknown()),
  timestamp: z.string().datetime(),
  id: z.string().uuid(),
});
export type WebSocketEvent = z.infer<typeof WebSocketEventSchema>;

// ==================== BACKUP & INFRASTRUCTURE TYPES ====================

export const BackupJobSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  type: z.enum(['database', 'volume', 'cluster', 'application']),
  status: z.enum(['pending', 'running', 'completed', 'failed']),
  source: z.string(),
  destination: z.string(),
  schedule: z.string().optional(),
  created: z.string().datetime(),
  started: z.string().datetime().optional(),
  completed: z.string().datetime().optional(),
  size: z.number().int().min(0).optional(),
  retention: z.number().int().min(1),
  compression: z.boolean().default(true),
  encryption: z.boolean().default(false),
});
export type BackupJob = z.infer<typeof BackupJobSchema>;

export const CertificateSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  domain: z.string(),
  issuer: z.string(),
  status: z.enum(['valid', 'expiring', 'expired', 'invalid']),
  validFrom: z.string().datetime(),
  validUntil: z.string().datetime(),
  daysUntilExpiry: z.number().int(),
  autoRenew: z.boolean().default(true),
  type: z.enum(['self-signed', 'ca-signed', 'lets-encrypt']),
  algorithm: z.string(),
  keySize: z.number().int(),
  fingerprint: z.string(),
});
export type Certificate = z.infer<typeof CertificateSchema>;

// ==================== VALIDATION HELPERS ====================

export const validateMockData = {
  application: (data: unknown): Application => ApplicationSchema.parse(data),
  pod: (data: unknown): Pod => PodSchema.parse(data),
  service: (data: unknown): Service => ServiceSchema.parse(data),
  metrics: (data: unknown): Metrics => MetricsSchema.parse(data),
  podMetrics: (data: unknown): PodMetrics => PodMetricsSchema.parse(data),
  registry: (data: unknown): Registry => RegistrySchema.parse(data),
  image: (data: unknown): ContainerImage => ContainerImageSchema.parse(data),
  deployment: (data: unknown): Deployment => DeploymentSchema.parse(data),
  deploymentHistory: (data: unknown): DeploymentHistory => DeploymentHistorySchema.parse(data),
  databaseConnection: (data: unknown): DatabaseConnection => DatabaseConnectionSchema.parse(data),
  databaseTable: (data: unknown): DatabaseTable => DatabaseTableSchema.parse(data),
  databaseColumn: (data: unknown): DatabaseColumn => DatabaseColumnSchema.parse(data),
  queryResult: (data: unknown): QueryResult => QueryResultSchema.parse(data),
  logEntry: (data: unknown): LogEntry => LogEntrySchema.parse(data),
  serviceHealth: (data: unknown): ServiceHealth => ServiceHealthSchema.parse(data),
  webSocketEvent: (data: unknown): WebSocketEvent => WebSocketEventSchema.parse(data),
  backupJob: (data: unknown): BackupJob => BackupJobSchema.parse(data),
  certificate: (data: unknown): Certificate => CertificateSchema.parse(data),
} as const;

// ==================== ARRAY SCHEMAS ====================

export const ApplicationsArraySchema = z.array(ApplicationSchema);
export const PodsArraySchema = z.array(PodSchema);
export const ServicesArraySchema = z.array(ServiceSchema);
export const RegistriesArraySchema = z.array(RegistrySchema);
export const ImagesArraySchema = z.array(ContainerImageSchema);
export const DeploymentsArraySchema = z.array(DeploymentSchema);
export const DatabaseConnectionsArraySchema = z.array(DatabaseConnectionSchema);
export const LogEntriesArraySchema = z.array(LogEntrySchema);
export const ServiceHealthArraySchema = z.array(ServiceHealthSchema);
export const BackupJobsArraySchema = z.array(BackupJobSchema);
export const CertificatesArraySchema = z.array(CertificateSchema);

// ==================== EXPORT ALL TYPES ====================

export type {
  Application,
  Pod,
  Service,
  Metrics,
  PodMetrics,
  Registry,
  ContainerImage,
  ImageTag,
  Deployment,
  DeploymentHistory,
  DatabaseConnection,
  DatabaseTable,
  DatabaseColumn,
  QueryResult,
  LogEntry,
  ServiceHealth,
  WebSocketEvent,
  BackupJob,
  Certificate,
  TrendDirection,
  MasterNamespace,
  MasterNode,
};
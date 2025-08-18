// Backup and Recovery Types
import { Status } from '@constants';

export interface BackupJob {
  id: string;
  name: string;
  type: BackupType;
  source: BackupSource;
  schedule: BackupSchedule;
  status: BackupStatus;
  lastRun?: string;
  nextRun?: string;
  retention: RetentionPolicy;
  size?: number; // bytes
  duration?: number; // seconds
  error?: string;
  metadata: BackupMetadata;
}

export enum BackupType {
  FULL = 'full',
  INCREMENTAL = 'incremental',
  DIFFERENTIAL = 'differential',
  SNAPSHOT = 'snapshot'
}

export enum BackupSource {
  POSTGRESQL = 'postgresql',
  SQLITE = 'sqlite',
  PERSISTENT_VOLUME = 'persistent_volume',
  GITEA_DATA = 'gitea_data',
  FILEBROWSER_DATA = 'filebrowser_data',
  CONFIG_FILES = 'config_files'
}

export interface BackupSchedule {
  enabled: boolean;
  cron: string; // Cron expression
  timezone: string;
  lastScheduledRun?: string;
  nextScheduledRun?: string;
}

export enum BackupStatus {
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  SCHEDULED = 'scheduled',
  CANCELLED = 'cancelled',
  VERIFYING = 'verifying',
  VERIFIED = 'verified'
}

export interface RetentionPolicy {
  daily: number;
  weekly: number;
  monthly: number;
  yearly: number;
  minBackups: number;
}

export interface BackupMetadata {
  database?: string;
  tables?: string[];
  volumePath?: string;
  compressionType?: CompressionType;
  encryptionEnabled: boolean;
  checksum?: string;
}

export enum CompressionType {
  NONE = 'none',
  GZIP = 'gzip',
  BZIP2 = 'bzip2',
  XZ = 'xz',
  ZSTD = 'zstd'
}

// Backup History
export interface BackupHistory {
  id: string;
  jobId: string;
  jobName: string;
  timestamp: string;
  type: BackupType;
  source: BackupSource;
  status: BackupStatus;
  size: number; // bytes
  duration: number; // seconds
  filesCount?: number;
  location: string;
  checksum: string;
  verificationStatus?: VerificationStatus;
  restorePoints?: RestorePoint[];
}

export enum VerificationStatus {
  NOT_VERIFIED = 'not_verified',
  VERIFYING = 'verifying',
  VERIFIED = 'verified',
  FAILED = 'failed',
  CORRUPTED = 'corrupted'
}

// Recovery Types
export interface RestorePoint {
  id: string;
  backupId: string;
  timestamp: string;
  type: RestoreType;
  description?: string;
  size: number;
  recoverable: boolean;
}

export enum RestoreType {
  FULL_RESTORE = 'full_restore',
  POINT_IN_TIME = 'point_in_time',
  TABLE_RESTORE = 'table_restore',
  FILE_RESTORE = 'file_restore'
}

export interface RecoveryOperation {
  id: string;
  backupId: string;
  restorePointId?: string;
  status: RecoveryStatus;
  startTime: string;
  endTime?: string;
  targetLocation: string;
  options: RecoveryOptions;
  progress?: RecoveryProgress;
  error?: string;
}

export enum RecoveryStatus {
  PENDING = 'pending',
  PREPARING = 'preparing',
  DOWNLOADING = 'downloading',
  RESTORING = 'restoring',
  VERIFYING = 'verifying',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

export interface RecoveryOptions {
  overwriteExisting: boolean;
  verifyAfterRestore: boolean;
  stopServicesBeforeRestore: boolean;
  restorePermissions: boolean;
  restoreToAlternateLocation?: string;
  selectedTables?: string[];
  selectedFiles?: string[];
}

export interface RecoveryProgress {
  percentage: number;
  bytesRestored: number;
  totalBytes: number;
  filesRestored: number;
  totalFiles: number;
  currentFile?: string;
  estimatedTimeRemaining?: number; // seconds
}

// Storage and Statistics
export interface BackupStorage {
  id: string;
  name: string;
  type: StorageType;
  location: string;
  available: number; // bytes
  used: number; // bytes
  total: number; // bytes
  backupCount: number;
  oldestBackup?: string;
  newestBackup?: string;
  status: StorageStatus;
}

export enum StorageType {
  LOCAL = 'local',
  S3 = 's3',
  NFS = 'nfs',
  PERSISTENT_VOLUME = 'persistent_volume'
}

export enum StorageStatus {
  AVAILABLE = 'available',
  UNAVAILABLE = 'unavailable',
  DEGRADED = 'degraded',
  FULL = 'full'
}

export interface BackupStatistics {
  totalBackups: number;
  totalSize: number; // bytes
  successRate: number; // percentage
  averageDuration: number; // seconds
  lastSuccessfulBackup?: string;
  lastFailedBackup?: string;
  backupsByType: Record<BackupType, number>;
  backupsBySource: Record<BackupSource, number>;
  dailyBackupTrend: BackupTrend[];
  storageUsageTrend: StorageTrend[];
}

export interface BackupTrend {
  date: string;
  successful: number;
  failed: number;
  totalSize: number;
}

export interface StorageTrend {
  date: string;
  used: number;
  available: number;
}

// Alerts and Notifications
export type AlertSeverity = Status.CRITICAL | Status.WARNING | Status.INFO;

export interface BackupAlert {
  id: string;
  type: BackupAlertType;
  severity: AlertSeverity;
  message: string;
  timestamp: string;
  jobId?: string;
  acknowledged: boolean;
}

export enum BackupAlertType {
  BACKUP_FAILED = 'backup_failed',
  VERIFICATION_FAILED = 'verification_failed',
  STORAGE_FULL = 'storage_full',
  RETENTION_POLICY_VIOLATION = 'retention_policy_violation',
  SCHEDULE_MISSED = 'schedule_missed',
  RECOVERY_FAILED = 'recovery_failed'
}
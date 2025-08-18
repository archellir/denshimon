import {
  BackupJob,
  BackupHistory,
  BackupStorage,
  BackupStatistics,
  BackupAlert,
  BackupType,
  BackupSource,
  BackupStatus,
  StorageType,
  StorageStatus,
  VerificationStatus,
  BackupAlertType,
  CompressionType
} from '@/types/backup';
import { Status } from '@constants';

// Export all mock data for easy import
export const mockBackupJobs: BackupJob[] = [
  {
    id: 'backup-postgresql-main',
    name: 'PostgreSQL Main Database',
    type: BackupType.FULL,
    source: BackupSource.POSTGRESQL,
    schedule: {
      enabled: true,
      cron: '0 2 * * *',
      timezone: 'UTC',
      lastScheduledRun: '2024-01-20T02:00:00Z',
      nextScheduledRun: '2024-01-21T02:00:00Z'
    },
    status: BackupStatus.COMPLETED,
    lastRun: '2024-01-20T02:00:00Z',
    nextRun: '2024-01-21T02:00:00Z',
    retention: {
      daily: 7,
      weekly: 4,
      monthly: 12,
      yearly: 5,
      minBackups: 3
    },
    size: 1073741824,
    duration: 180,
    metadata: {
      database: 'gitea,umami,memos,uptime_kuma',
      compressionType: CompressionType.GZIP,
      encryptionEnabled: true,
      checksum: 'sha256:abcdef123456'
    }
  },
  {
    id: 'backup-sqlite-denshimon',
    name: 'Denshimon SQLite Database',
    type: BackupType.INCREMENTAL,
    source: BackupSource.SQLITE,
    schedule: {
      enabled: true,
      cron: '0 */6 * * *',
      timezone: 'UTC',
      lastScheduledRun: '2024-01-20T12:00:00Z',
      nextScheduledRun: '2024-01-20T18:00:00Z'
    },
    status: BackupStatus.COMPLETED,
    lastRun: '2024-01-20T12:00:00Z',
    nextRun: '2024-01-20T18:00:00Z',
    retention: {
      daily: 14,
      weekly: 8,
      monthly: 6,
      yearly: 2,
      minBackups: 5
    },
    size: 52428800,
    duration: 10,
    metadata: {
      database: 'denshimon.db',
      compressionType: CompressionType.ZSTD,
      encryptionEnabled: true,
      checksum: 'sha256:fedcba987654'
    }
  },
  {
    id: 'backup-gitea-data',
    name: 'Gitea Data Volume',
    type: BackupType.SNAPSHOT,
    source: BackupSource.GITEA_DATA,
    schedule: {
      enabled: true,
      cron: '0 1 * * 1',
      timezone: 'UTC',
      lastScheduledRun: '2024-01-15T01:00:00Z',
      nextScheduledRun: '2024-01-22T01:00:00Z'
    },
    status: BackupStatus.RUNNING,
    lastRun: '2024-01-15T01:00:00Z',
    nextRun: '2024-01-22T01:00:00Z',
    retention: {
      daily: 0,
      weekly: 8,
      monthly: 0,
      yearly: 0,
      minBackups: 2
    },
    size: 5368709120,
    duration: 600,
    metadata: {
      volumePath: '/data/gitea',
      compressionType: CompressionType.XZ,
      encryptionEnabled: true
    }
  },
  {
    id: 'backup-config-files',
    name: 'Configuration Files',
    type: BackupType.FULL,
    source: BackupSource.CONFIG_FILES,
    schedule: {
      enabled: true,
      cron: '0 0 * * *',
      timezone: 'UTC',
      lastScheduledRun: '2024-01-20T00:00:00Z',
      nextScheduledRun: '2024-01-21T00:00:00Z'
    },
    status: BackupStatus.FAILED,
    lastRun: '2024-01-20T00:00:00Z',
    nextRun: '2024-01-21T00:00:00Z',
    retention: {
      daily: 30,
      weekly: 0,
      monthly: 0,
      yearly: 0,
      minBackups: 10
    },
    size: 10485760,
    duration: 5,
    error: 'Permission denied: /etc/kubernetes/manifests',
    metadata: {
      volumePath: '/etc/kubernetes',
      compressionType: CompressionType.BZIP2,
      encryptionEnabled: false
    }
  }
];

export const mockBackupHistory: BackupHistory[] = [
  {
    id: 'backup-hist-001',
    jobId: 'backup-postgresql-main',
    jobName: 'PostgreSQL Main Database',
    timestamp: '2024-01-20T02:00:00Z',
    type: BackupType.FULL,
    source: BackupSource.POSTGRESQL,
    status: BackupStatus.COMPLETED,
    size: 1073741824,
    duration: 180,
    filesCount: 4,
    location: 's3://backups/postgresql/2024-01-20-02-00.tar.gz',
    checksum: 'sha256:abcdef123456',
    verificationStatus: VerificationStatus.VERIFIED
  },
  {
    id: 'backup-hist-002',
    jobId: 'backup-sqlite-denshimon',
    jobName: 'Denshimon SQLite Database',
    timestamp: '2024-01-20T12:00:00Z',
    type: BackupType.INCREMENTAL,
    source: BackupSource.SQLITE,
    status: BackupStatus.COMPLETED,
    size: 52428800,
    duration: 10,
    filesCount: 1,
    location: '/backups/sqlite/denshimon-2024-01-20-12-00.db.zst',
    checksum: 'sha256:fedcba987654',
    verificationStatus: VerificationStatus.VERIFIED
  },
  {
    id: 'backup-hist-003',
    jobId: 'backup-gitea-data',
    jobName: 'Gitea Data Volume',
    timestamp: '2024-01-15T01:00:00Z',
    type: BackupType.SNAPSHOT,
    source: BackupSource.GITEA_DATA,
    status: BackupStatus.COMPLETED,
    size: 5368709120,
    duration: 600,
    filesCount: 15420,
    location: 's3://backups/gitea/snapshot-2024-01-15.tar.xz',
    checksum: 'sha256:789xyz123abc',
    verificationStatus: VerificationStatus.NOT_VERIFIED
  }
];

export const mockBackupStorage: BackupStorage[] = [
  {
    id: 'storage-local',
    name: 'Local Storage',
    type: StorageType.LOCAL,
    location: '/var/backups',
    available: 107374182400,
    used: 64424509440,
    total: 171798691840,
    backupCount: 42,
    oldestBackup: '2024-01-01T00:00:00Z',
    newestBackup: '2024-01-20T12:00:00Z',
    status: StorageStatus.AVAILABLE
  },
  {
    id: 'storage-s3',
    name: 'S3 Backup Bucket',
    type: StorageType.S3,
    location: 's3://backups',
    available: 5497558138880,
    used: 1099511627776,
    total: 6597069766656,
    backupCount: 128,
    oldestBackup: '2023-01-01T00:00:00Z',
    newestBackup: '2024-01-20T02:00:00Z',
    status: StorageStatus.AVAILABLE
  }
];

export const mockBackupStatistics: BackupStatistics = {
  totalBackups: 255,
  totalSize: 2044723306097,
  successRate: 94.5,
  averageDuration: 420,
  lastSuccessfulBackup: '2024-01-20T12:00:00Z',
  lastFailedBackup: '2024-01-20T00:00:00Z',
  backupsByType: {
    [BackupType.FULL]: 85,
    [BackupType.INCREMENTAL]: 120,
    [BackupType.DIFFERENTIAL]: 35,
    [BackupType.SNAPSHOT]: 15
  },
  backupsBySource: {
    [BackupSource.POSTGRESQL]: 60,
    [BackupSource.SQLITE]: 80,
    [BackupSource.PERSISTENT_VOLUME]: 45,
    [BackupSource.GITEA_DATA]: 25,
    [BackupSource.FILEBROWSER_DATA]: 30,
    [BackupSource.CONFIG_FILES]: 15
  },
  dailyBackupTrend: [
    { date: '2024-01-14', successful: 12, failed: 1, totalSize: 107374182400 },
    { date: '2024-01-15', successful: 11, failed: 0, totalSize: 96636764160 },
    { date: '2024-01-16', successful: 12, failed: 0, totalSize: 112742891520 },
    { date: '2024-01-17', successful: 10, failed: 2, totalSize: 85899345920 },
    { date: '2024-01-18', successful: 12, failed: 0, totalSize: 118111600640 },
    { date: '2024-01-19', successful: 11, failed: 1, totalSize: 102005473280 },
    { date: '2024-01-20', successful: 9, failed: 1, totalSize: 91268055040 }
  ],
  storageUsageTrend: [
    { date: '2024-01-14', used: 1900000000000, available: 4600000000000 },
    { date: '2024-01-15', used: 1920000000000, available: 4580000000000 },
    { date: '2024-01-16', used: 1950000000000, available: 4550000000000 },
    { date: '2024-01-17', used: 1980000000000, available: 4520000000000 },
    { date: '2024-01-18', used: 2000000000000, available: 4500000000000 },
    { date: '2024-01-19', used: 2020000000000, available: 4480000000000 },
    { date: '2024-01-20', used: 2044723306097, available: 4455276693903 }
  ]
};

export const mockBackupAlerts: BackupAlert[] = [
  {
    id: 'alert-001',
    type: BackupAlertType.BACKUP_FAILED,
    severity: Status.CRITICAL,
    message: 'Configuration Files backup failed: Permission denied',
    timestamp: '2024-01-20T00:00:05Z',
    jobId: 'backup-config-files',
    acknowledged: false
  },
  {
    id: 'alert-002',
    type: BackupAlertType.STORAGE_FULL,
    severity: Status.WARNING,
    message: 'Local storage is approaching 80% capacity',
    timestamp: '2024-01-20T10:00:00Z',
    acknowledged: false
  }
];
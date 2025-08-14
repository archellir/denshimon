import { create } from 'zustand';
import {
  BackupJob,
  BackupHistory,
  BackupStorage,
  BackupStatistics,
  RecoveryOperation,
  BackupAlert,
  BackupType,
  BackupSource,
  BackupStatus,
  StorageType,
  StorageStatus,
  VerificationStatus,
  BackupAlertType,
  AlertSeverity,
  CompressionType,
  BackupSchedule,
  RecoveryOptions,
  RestoreType
} from '@/types/backup';

interface BackupStore {
  // State
  jobs: BackupJob[];
  history: BackupHistory[];
  storage: BackupStorage[];
  statistics: BackupStatistics | null;
  activeRecoveries: RecoveryOperation[];
  alerts: BackupAlert[];
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchBackupJobs: () => Promise<void>;
  fetchBackupHistory: (jobId?: string) => Promise<void>;
  fetchBackupStorage: () => Promise<void>;
  fetchBackupStatistics: () => Promise<void>;
  fetchActiveRecoveries: () => Promise<void>;
  fetchAlerts: () => Promise<void>;
  runBackup: (jobId: string) => Promise<void>;
  cancelBackup: (jobId: string) => Promise<void>;
  verifyBackup: (backupId: string) => Promise<void>;
  startRecovery: (backupId: string, options?: RecoveryOptions) => Promise<void>;
  deleteBackup: (backupId: string) => Promise<void>;
  updateSchedule: (jobId: string, schedule: BackupSchedule) => Promise<void>;
  acknowledgeAlert: (alertId: string) => void;
  setError: (error: string | null) => void;
}

// Mock data
const mockBackupJobs: BackupJob[] = [
  {
    id: 'backup-postgresql-main',
    name: 'PostgreSQL Main Database',
    type: BackupType.FULL,
    source: BackupSource.POSTGRESQL,
    schedule: {
      enabled: true,
      cron: '0 2 * * *', // Daily at 2 AM
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
    size: 1073741824, // 1GB
    duration: 180, // 3 minutes
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
      cron: '0 */6 * * *', // Every 6 hours
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
    size: 52428800, // 50MB
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
      cron: '0 1 * * 1', // Weekly on Monday at 1 AM
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
    size: 5368709120, // 5GB
    duration: 600, // 10 minutes
    metadata: {
      volumePath: '/data/gitea',
      compressionType: CompressionType.XZ,
      encryptionEnabled: true
    }
  },
  {
    id: 'backup-filebrowser-data',
    name: 'Filebrowser Storage',
    type: BackupType.DIFFERENTIAL,
    source: BackupSource.FILEBROWSER_DATA,
    schedule: {
      enabled: true,
      cron: '0 3 * * *', // Daily at 3 AM
      timezone: 'UTC',
      lastScheduledRun: '2024-01-20T03:00:00Z',
      nextScheduledRun: '2024-01-21T03:00:00Z'
    },
    status: BackupStatus.VERIFIED,
    lastRun: '2024-01-20T03:00:00Z',
    nextRun: '2024-01-21T03:00:00Z',
    retention: {
      daily: 7,
      weekly: 4,
      monthly: 3,
      yearly: 1,
      minBackups: 3
    },
    size: 42949672960, // 40GB
    duration: 1800, // 30 minutes
    metadata: {
      volumePath: '/data/filebrowser',
      compressionType: CompressionType.GZIP,
      encryptionEnabled: true,
      checksum: 'sha256:123abc456def'
    }
  },
  {
    id: 'backup-config-files',
    name: 'Configuration Files',
    type: BackupType.FULL,
    source: BackupSource.CONFIG_FILES,
    schedule: {
      enabled: true,
      cron: '0 0 * * *', // Daily at midnight
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
    size: 10485760, // 10MB
    duration: 5,
    error: 'Permission denied: /etc/kubernetes/manifests',
    metadata: {
      volumePath: '/etc/kubernetes',
      compressionType: CompressionType.BZIP2,
      encryptionEnabled: false
    }
  }
];

const mockBackupHistory: BackupHistory[] = [
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
    verificationStatus: VerificationStatus.VERIFIED,
    restorePoints: [
      {
        id: 'rp-001',
        backupId: 'backup-hist-001',
        timestamp: '2024-01-20T02:00:00Z',
        type: RestoreType.FULL_RESTORE,
        size: 1073741824,
        recoverable: true
      }
    ]
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
  },
  {
    id: 'backup-hist-004',
    jobId: 'backup-config-files',
    jobName: 'Configuration Files',
    timestamp: '2024-01-20T00:00:00Z',
    type: BackupType.FULL,
    source: BackupSource.CONFIG_FILES,
    status: BackupStatus.FAILED,
    size: 0,
    duration: 5,
    location: '',
    checksum: '',
    verificationStatus: VerificationStatus.NOT_VERIFIED
  }
];

const mockBackupStorage: BackupStorage[] = [
  {
    id: 'storage-local',
    name: 'Local Storage',
    type: StorageType.LOCAL,
    location: '/var/backups',
    available: 107374182400, // 100GB
    used: 64424509440, // 60GB
    total: 171798691840, // 160GB
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
    available: 5497558138880, // 5TB
    used: 1099511627776, // 1TB
    total: 6597069766656, // 6TB
    backupCount: 128,
    oldestBackup: '2023-01-01T00:00:00Z',
    newestBackup: '2024-01-20T02:00:00Z',
    status: StorageStatus.AVAILABLE
  },
  {
    id: 'storage-nfs',
    name: 'NFS Backup Share',
    type: StorageType.NFS,
    location: 'nfs://nas.local/backups',
    available: 1099511627776, // 1TB
    used: 879609302221, // ~820GB
    total: 2199023255552, // 2TB
    backupCount: 85,
    oldestBackup: '2023-06-01T00:00:00Z',
    newestBackup: '2024-01-20T03:00:00Z',
    status: StorageStatus.DEGRADED
  }
];

const mockBackupStatistics: BackupStatistics = {
  totalBackups: 255,
  totalSize: 2044723306097, // ~1.86TB
  successRate: 94.5,
  averageDuration: 420, // 7 minutes
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

const mockActiveRecoveries: RecoveryOperation[] = [];

const mockBackupAlerts: BackupAlert[] = [
  {
    id: 'alert-001',
    type: BackupAlertType.BACKUP_FAILED,
    severity: AlertSeverity.CRITICAL,
    message: 'Configuration Files backup failed: Permission denied',
    timestamp: '2024-01-20T00:00:05Z',
    jobId: 'backup-config-files',
    acknowledged: false
  },
  {
    id: 'alert-002',
    type: BackupAlertType.STORAGE_FULL,
    severity: AlertSeverity.WARNING,
    message: 'NFS Backup Share is 80% full',
    timestamp: '2024-01-20T10:00:00Z',
    acknowledged: false
  },
  {
    id: 'alert-003',
    type: BackupAlertType.VERIFICATION_FAILED,
    severity: AlertSeverity.WARNING,
    message: 'Gitea Data Volume backup verification pending for 5 days',
    timestamp: '2024-01-20T12:00:00Z',
    jobId: 'backup-gitea-data',
    acknowledged: false
  }
];

const useBackupStore = create<BackupStore>((set, get) => ({
  // Initial state
  jobs: mockBackupJobs,
  history: mockBackupHistory,
  storage: mockBackupStorage,
  statistics: mockBackupStatistics,
  activeRecoveries: mockActiveRecoveries,
  alerts: mockBackupAlerts,
  isLoading: false,
  error: null,

  // Actions
  fetchBackupJobs: async () => {
    set({ isLoading: true, error: null });
    
    try {
      // In development, use mock data
      if (import.meta.env.DEV) {
        await new Promise(resolve => setTimeout(resolve, 500));
        set({ jobs: mockBackupJobs, isLoading: false });
        return;
      }

      const response = await fetch('/api/backup/jobs', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch backup jobs: ${response.statusText}`);
      }

      const data = await response.json();
      set({ jobs: data.data || [], isLoading: false });
    } catch (error) {
      console.error('Failed to fetch backup jobs:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch backup jobs',
        isLoading: false 
      });
    }
  },

  fetchBackupHistory: async (jobId?: string) => {
    set({ isLoading: true, error: null });
    
    try {
      // In development, use mock data
      if (import.meta.env.DEV) {
        await new Promise(resolve => setTimeout(resolve, 500));
        const history = jobId 
          ? mockBackupHistory.filter(h => h.jobId === jobId)
          : mockBackupHistory;
        set({ history, isLoading: false });
        return;
      }

      const url = jobId 
        ? `/api/backup/history?jobId=${jobId}`
        : '/api/backup/history';
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch backup history: ${response.statusText}`);
      }

      const data = await response.json();
      set({ history: data.data || [], isLoading: false });
    } catch (error) {
      console.error('Failed to fetch backup history:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch backup history',
        isLoading: false 
      });
    }
  },

  fetchBackupStorage: async () => {
    try {
      // In development, use mock data
      if (import.meta.env.DEV) {
        set({ storage: mockBackupStorage });
        return;
      }

      const response = await fetch('/api/backup/storage', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch backup storage: ${response.statusText}`);
      }

      const data = await response.json();
      set({ storage: data.data || [] });
    } catch (error) {
      console.error('Failed to fetch backup storage:', error);
    }
  },

  fetchBackupStatistics: async () => {
    try {
      // In development, use mock data
      if (import.meta.env.DEV) {
        set({ statistics: mockBackupStatistics });
        return;
      }

      const response = await fetch('/api/backup/statistics', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch backup statistics: ${response.statusText}`);
      }

      const data = await response.json();
      set({ statistics: data.data });
    } catch (error) {
      console.error('Failed to fetch backup statistics:', error);
    }
  },

  fetchActiveRecoveries: async () => {
    try {
      // In development, use mock data
      if (import.meta.env.DEV) {
        set({ activeRecoveries: mockActiveRecoveries });
        return;
      }

      const response = await fetch('/api/backup/recoveries/active', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch active recoveries: ${response.statusText}`);
      }

      const data = await response.json();
      set({ activeRecoveries: data.data || [] });
    } catch (error) {
      console.error('Failed to fetch active recoveries:', error);
    }
  },

  fetchAlerts: async () => {
    try {
      // In development, use mock data
      if (import.meta.env.DEV) {
        set({ alerts: mockBackupAlerts });
        return;
      }

      const response = await fetch('/api/backup/alerts', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch backup alerts: ${response.statusText}`);
      }

      const data = await response.json();
      set({ alerts: data.data || [] });
    } catch (error) {
      console.error('Failed to fetch backup alerts:', error);
    }
  },

  runBackup: async (jobId: string) => {
    try {
      const response = await fetch(`/api/backup/jobs/${jobId}/run`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to run backup: ${response.statusText}`);
      }

      // Refresh job status
      await get().fetchBackupJobs();
    } catch (error) {
      console.error('Failed to run backup:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to run backup' });
    }
  },

  cancelBackup: async (jobId: string) => {
    try {
      const response = await fetch(`/api/backup/jobs/${jobId}/cancel`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to cancel backup: ${response.statusText}`);
      }

      // Refresh job status
      await get().fetchBackupJobs();
    } catch (error) {
      console.error('Failed to cancel backup:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to cancel backup' });
    }
  },

  verifyBackup: async (backupId: string) => {
    try {
      const response = await fetch(`/api/backup/history/${backupId}/verify`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to verify backup: ${response.statusText}`);
      }

      // Refresh history
      await get().fetchBackupHistory();
    } catch (error) {
      console.error('Failed to verify backup:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to verify backup' });
    }
  },

  startRecovery: async (backupId: string, options?: RecoveryOptions) => {
    try {
      const response = await fetch(`/api/backup/history/${backupId}/recover`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(options || {})
      });

      if (!response.ok) {
        throw new Error(`Failed to start recovery: ${response.statusText}`);
      }

      // Refresh active recoveries
      await get().fetchActiveRecoveries();
    } catch (error) {
      console.error('Failed to start recovery:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to start recovery' });
    }
  },

  deleteBackup: async (backupId: string) => {
    try {
      const response = await fetch(`/api/backup/history/${backupId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to delete backup: ${response.statusText}`);
      }

      // Refresh history
      await get().fetchBackupHistory();
    } catch (error) {
      console.error('Failed to delete backup:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to delete backup' });
    }
  },

  updateSchedule: async (jobId: string, schedule: BackupSchedule) => {
    try {
      const response = await fetch(`/api/backup/jobs/${jobId}/schedule`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(schedule)
      });

      if (!response.ok) {
        throw new Error(`Failed to update schedule: ${response.statusText}`);
      }

      // Refresh jobs
      await get().fetchBackupJobs();
    } catch (error) {
      console.error('Failed to update schedule:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to update schedule' });
    }
  },

  acknowledgeAlert: (alertId: string) => {
    const { alerts } = get();
    const updatedAlerts = alerts.map(alert => 
      alert.id === alertId ? { ...alert, acknowledged: true } : alert
    );
    set({ alerts: updatedAlerts });
  },

  setError: (error: string | null) => {
    set({ error });
  }
}));

export default useBackupStore;
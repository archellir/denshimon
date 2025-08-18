import { useEffect, useState } from 'react';
import type { FC } from 'react';
import { Status } from '@constants';
import {
  HardDrive,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Play,
  Pause,
  Database,
  Archive,
  Settings,
  RefreshCw,
  Eye,
  X,
  AlertCircle,
  Server,
  FileText
} from 'lucide-react';
import useBackupStore from '@stores/backupStore';
import StatCard from '@components/common/StatCard';
import { 
  BackupStatus, 
  BackupSource,
  StorageStatus,
  VerificationStatus
} from '@/types/backup';

const BackupRecoveryDashboard: FC = () => {
  const {
    jobs,
    history,
    storage,
    statistics,
    alerts,
    error,
    fetchBackupJobs,
    fetchBackupHistory,
    fetchBackupStorage,
    fetchBackupStatistics,
    fetchActiveRecoveries,
    fetchAlerts,
    runBackup,
    cancelBackup,
    verifyBackup,
    acknowledgeAlert,
    setError
  } = useBackupStore();

  const [selectedJob, setSelectedJob] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'jobs' | 'history' | 'storage'>('jobs');
  const [autoRefresh] = useState(true);

  // Load initial data
  useEffect(() => {
    fetchBackupJobs();
    fetchBackupHistory();
    fetchBackupStorage();
    fetchBackupStatistics();
    fetchActiveRecoveries();
    fetchAlerts();
  }, [fetchBackupJobs, fetchBackupHistory, fetchBackupStorage, fetchBackupStatistics, fetchActiveRecoveries, fetchAlerts]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchBackupJobs();
      fetchBackupHistory();
      fetchBackupStorage();
      fetchBackupStatistics();
      fetchActiveRecoveries();
      fetchAlerts();
    }, 30 * 1000);

    return () => clearInterval(interval);
  }, [autoRefresh, fetchBackupJobs, fetchBackupHistory, fetchBackupStorage, fetchBackupStatistics, fetchActiveRecoveries, fetchAlerts]);

  // Listen for external refresh events
  useEffect(() => {
    const handleRefresh = () => {
      fetchBackupJobs();
      fetchBackupHistory();
      fetchBackupStorage();
      fetchBackupStatistics();
      fetchActiveRecoveries();
      fetchAlerts();
    };

    window.addEventListener('refreshBackupData', handleRefresh);
    return () => window.removeEventListener('refreshBackupData', handleRefresh);
  }, [fetchBackupJobs, fetchBackupHistory, fetchBackupStorage, fetchBackupStatistics, fetchActiveRecoveries, fetchAlerts]);

  const getStatusColor = (status: BackupStatus) => {
    switch (status) {
      case BackupStatus.COMPLETED:
      case BackupStatus.VERIFIED:
        return 'border-green-400 text-green-400';
      case BackupStatus.RUNNING:
      case BackupStatus.VERIFYING:
        return 'border-blue-400 text-blue-400';
      case BackupStatus.FAILED:
        return 'border-red-400 text-red-400';
      case BackupStatus.SCHEDULED:
        return 'border-yellow-400 text-yellow-400';
      case BackupStatus.CANCELLED:
        return 'border-gray-400 text-gray-400';
      default:
        return 'border-white';
    }
  };

  const getStatusIcon = (status: BackupStatus) => {
    switch (status) {
      case BackupStatus.COMPLETED:
      case BackupStatus.VERIFIED:
        return <CheckCircle size={16} className="text-green-400" />;
      case BackupStatus.RUNNING:
      case BackupStatus.VERIFYING:
        return <RefreshCw size={16} className="text-blue-400 animate-spin" />;
      case BackupStatus.FAILED:
        return <XCircle size={16} className="text-red-400" />;
      case BackupStatus.SCHEDULED:
        return <Clock size={16} className="text-yellow-400" />;
      case BackupStatus.CANCELLED:
        return <Pause size={16} className="text-gray-400" />;
      default:
        return <Archive size={16} />;
    }
  };

  const getSourceIcon = (source: BackupSource) => {
    switch (source) {
      case BackupSource.POSTGRESQL:
        return <Database size={16} className="text-blue-400" />;
      case BackupSource.SQLITE:
        return <Database size={16} className="text-green-400" />;
      case BackupSource.GITEA_DATA:
        return <Server size={16} className="text-purple-400" />;
      case BackupSource.FILEBROWSER_DATA:
        return <FileText size={16} className="text-orange-400" />;
      case BackupSource.PERSISTENT_VOLUME:
        return <HardDrive size={16} className="text-cyan-400" />;
      case BackupSource.CONFIG_FILES:
        return <Settings size={16} className="text-gray-400" />;
      default:
        return <Archive size={16} />;
    }
  };

  const formatBytes = (bytes: number) => {
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStorageStatusColor = (status: StorageStatus) => {
    switch (status) {
      case StorageStatus.AVAILABLE:
        return 'border-green-400 text-green-400';
      case StorageStatus.DEGRADED:
        return 'border-yellow-400 text-yellow-400';
      case StorageStatus.UNAVAILABLE:
      case StorageStatus.FULL:
        return 'border-red-400 text-red-400';
      default:
        return 'border-white';
    }
  };

  const selectedJobData = jobs.find(job => job.id === selectedJob);

  return (
    <div className="space-y-6">

      {/* Error Display */}
      {error && (
        <div className="p-4 border border-red-400 bg-red-900/20 text-red-400 font-mono text-sm flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertTriangle size={16} />
            <span>ERROR: {error}</span>
          </div>
          <button
            onClick={() => setError(null)}
            className="p-1 hover:bg-red-400/20 transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-5 gap-4">
          <StatCard
            label="TOTAL BACKUPS"
            value={statistics.totalBackups.toString()}
            icon={Archive}
            status={Status.INFO}
            variant="analytics"
            description={formatBytes(statistics.totalSize)}
          />
          
          <StatCard
            label="SUCCESS RATE"
            value={`${statistics.successRate.toFixed(1)}%`}
            icon={CheckCircle}
            status={Status.SUCCESS}
            variant="analytics"
            description="Last 30 days"
          />
          
          <StatCard
            label="AVG DURATION"
            value={formatDuration(statistics.averageDuration)}
            icon={Clock}
            status={Status.INFO}
            variant="analytics"
            description="Per backup"
          />

          <StatCard
            label="RUNNING"
            value={jobs.filter(j => j.status === BackupStatus.RUNNING).length.toString()}
            icon={RefreshCw}
            status={Status.WARNING}
            variant="analytics"
            description="Active jobs"
          />

          <StatCard
            label="ALERTS"
            value={alerts.filter(a => !a.acknowledged).length.toString()}
            icon={AlertTriangle}
            status={Status.ERROR}
            variant="analytics"
            description="Unacknowledged"
          />
        </div>
      )}

      {/* Active Alerts */}
      {alerts.filter(a => !a.acknowledged).length > 0 && (
        <div className="border border-yellow-400 bg-yellow-900/10">
          <div className="bg-yellow-400/10 p-3 border-b border-yellow-400">
            <h4 className="font-mono text-sm text-yellow-400">
              ACTIVE ALERTS ({alerts.filter(a => !a.acknowledged).length})
            </h4>
          </div>
          <div className="p-4 space-y-2">
            {alerts.filter(a => !a.acknowledged).slice(0, 5).map((alert) => (
              <div key={alert.id} className="flex items-center justify-between py-2 border-b border-yellow-400/20 last:border-b-0">
                <div className="flex items-center space-x-3">
                  {alert.severity === 'critical' ? (
                    <AlertTriangle size={16} className="text-red-400" />
                  ) : (
                    <AlertCircle size={16} className="text-yellow-400" />
                  )}
                  <span className="font-mono text-sm">{alert.message}</span>
                  <span className="font-mono text-xs opacity-60">{formatDate(alert.timestamp)}</span>
                </div>
                <button
                  onClick={() => acknowledgeAlert(alert.id)}
                  className="px-2 py-1 border border-yellow-400 text-yellow-400 hover:bg-yellow-400 hover:text-black transition-colors font-mono text-xs"
                >
                  ACK
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* View Mode Toggle */}
      <div className="flex space-x-1">
        <button
          onClick={() => setViewMode('jobs')}
          className={`px-4 py-2 font-mono text-sm transition-colors ${
            viewMode === 'jobs' 
              ? 'bg-white text-black' 
              : 'border border-white hover:bg-white hover:text-black'
          }`}
        >
          BACKUP JOBS
        </button>
        <button
          onClick={() => setViewMode('history')}
          className={`px-4 py-2 font-mono text-sm transition-colors ${
            viewMode === 'history' 
              ? 'bg-white text-black' 
              : 'border border-white hover:bg-white hover:text-black'
          }`}
        >
          BACKUP HISTORY
        </button>
        <button
          onClick={() => setViewMode('storage')}
          className={`px-4 py-2 font-mono text-sm transition-colors ${
            viewMode === 'storage' 
              ? 'bg-white text-black' 
              : 'border border-white hover:bg-white hover:text-black'
          }`}
        >
          STORAGE
        </button>
      </div>

      {/* Content based on view mode */}
      {viewMode === 'jobs' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {jobs.map((job) => (
            <div
              key={job.id}
              className={`border p-4 cursor-pointer transition-colors hover:bg-white/5 ${getStatusColor(job.status)}`}
              onClick={() => setSelectedJob(job.id)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3">
                  {getSourceIcon(job.source)}
                  <div>
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(job.status)}
                      <span className="font-mono text-sm font-semibold">{job.name}</span>
                    </div>
                    <div className="font-mono text-xs opacity-60">{job.source.toUpperCase()}</div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {job.status === BackupStatus.RUNNING ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        cancelBackup(job.id);
                      }}
                      className="p-1 hover:bg-red-400/20 transition-colors"
                    >
                      <Pause size={12} className="text-red-400" />
                    </button>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        runBackup(job.id);
                      }}
                      className="p-1 hover:bg-green-400/20 transition-colors"
                    >
                      <Play size={12} className="text-green-400" />
                    </button>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedJob(job.id);
                    }}
                    className="p-1 hover:bg-white/10 transition-colors"
                  >
                    <Eye size={12} />
                  </button>
                </div>
              </div>
              
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs opacity-60">Type</span>
                  <span className="font-mono text-xs">{job.type.toUpperCase()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs opacity-60">Schedule</span>
                  <span className="font-mono text-xs">{job.schedule.enabled ? 'ENABLED' : 'DISABLED'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs opacity-60">Last Run</span>
                  <span className="font-mono text-xs">{job.lastRun ? formatDate(job.lastRun) : 'NEVER'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs opacity-60">Size</span>
                  <span className="font-mono text-xs">{job.size ? formatBytes(job.size) : 'N/A'}</span>
                </div>
                {job.error && (
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs opacity-60">Error</span>
                    <span className="font-mono text-xs text-red-400 truncate max-w-32" title={job.error}>
                      {job.error}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {viewMode === 'history' && (
        <div className="grid grid-cols-1 gap-2">
          {history.map((backup) => (
            <div
              key={backup.id}
              className={`border p-3 cursor-pointer transition-colors hover:bg-white/5 ${getStatusColor(backup.status)}`}
              onClick={() => {
                // Handle backup selection for details view
                // Selected backup for details
                // Could open a detailed view modal or expand inline details
                alert(`Backup details for: ${backup.jobName} (${formatDate(backup.timestamp)})`);
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {getSourceIcon(backup.source)}
                  {getStatusIcon(backup.status)}
                  <span className="font-mono text-sm">{backup.jobName}</span>
                  <span className="font-mono text-xs opacity-60">{backup.type.toUpperCase()}</span>
                  <span className="font-mono text-xs">{formatDate(backup.timestamp)}</span>
                </div>
                <div className="flex items-center space-x-4">
                  <span className="font-mono text-xs">{formatBytes(backup.size)}</span>
                  <span className="font-mono text-xs">{formatDuration(backup.duration)}</span>
                  {backup.verificationStatus === VerificationStatus.NOT_VERIFIED && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        verifyBackup(backup.id);
                      }}
                      className="px-2 py-1 border border-blue-400 text-blue-400 hover:bg-blue-400 hover:text-black transition-colors font-mono text-xs"
                    >
                      VERIFY
                    </button>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      // Handle backup restoration
                      const confirmRestore = confirm(`Are you sure you want to restore backup: ${backup.jobName} from ${formatDate(backup.timestamp)}?\n\nThis action cannot be undone.`);
                      if (confirmRestore) {
                        // Starting restoration for backup
                        alert(`Restoration started for backup: ${backup.jobName}`);
                        // Here you would call the backup store's startRecovery function
                      }
                    }}
                    className="px-2 py-1 border border-green-400 text-green-400 hover:bg-green-400 hover:text-black transition-colors font-mono text-xs"
                  >
                    RESTORE
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {viewMode === 'storage' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {storage.map((store) => (
            <div
              key={store.id}
              className={`border p-4 ${getStorageStatusColor(store.status)}`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <HardDrive size={16} />
                  <span className="font-mono text-sm font-semibold">{store.name}</span>
                </div>
                <span className="font-mono text-xs">{store.type.toUpperCase()}</span>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs opacity-60">Used</span>
                  <span className="font-mono text-xs">{formatBytes(store.used)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs opacity-60">Available</span>
                  <span className="font-mono text-xs">{formatBytes(store.available)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs opacity-60">Total</span>
                  <span className="font-mono text-xs">{formatBytes(store.total)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs opacity-60">Backups</span>
                  <span className="font-mono text-xs">{store.backupCount}</span>
                </div>
                <div className="w-full bg-white/10 h-1">
                  <div 
                    className="h-1 bg-current transition-all" 
                    style={{ width: `${(store.used / store.total) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Job Details Modal */}
      {selectedJobData && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-black border border-white max-w-4xl w-full max-h-screen overflow-y-auto">
            <div className="p-4 border-b border-white flex items-center justify-between">
              <h3 className="font-mono text-lg">BACKUP JOB: {selectedJobData.name}</h3>
              <button
                onClick={() => setSelectedJob(null)}
                className="p-1 hover:bg-white/10 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-3 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="font-mono text-sm opacity-60">Job Name</label>
                    <div className="font-mono">{selectedJobData.name}</div>
                  </div>
                  <div>
                    <label className="font-mono text-sm opacity-60">Source</label>
                    <div className="font-mono">{selectedJobData.source}</div>
                  </div>
                  <div>
                    <label className="font-mono text-sm opacity-60">Type</label>
                    <div className="font-mono">{selectedJobData.type}</div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="font-mono text-sm opacity-60">Status</label>
                    <div className={`flex items-center space-x-2 ${getStatusColor(selectedJobData.status)}`}>
                      {getStatusIcon(selectedJobData.status)}
                      <span className="font-mono uppercase">{selectedJobData.status}</span>
                    </div>
                  </div>
                  <div>
                    <label className="font-mono text-sm opacity-60">Schedule</label>
                    <div className="font-mono text-sm">
                      {selectedJobData.schedule.enabled ? 'ENABLED' : 'DISABLED'}
                    </div>
                    <div className="font-mono text-xs opacity-60">{selectedJobData.schedule.cron}</div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="font-mono text-sm opacity-60">Last Run</label>
                    <div className="font-mono text-sm">
                      {selectedJobData.lastRun ? formatDate(selectedJobData.lastRun) : 'Never'}
                    </div>
                  </div>
                  <div>
                    <label className="font-mono text-sm opacity-60">Next Run</label>
                    <div className="font-mono text-sm">
                      {selectedJobData.nextRun ? formatDate(selectedJobData.nextRun) : 'Not scheduled'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Retention Policy */}
              <div className="border border-white/20 p-4">
                <h4 className="font-mono text-sm mb-3">RETENTION POLICY</h4>
                <div className="grid grid-cols-4 gap-4">
                  <div>
                    <span className="font-mono text-xs opacity-60">Daily</span>
                    <div className="font-mono text-sm">{selectedJobData.retention.daily} backups</div>
                  </div>
                  <div>
                    <span className="font-mono text-xs opacity-60">Weekly</span>
                    <div className="font-mono text-sm">{selectedJobData.retention.weekly} backups</div>
                  </div>
                  <div>
                    <span className="font-mono text-xs opacity-60">Monthly</span>
                    <div className="font-mono text-sm">{selectedJobData.retention.monthly} backups</div>
                  </div>
                  <div>
                    <span className="font-mono text-xs opacity-60">Yearly</span>
                    <div className="font-mono text-sm">{selectedJobData.retention.yearly} backups</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BackupRecoveryDashboard;
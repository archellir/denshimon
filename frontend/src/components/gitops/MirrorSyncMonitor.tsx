import { useState, FC } from 'react';
import { 
  GitBranch,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  Activity,
  ExternalLink,
  Play,
  Loader
} from 'lucide-react';
import useGitOpsStore from '@stores/gitopsStore';
import { MirrorSyncStatus } from '@/types/gitops';
import type { Repository } from '@/types/gitops';

interface MirrorSyncMonitorProps {
  selectedRepository?: string | null;
  showCompact?: boolean;
}

const MirrorSyncMonitor: FC<MirrorSyncMonitorProps> = ({ 
  selectedRepository, 
  showCompact = false 
}) => {
  const [refreshing, setRefreshing] = useState<string | null>(null);

  const {
    repositories,
    isLoading,
    isSyncing,
    error,
    fetchRepositories,
    triggerMirrorSync
  } = useGitOpsStore();

  // Filter repositories if selected
  const filteredRepos = selectedRepository 
    ? repositories.filter(repo => repo.id === selectedRepository)
    : repositories;

  // Get status display info
  const getStatusDisplay = (status: MirrorSyncStatus) => {
    switch (status) {
      case MirrorSyncStatus.SYNCED:
        return { 
          color: 'text-green-500 border-green-500', 
          icon: CheckCircle, 
          label: 'SYNCED',
          description: 'Repository is up to date'
        };
      case MirrorSyncStatus.SYNCING:
        return { 
          color: 'text-blue-500 border-blue-500', 
          icon: RefreshCw, 
          label: 'SYNCING',
          description: 'Mirror sync in progress'
        };
      case MirrorSyncStatus.OUT_OF_SYNC:
        return { 
          color: 'text-yellow-500 border-yellow-500', 
          icon: AlertCircle, 
          label: 'OUT OF SYNC',
          description: 'GitHub repository has newer commits'
        };
      case MirrorSyncStatus.ERROR:
        return { 
          color: 'text-red-500 border-red-500', 
          icon: XCircle, 
          label: 'ERROR',
          description: 'Sync failed - authentication or network issue'
        };
      default:
        return { 
          color: 'text-gray-500 border-gray-500', 
          icon: Clock, 
          label: 'UNKNOWN',
          description: 'Status unknown'
        };
    }
  };

  // Handle manual sync trigger
  const handleSyncRepository = async (repo: Repository) => {
    try {
      setRefreshing(repo.id);
      await triggerMirrorSync(repo.id);
      // Refresh repository data after sync
      await fetchRepositories();
    } catch (error) {
      console.error('Failed to sync repository:', error);
    } finally {
      setRefreshing(null);
    }
  };

  // Calculate sync health metrics
  const syncMetrics = {
    total: filteredRepos.length,
    synced: filteredRepos.filter(r => r.mirror_sync_status === MirrorSyncStatus.SYNCED).length,
    syncing: filteredRepos.filter(r => r.mirror_sync_status === MirrorSyncStatus.SYNCING).length,
    outOfSync: filteredRepos.filter(r => r.mirror_sync_status === MirrorSyncStatus.OUT_OF_SYNC).length,
    errors: filteredRepos.filter(r => r.mirror_sync_status === MirrorSyncStatus.ERROR).length
  };

  const formatTimestamp = (timestamp?: string) => {
    if (!timestamp) return 'Never';
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return `${Math.floor(diff / 86400000)}d ago`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <Loader className="w-6 h-6 animate-spin mr-2" />
        <span className="font-mono">Loading mirror sync status...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="border border-red-500 bg-red-900/20 p-4">
        <div className="flex items-center">
          <XCircle className="w-5 h-5 text-red-500 mr-2" />
          <span className="font-mono text-red-400">{error}</span>
        </div>
      </div>
    );
  }

  if (showCompact) {
    return (
      <div className="space-y-2">
        {/* Compact Sync Status */}
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-mono">MIRROR SYNC STATUS</h3>
          <div className="flex items-center space-x-2 text-xs">
            <span className="text-green-400">{syncMetrics.synced} SYNCED</span>
            {syncMetrics.outOfSync > 0 && (
              <span className="text-yellow-400">{syncMetrics.outOfSync} OUT OF SYNC</span>
            )}
            {syncMetrics.errors > 0 && (
              <span className="text-red-400">{syncMetrics.errors} ERRORS</span>
            )}
          </div>
        </div>
        
        {/* Repository List - Compact */}
        <div className="space-y-1">
          {filteredRepos.map((repo) => {
            const statusDisplay = getStatusDisplay(repo.mirror_sync_status);
            const StatusIcon = statusDisplay.icon;
            
            return (
              <div key={repo.id} className={`border ${statusDisplay.color} p-2 text-xs`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <StatusIcon className={`w-3 h-3 ${statusDisplay.color.split(' ')[0]}`} />
                    <span className="font-mono">{repo.name}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-400">
                      {formatTimestamp(repo.last_sync || undefined)}
                    </span>
                    <button
                      onClick={() => handleSyncRepository(repo)}
                      disabled={refreshing === repo.id || isSyncing}
                      className="p-1 hover:bg-white/10 disabled:opacity-50"
                    >
                      {refreshing === repo.id ? (
                        <Loader className="w-3 h-3 animate-spin" />
                      ) : (
                        <RefreshCw className="w-3 h-3" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Sync Metrics Overview */}
      <div className="border border-white p-4">
        <h2 className="text-lg font-mono mb-4 flex items-center">
          <GitBranch className="w-5 h-5 mr-2" />
          GITHUB MIRROR SYNC STATUS
        </h2>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="border border-green-500 p-3 text-center">
            <div className="text-2xl font-mono text-green-400">{syncMetrics.synced}</div>
            <div className="text-xs text-gray-400">SYNCED</div>
          </div>
          <div className="border border-yellow-500 p-3 text-center">
            <div className="text-2xl font-mono text-yellow-400">{syncMetrics.outOfSync}</div>
            <div className="text-xs text-gray-400">OUT OF SYNC</div>
          </div>
          <div className="border border-blue-500 p-3 text-center">
            <div className="text-2xl font-mono text-blue-400">{syncMetrics.syncing}</div>
            <div className="text-xs text-gray-400">SYNCING</div>
          </div>
          <div className="border border-red-500 p-3 text-center">
            <div className="text-2xl font-mono text-red-400">{syncMetrics.errors}</div>
            <div className="text-xs text-gray-400">ERRORS</div>
          </div>
        </div>
      </div>

      {/* Detailed Repository Sync Status */}
      <div className="border border-white p-4">
        <h3 className="text-lg font-mono mb-4 flex items-center">
          <Activity className="w-5 h-5 mr-2" />
          REPOSITORY SYNC DETAILS
        </h3>
        
        <div className="space-y-3">
          {filteredRepos.map((repo) => {
            const statusDisplay = getStatusDisplay(repo.mirror_sync_status);
            const StatusIcon = statusDisplay.icon;
            
            return (
              <div key={repo.id} className={`border ${statusDisplay.color} p-4`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <StatusIcon className={`w-5 h-5 ${statusDisplay.color.split(' ')[0]} ${
                      repo.mirror_sync_status === MirrorSyncStatus.SYNCING ? 'animate-spin' : ''
                    }`} />
                    <div>
                      <h4 className="font-mono font-bold">{repo.name}</h4>
                      <p className="text-sm text-gray-400">{statusDisplay.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 border ${statusDisplay.color} text-xs font-mono`}>
                      {statusDisplay.label}
                    </span>
                    <button
                      onClick={() => handleSyncRepository(repo)}
                      disabled={refreshing === repo.id || isSyncing}
                      className="flex items-center space-x-1 px-3 py-1 border border-blue-400 text-blue-400 hover:bg-blue-400 hover:text-black transition-colors font-mono text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {refreshing === repo.id ? (
                        <Loader className="w-3 h-3 animate-spin" />
                      ) : (
                        <Play className="w-3 h-3" />
                      )}
                      <span>SYNC NOW</span>
                    </button>
                  </div>
                </div>
                
                {/* Repository URLs and Sync Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-gray-400 mb-1">GITHUB SOURCE:</div>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono">{repo.github_url || repo.url}</span>
                      {repo.github_url && (
                        <a 
                          href={repo.github_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:text-blue-300"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-400 mb-1">GITEA MIRROR:</div>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono">{repo.url}</span>
                      <a 
                        href={repo.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                </div>
                
                <div className="mt-3 pt-3 border-t border-gray-600 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div>
                    <span className="text-gray-400">Last Sync:</span>
                    <span className="ml-2 font-mono">{formatTimestamp(repo.last_sync || undefined)}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Sync Interval:</span>
                    <span className="ml-2 font-mono">15 min</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Auto Sync:</span>
                    <span className="ml-2 font-mono text-green-400">ENABLED</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default MirrorSyncMonitor;
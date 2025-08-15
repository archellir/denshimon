import { useState, useEffect } from 'react';
import { 
  GitOpsRepositoryStatus, 
  GitOpsApplicationHealth, 
  GitOpsApplicationSyncStatus,
  GitOpsDeploymentStatus,
  API_ENDPOINTS,
  UI_MESSAGES
} from '@/constants';
// Using standard HTML/CSS instead of shadcn components
import { RefreshCw, GitBranch, Zap, History, RotateCcw, X } from 'lucide-react';

interface GitOpsRepository {
  id: string;
  name: string;
  url: string;
  branch: string;
  path: string;
  status: GitOpsRepositoryStatus;
  description?: string;
  last_sync?: string;
  created_at: string;
  updated_at: string;
}

interface GitOpsApplication {
  id: string;
  name: string;
  namespace: string;
  repository_id?: string;
  path?: string;
  image: string;
  replicas: number;
  resources?: Record<string, string>;
  environment?: Record<string, string>;
  status: string;
  health: GitOpsApplicationHealth;
  sync_status: GitOpsApplicationSyncStatus;
  last_deployed?: string;
  created_at: string;
  updated_at: string;
}

interface GitOpsDeployment {
  id: string;
  application_id: string;
  image: string;
  replicas: number;
  environment?: Record<string, string>;
  git_hash?: string;
  status: GitOpsDeploymentStatus;
  message?: string;
  deployed_by: string;
  deployed_at: string;
}

interface SyncStatus {
  last_sync: string;
  pending_changes: boolean;
  application_count: number;
  recent_commits: Array<{
    hash: string;
    author: string;
    message: string;
    timestamp: string;
  }>;
  git_status: string;
}

const GitOpsTab: React.FC = () => {
  const [repositories, setRepositories] = useState<GitOpsRepository[]>([]);
  const [applications, setApplications] = useState<GitOpsApplication[]>([]);
  // const [deploymentHistory, setDeploymentHistory] = useState<GitOpsDeployment[]>([]);
  const [rollbackTargets, setRollbackTargets] = useState<{ [key: string]: GitOpsDeployment[] }>({});
  const [showRollbackModal, setShowRollbackModal] = useState(false);
  const [selectedApp, setSelectedApp] = useState<GitOpsApplication | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [activeTab, setActiveTab] = useState('applications');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [reposRes, appsRes, syncRes] = await Promise.all([
        fetch(API_ENDPOINTS.GITOPS.REPOSITORIES),
        fetch(API_ENDPOINTS.GITOPS.APPLICATIONS),
        fetch(API_ENDPOINTS.GITOPS.BASE + '/sync/status')
      ]);

      if (reposRes.ok) {
        const reposData = await reposRes.json();
        setRepositories(reposData.data || []);
      }

      if (appsRes.ok) {
        const appsData = await appsRes.json();
        setApplications(appsData.data || []);
      }

      if (syncRes.ok) {
        const syncData = await syncRes.json();
        setSyncStatus(syncData.data);
      }
    } catch (error) {
      console.error('Failed to fetch GitOps data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleForceSync = async () => {
    try {
      setSyncing(true);
      const response = await fetch(API_ENDPOINTS.GITOPS.BASE + '/sync/force', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config: { auto_sync: true } })
      });

      if (response.ok) {
        await fetchData(); // Refresh data after sync
      }
    } catch (error) {
      console.error('Failed to force sync:', error);
    } finally {
      setSyncing(false);
    }
  };

  const handleInitRepository = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.GITOPS.REPOSITORIES + '/init', {
        method: 'POST'
      });

      if (response.ok) {
        await fetchData();
      }
    } catch (error) {
      console.error('Failed to initialize repository:', error);
    }
  };

  const fetchRollbackTargets = async (appId: string) => {
    try {
      const response = await fetch(API_ENDPOINTS.GITOPS.APPLICATION_ROLLBACK_TARGETS(appId));
      if (response.ok) {
        const data = await response.json();
        setRollbackTargets(prev => ({ ...prev, [appId]: data.data || [] }));
      }
    } catch (error) {
      console.error('Failed to fetch rollback targets:', error);
    }
  };

  const handleShowRollback = async (app: GitOpsApplication) => {
    setSelectedApp(app);
    await fetchRollbackTargets(app.id);
    setShowRollbackModal(true);
  };

  const handleRollback = async (targetDeploymentId: string) => {
    if (!selectedApp) return;

    try {
      const response = await fetch(API_ENDPOINTS.GITOPS.APPLICATION_ROLLBACK(selectedApp.id), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target_deployment_id: targetDeploymentId,
          rolled_back_by: 'user'
        })
      });

      if (response.ok) {
        setShowRollbackModal(false);
        setSelectedApp(null);
        await fetchData(); // Refresh data after rollback
      }
    } catch (error) {
      console.error('Failed to rollback application:', error);
    }
  };

  const getStatusBadge = (status: string, type: 'repository' | 'application' | 'deployment' = 'repository') => {
    const colorMap = {
      repository: {
        [GitOpsRepositoryStatus.ACTIVE]: 'bg-green-900/20 text-green-400 border-green-400',
        [GitOpsRepositoryStatus.PENDING]: 'bg-yellow-900/20 text-yellow-400 border-yellow-400',
        [GitOpsRepositoryStatus.ERROR]: 'bg-red-900/20 text-red-400 border-red-400',
        [GitOpsRepositoryStatus.SYNCING]: 'bg-blue-900/20 text-blue-400 border-blue-400',
      },
      application: {
        [GitOpsApplicationHealth.HEALTHY]: 'bg-green-900/20 text-green-400 border-green-400',
        [GitOpsApplicationHealth.DEGRADED]: 'bg-yellow-900/20 text-yellow-400 border-yellow-400',
        [GitOpsApplicationHealth.SUSPENDED]: 'bg-gray-900/20 text-gray-400 border-gray-400',
        [GitOpsApplicationHealth.MISSING]: 'bg-red-900/20 text-red-400 border-red-400',
        [GitOpsApplicationHealth.UNKNOWN]: 'bg-gray-900/20 text-gray-400 border-gray-400',
      },
      deployment: {
        [GitOpsDeploymentStatus.DEPLOYED]: 'bg-green-900/20 text-green-400 border-green-400',
        [GitOpsDeploymentStatus.FAILED]: 'bg-red-900/20 text-red-400 border-red-400',
        [GitOpsDeploymentStatus.PENDING]: 'bg-yellow-900/20 text-yellow-400 border-yellow-400',
        [GitOpsDeploymentStatus.ROLLED_BACK]: 'bg-purple-900/20 text-purple-400 border-purple-400',
      }
    };

    const className = (colorMap[type] as Record<string, string>)?.[status] || 'bg-gray-900/20 text-gray-400 border-gray-400';
    return (
      <span className={`inline-block px-2 py-1 border rounded ${className} font-mono text-xs`}>
        {status.toUpperCase()}
      </span>
    );
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-green-400 font-mono">{UI_MESSAGES.LOADING}...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Sync Status */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-mono text-white">GitOps Management</h2>
          <p className="text-sm text-gray-400 font-mono">
            Infrastructure as Code synchronization and deployment automation
          </p>
        </div>
        <div className="flex items-center space-x-4">
          {syncStatus && (
            <div className="text-xs font-mono text-gray-400">
              Last sync: {new Date(syncStatus.last_sync).toLocaleString()}
            </div>
          )}
          <button
            onClick={handleForceSync}
            disabled={syncing}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-mono border border-green-400 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Syncing...' : 'Force Sync'}
          </button>
        </div>
      </div>

      {/* Sync Status Card */}
      {syncStatus && (
        <div className="border border-white/20 p-4">
          <div className="pb-3">
            <h3 className="text-white font-mono flex items-center">
              <Zap className="w-4 h-4 mr-2" />
              Sync Status
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-mono text-green-400">{syncStatus.application_count}</div>
              <div className="text-xs text-gray-400 font-mono">Applications</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-mono text-blue-400">{syncStatus.recent_commits.length}</div>
              <div className="text-xs text-gray-400 font-mono">Recent Commits</div>
            </div>
            <div className="text-center">
              <div className={`text-2xl font-mono ${syncStatus.pending_changes ? 'text-yellow-400' : 'text-green-400'}`}>
                {syncStatus.pending_changes ? 'YES' : 'NO'}
              </div>
              <div className="text-xs text-gray-400 font-mono">Pending Changes</div>
            </div>
            <div className="text-center">
              <div className={`text-sm font-mono ${syncStatus.git_status ? 'text-yellow-400' : 'text-green-400'}`}>
                {syncStatus.git_status || 'CLEAN'}
              </div>
              <div className="text-xs text-gray-400 font-mono">Git Status</div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs for different GitOps sections */}
      <div className="w-full">
        <div className="flex border-b border-white/20">
          <button
            onClick={() => setActiveTab('applications')}
            className={`px-4 py-2 font-mono border-b-2 transition-colors ${
              activeTab === 'applications' 
                ? 'border-green-400 text-green-400' 
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            Applications
          </button>
          <button
            onClick={() => setActiveTab('repositories')}
            className={`px-4 py-2 font-mono border-b-2 transition-colors ${
              activeTab === 'repositories' 
                ? 'border-green-400 text-green-400' 
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            Repositories
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 font-mono border-b-2 transition-colors ${
              activeTab === 'history' 
                ? 'border-green-400 text-green-400' 
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            Deployment History
          </button>
        </div>

        {/* Applications Tab */}
        {activeTab === 'applications' && (
        <div className="space-y-4 mt-4">
          {applications.length === 0 ? (
            <div className="border border-white/20 p-8 text-center">
              <div className="text-gray-400 font-mono">No GitOps applications found</div>
              <button className="mt-4 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-mono border border-green-400 transition-colors">
                Create Application
              </button>
            </div>
          ) : (
            <div className="grid gap-4">
              {applications.map((app) => (
                <div key={app.id} className="border border-white/20 p-4">
                  <div className="pb-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-white font-mono">{app.name}</h3>
                      <div className="flex items-center space-x-2">
                        {getStatusBadge(app.health, 'application')}
                        {getStatusBadge(app.sync_status, 'application')}
                      </div>
                    </div>
                    <p className="font-mono text-gray-400">
                      Namespace: {app.namespace} • Replicas: {app.replicas}
                    </p>
                  </div>
                  <div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm font-mono mb-4">
                      <div>
                        <div className="text-gray-400">Image:</div>
                        <div className="text-white truncate">{app.image}</div>
                      </div>
                      <div>
                        <div className="text-gray-400">Last Deployed:</div>
                        <div className="text-white">
                          {app.last_deployed 
                            ? new Date(app.last_deployed).toLocaleString()
                            : 'Never'
                          }
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleShowRollback(app)}
                        className="px-3 py-1 bg-yellow-600 hover:bg-yellow-700 disabled:opacity-50 text-white font-mono text-sm border border-yellow-400 transition-colors flex items-center"
                        disabled={!app.last_deployed}
                        title="Rollback to previous deployment"
                      >
                        <RotateCcw className="w-3 h-3 mr-1" />
                        Rollback
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        )}

        {/* Repositories Tab */}
        {activeTab === 'repositories' && (
        <div className="space-y-4 mt-4">
          {repositories.length === 0 ? (
            <div className="border border-white/20 p-8 text-center">
              <div className="text-gray-400 font-mono">No GitOps repositories configured</div>
              <div className="mt-4 space-x-4">
                <button 
                  onClick={handleInitRepository}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-mono border border-green-400 transition-colors"
                >
                  Initialize Repository
                </button>
                <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-mono border border-blue-400 transition-colors">
                  Add Repository
                </button>
              </div>
            </div>
          ) : (
            <div className="grid gap-4">
              {repositories.map((repo) => (
                <div key={repo.id} className="border border-white/20 p-4">
                  <div className="pb-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-white font-mono flex items-center">
                        <GitBranch className="w-4 h-4 mr-2" />
                        {repo.name}
                      </h3>
                      {getStatusBadge(repo.status, 'repository')}
                    </div>
                    <p className="font-mono text-gray-400">
                      {repo.description || 'No description'}
                    </p>
                  </div>
                  <div>
                    <div className="space-y-2 text-sm font-mono">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <div className="text-gray-400">URL:</div>
                          <div className="text-white truncate">{repo.url}</div>
                        </div>
                        <div>
                          <div className="text-gray-400">Branch:</div>
                          <div className="text-white">{repo.branch}</div>
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-400">Last Sync:</div>
                        <div className="text-white">
                          {repo.last_sync 
                            ? new Date(repo.last_sync).toLocaleString()
                            : 'Never'
                          }
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
        <div className="space-y-4 mt-4">
          <div className="border border-white/20 p-4">
            <div>
              <h3 className="text-white font-mono flex items-center">
                <History className="w-4 h-4 mr-2" />
                Deployment History
              </h3>
            </div>
            <div>
              <div className="text-center text-gray-400 font-mono py-8">
                Deployment history will be displayed here
              </div>
            </div>
          </div>
        </div>
        )}
      </div>

      {/* Rollback Modal */}
      {showRollbackModal && selectedApp && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-black border border-white/20 p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-mono text-white">Rollback {selectedApp.name}</h3>
              <button
                onClick={() => setShowRollbackModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-gray-400 font-mono mb-4">
              Select a previous deployment to rollback to:
            </p>
            <div className="space-y-3">
              {rollbackTargets[selectedApp.id]?.length === 0 ? (
                <div className="text-center text-gray-400 font-mono py-8">
                  No previous deployments available for rollback
                </div>
              ) : (
                rollbackTargets[selectedApp.id]?.map((deployment, index) => (
                  <div key={deployment.id} className="border border-white/10 p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="text-white font-mono text-sm">
                            #{index + 1}
                          </span>
                          {getStatusBadge(deployment.status, 'deployment')}
                          <span className="text-xs text-gray-400 font-mono">
                            {new Date(deployment.deployed_at).toLocaleString()}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs font-mono">
                          <div>
                            <span className="text-gray-400">Image:</span>
                            <span className="ml-2 text-white">{deployment.image}</span>
                          </div>
                          <div>
                            <span className="text-gray-400">Replicas:</span>
                            <span className="ml-2 text-white">{deployment.replicas}</span>
                          </div>
                          <div>
                            <span className="text-gray-400">Deployed by:</span>
                            <span className="ml-2 text-white">{deployment.deployed_by}</span>
                          </div>
                          <div>
                            <span className="text-gray-400">Git Hash:</span>
                            <span className="ml-2 text-white font-mono">
                              {deployment.git_hash?.substring(0, 8) || 'N/A'}
                            </span>
                          </div>
                        </div>
                        {deployment.message && (
                          <div className="mt-2 text-xs text-gray-400">
                            {deployment.message}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => handleRollback(deployment.id)}
                        className="ml-4 px-3 py-1 bg-yellow-600 hover:bg-yellow-700 text-white font-mono text-sm border border-yellow-400 transition-colors"
                      >
                        Rollback
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowRollbackModal(false)}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white font-mono border border-gray-400 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GitOpsTab;
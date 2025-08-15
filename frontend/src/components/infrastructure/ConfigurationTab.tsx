import { useState, useEffect } from 'react';
import { RefreshCw, GitBranch, CheckCircle, AlertTriangle, Activity, Eye, GitCommit, Webhook, Monitor, Bell, Settings } from 'lucide-react';
import { API_ENDPOINTS } from '@constants';

interface BaseInfrastructureRepo {
  id: string;
  name: string;
  url: string;
  branch: string;
  status: 'active' | 'syncing' | 'error';
  last_sync?: string;
  sync_status: 'synced' | 'out_of_sync' | 'error';
  health: 'healthy' | 'degraded' | 'unknown';
}

interface SyncMetrics {
  last_sync_time?: string;
  total_applications: number;
  synced_applications: number;
  out_of_sync_applications: number;
  recent_deployments: number;
}

const ConfigurationTab = () => {
  const [repository, setRepository] = useState<BaseInfrastructureRepo | null>(null);
  const [metrics, setMetrics] = useState<SyncMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const fetchBaseRepository = async () => {
    try {
      setLoading(true);
      
      // Get repositories and find the first one (base repository)
      const reposResponse = await fetch(API_ENDPOINTS.GITOPS.REPOSITORIES);
      const reposData = await reposResponse.json();
      
      if (reposData.repositories && reposData.repositories.length > 0) {
        setRepository(reposData.repositories[0]); // Use first repository as base
      }
      
      // Get health metrics
      const metricsResponse = await fetch(API_ENDPOINTS.GITOPS.HEALTH_METRICS);
      const metricsData = await metricsResponse.json();
      setMetrics(metricsData.data || metricsData);
      
    } catch (error) {
      console.error('Failed to fetch base repository:', error);
      // Mock data for development
      setRepository({
        id: 'base-infra-1',
        name: 'base-infrastructure',
        url: 'https://git.example.com/infrastructure/base-k8s-configs.git',
        branch: 'main',
        status: 'active',
        last_sync: new Date().toISOString(),
        sync_status: 'synced',
        health: 'healthy'
      });
      setMetrics({
        total_applications: 5,
        synced_applications: 4,
        out_of_sync_applications: 1,
        recent_deployments: 3
      });
    } finally {
      setLoading(false);
    }
  };

  const syncRepository = async () => {
    if (!repository) return;
    
    try {
      setSyncing(true);
      const response = await fetch(API_ENDPOINTS.GITOPS.REPOSITORY_SYNC(repository.id), {
        method: 'POST'
      });
      
      if (response.ok) {
        await fetchBaseRepository(); // Refresh data
      }
    } catch (error) {
      console.error('Failed to sync repository:', error);
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    fetchBaseRepository();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
      case 'healthy':
      case 'synced':
        return 'text-green-400';
      case 'syncing':
      case 'degraded':
      case 'out_of_sync':
        return 'text-yellow-400';
      case 'error':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
      case 'healthy':
      case 'synced':
        return CheckCircle;
      case 'syncing':
        return Activity;
      case 'error':
        return AlertTriangle;
      default:
        return Eye;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 bg-black border border-white">
        <div className="text-white font-mono tracking-wider">LOADING BASE INFRASTRUCTURE REPOSITORY...</div>
      </div>
    );
  }

  if (!repository) {
    return (
      <div className="flex items-center justify-center h-64 bg-black border border-red-400">
        <div className="text-red-400 font-mono tracking-wider uppercase">FAILED TO LOAD BASE INFRASTRUCTURE REPOSITORY</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Repository Status Header */}
      <div className="bg-black border border-white p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <GitBranch size={24} className="text-green-400" />
            <div>
              <h2 className="text-xl font-bold text-white font-mono tracking-wider uppercase">{repository.name}</h2>
              <p className="text-sm text-gray-300 font-mono">{repository.url}</p>
            </div>
          </div>
          <button
            onClick={syncRepository}
            disabled={syncing}
            className="flex items-center space-x-2 px-4 py-2 border border-blue-400 text-blue-400 hover:bg-blue-400 hover:text-black disabled:border-gray-600 disabled:text-gray-600 transition-colors font-mono text-sm tracking-wider uppercase"
          >
            <RefreshCw size={16} className={syncing ? 'animate-spin' : ''} />
            <span>{syncing ? 'SYNCING...' : 'SYNC NOW'}</span>
          </button>
        </div>
      </div>

      {/* Repository Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Status Card */}
        <div className="bg-black border border-white p-4">
          <h3 className="text-sm font-bold text-white mb-3 font-mono tracking-wider uppercase">REPOSITORY STATUS</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-300 font-mono tracking-wider">STATUS</span>
              <div className="flex items-center space-x-2">
                {(() => {
                  const StatusIcon = getStatusIcon(repository.status);
                  return <StatusIcon size={16} className={getStatusColor(repository.status)} />;
                })()}
                <span className={`text-sm font-mono tracking-wider uppercase ${getStatusColor(repository.status)}`}>
                  {repository.status}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-300 font-mono tracking-wider">BRANCH</span>
              <span className="text-sm text-white font-mono tracking-wider uppercase">{repository.branch}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-300 font-mono tracking-wider">SYNC STATUS</span>
              <span className={`text-sm font-mono tracking-wider uppercase ${getStatusColor(repository.sync_status)}`}>
                {repository.sync_status}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-300 font-mono tracking-wider">HEALTH</span>
              <span className={`text-sm font-mono tracking-wider uppercase ${getStatusColor(repository.health)}`}>
                {repository.health}
              </span>
            </div>
          </div>
        </div>

        {/* Sync Information */}
        <div className="bg-black border border-white p-4">
          <h3 className="text-sm font-bold text-white mb-3 font-mono tracking-wider uppercase">SYNC INFORMATION</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-300 font-mono tracking-wider">LAST SYNC</span>
              <span className="text-sm text-white font-mono tracking-wider">
                {repository.last_sync 
                  ? new Date(repository.last_sync).toLocaleString().toUpperCase()
                  : 'NEVER'
                }
              </span>
            </div>
            {metrics && (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-300 font-mono tracking-wider">TOTAL APPS</span>
                  <span className="text-sm text-white font-mono tracking-wider">{metrics.total_applications}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-300 font-mono tracking-wider">SYNCED</span>
                  <span className="text-sm text-green-400 font-mono tracking-wider">{metrics.synced_applications}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-300 font-mono tracking-wider">OUT OF SYNC</span>
                  <span className="text-sm text-yellow-400 font-mono tracking-wider">{metrics.out_of_sync_applications}</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-black border border-white p-4">
          <h3 className="text-sm font-bold text-white mb-3 font-mono tracking-wider uppercase">RECENT ACTIVITY</h3>
          <div className="space-y-3">
            {metrics && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-300 font-mono tracking-wider">RECENT DEPLOYMENTS</span>
                <span className="text-sm text-white font-mono tracking-wider">{metrics.recent_deployments}</span>
              </div>
            )}
            <div className="flex items-center space-x-2 text-sm text-gray-300">
              <GitCommit size={14} />
              <span className="font-mono tracking-wider">ALL KUBERNETES CONFIGURATIONS MANAGED IN BASE REPOSITORY</span>
            </div>
          </div>
        </div>
      </div>

      {/* Monitoring & Webhooks Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monitoring Panel */}
        <div className="bg-black border border-white p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Monitor size={20} className="text-blue-400" />
            <h3 className="text-lg font-bold text-white font-mono tracking-wider uppercase">GITOPS MONITORING</h3>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-300 font-mono tracking-wider">HEALTH CHECKS</span>
              <span className="text-sm text-green-400 font-mono tracking-wider">ENABLED</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-300 font-mono tracking-wider">DRIFT DETECTION</span>
              <span className="text-sm text-green-400 font-mono tracking-wider">ACTIVE</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-300 font-mono tracking-wider">AUTO SYNC</span>
              <span className="text-sm text-blue-400 font-mono tracking-wider">5MIN INTERVAL</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-300 font-mono tracking-wider">ALERTS</span>
              <div className="flex items-center space-x-2">
                <Bell size={14} className="text-yellow-400" />
                <span className="text-sm text-white font-mono tracking-wider">3 ACTIVE</span>
              </div>
            </div>
            <button className="w-full mt-4 px-4 py-2 border border-blue-400 text-blue-400 hover:bg-blue-400 hover:text-black transition-colors font-mono text-sm tracking-wider uppercase">
              VIEW MONITORING DASHBOARD
            </button>
          </div>
        </div>

        {/* Webhook Panel */}
        <div className="bg-black border border-white p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Webhook size={20} className="text-green-400" />
            <h3 className="text-lg font-bold text-white font-mono tracking-wider uppercase">WEBHOOK INTEGRATION</h3>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-300 font-mono tracking-wider">GIT PUSH EVENTS</span>
              <span className="text-sm text-green-400 font-mono tracking-wider">CONFIGURED</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-300 font-mono tracking-wider">AUTO DEPLOY</span>
              <span className="text-sm text-green-400 font-mono tracking-wider">ENABLED</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-300 font-mono tracking-wider">NOTIFICATIONS</span>
              <span className="text-sm text-blue-400 font-mono tracking-wider">SLACK, EMAIL</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-300 font-mono tracking-wider">LAST TRIGGER</span>
              <span className="text-sm text-white font-mono tracking-wider">2MIN AGO</span>
            </div>
            <div className="flex space-x-2 mt-4">
              <button className="flex-1 px-4 py-2 border border-green-400 text-green-400 hover:bg-green-400 hover:text-black transition-colors font-mono text-sm tracking-wider uppercase">
                TEST WEBHOOK
              </button>
              <button className="px-4 py-2 border border-white text-white hover:bg-white hover:text-black transition-colors">
                <Settings size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfigurationTab;
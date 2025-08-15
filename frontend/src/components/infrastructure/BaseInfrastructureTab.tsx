import { useState, useEffect } from 'react';
import { RefreshCw, GitBranch, CheckCircle, AlertTriangle, Activity, Eye, GitCommit, Webhook, Monitor, Bell, Settings } from 'lucide-react';
import { API_ENDPOINTS } from '@/constants';

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

const BaseInfrastructureTab = () => {
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
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400 font-mono">Loading base infrastructure repository...</div>
      </div>
    );
  }

  if (!repository) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-400 font-mono">Failed to load base infrastructure repository</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Repository Status Header */}
      <div className="bg-gray-900 border border-gray-700 rounded p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <GitBranch size={24} className="text-blue-400" />
            <div>
              <h2 className="text-xl font-bold text-white">{repository.name}</h2>
              <p className="text-sm text-gray-400 font-mono">{repository.url}</p>
            </div>
          </div>
          <button
            onClick={syncRepository}
            disabled={syncing}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded transition-colors font-mono text-sm"
          >
            <RefreshCw size={16} className={syncing ? 'animate-spin' : ''} />
            <span>{syncing ? 'Syncing...' : 'Sync Now'}</span>
          </button>
        </div>
      </div>

      {/* Repository Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Status Card */}
        <div className="bg-gray-900 border border-gray-700 rounded p-4">
          <h3 className="text-sm font-bold text-gray-300 mb-3">Repository Status</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Status</span>
              <div className="flex items-center space-x-2">
                {(() => {
                  const StatusIcon = getStatusIcon(repository.status);
                  return <StatusIcon size={16} className={getStatusColor(repository.status)} />;
                })()}
                <span className={`text-sm font-mono ${getStatusColor(repository.status)}`}>
                  {repository.status}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Branch</span>
              <span className="text-sm text-white font-mono">{repository.branch}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Sync Status</span>
              <span className={`text-sm font-mono ${getStatusColor(repository.sync_status)}`}>
                {repository.sync_status}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Health</span>
              <span className={`text-sm font-mono ${getStatusColor(repository.health)}`}>
                {repository.health}
              </span>
            </div>
          </div>
        </div>

        {/* Sync Information */}
        <div className="bg-gray-900 border border-gray-700 rounded p-4">
          <h3 className="text-sm font-bold text-gray-300 mb-3">Sync Information</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Last Sync</span>
              <span className="text-sm text-white font-mono">
                {repository.last_sync 
                  ? new Date(repository.last_sync).toLocaleString()
                  : 'Never'
                }
              </span>
            </div>
            {metrics && (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Total Apps</span>
                  <span className="text-sm text-white font-mono">{metrics.total_applications}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Synced</span>
                  <span className="text-sm text-green-400 font-mono">{metrics.synced_applications}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Out of Sync</span>
                  <span className="text-sm text-yellow-400 font-mono">{metrics.out_of_sync_applications}</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-gray-900 border border-gray-700 rounded p-4">
          <h3 className="text-sm font-bold text-gray-300 mb-3">Recent Activity</h3>
          <div className="space-y-3">
            {metrics && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Recent Deployments</span>
                <span className="text-sm text-white font-mono">{metrics.recent_deployments}</span>
              </div>
            )}
            <div className="flex items-center space-x-2 text-sm text-gray-400">
              <GitCommit size={14} />
              <span>All Kubernetes configurations managed in base repository</span>
            </div>
          </div>
        </div>
      </div>

      {/* Information Panel */}
      <div className="bg-gray-900 border border-gray-700 rounded p-6">
        <h3 className="text-lg font-bold text-white mb-4">Base Infrastructure Repository</h3>
        <div className="space-y-3 text-sm text-gray-300">
          <p>
            This repository contains all Kubernetes configurations for your infrastructure.
            Applications deployed through the Deployments tab automatically commit their manifests here.
          </p>
          <p>
            <strong className="text-white">GitOps Workflow:</strong> When you deploy applications, 
            their Kubernetes manifests are generated and committed to this repository. 
            Your GitOps operator (ArgoCD, Flux, etc.) automatically syncs these changes to your cluster.
          </p>
          <p>
            <strong className="text-white">Manual Sync:</strong> Use the "Sync Now" button to manually 
            pull the latest changes from the remote repository if needed.
          </p>
        </div>
      </div>

      {/* Monitoring & Webhooks Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monitoring Panel */}
        <div className="bg-gray-900 border border-gray-700 rounded p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Monitor size={20} className="text-blue-400" />
            <h3 className="text-lg font-bold text-white">GitOps Monitoring</h3>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Health Checks</span>
              <span className="text-sm text-green-400 font-mono">ENABLED</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Drift Detection</span>
              <span className="text-sm text-green-400 font-mono">ACTIVE</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Auto Sync</span>
              <span className="text-sm text-blue-400 font-mono">5MIN INTERVAL</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Alerts</span>
              <div className="flex items-center space-x-2">
                <Bell size={14} className="text-yellow-400" />
                <span className="text-sm text-white font-mono">3 ACTIVE</span>
              </div>
            </div>
            <button className="w-full mt-4 px-4 py-2 border border-blue-400 text-blue-400 hover:bg-blue-400 hover:text-black transition-colors font-mono text-sm">
              VIEW MONITORING DASHBOARD
            </button>
          </div>
        </div>

        {/* Webhook Panel */}
        <div className="bg-gray-900 border border-gray-700 rounded p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Webhook size={20} className="text-green-400" />
            <h3 className="text-lg font-bold text-white">Webhook Integration</h3>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Git Push Events</span>
              <span className="text-sm text-green-400 font-mono">CONFIGURED</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Auto Deploy</span>
              <span className="text-sm text-green-400 font-mono">ENABLED</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Notifications</span>
              <span className="text-sm text-blue-400 font-mono">SLACK, EMAIL</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Last Trigger</span>
              <span className="text-sm text-white font-mono">2MIN AGO</span>
            </div>
            <div className="flex space-x-2 mt-4">
              <button className="flex-1 px-4 py-2 border border-green-400 text-green-400 hover:bg-green-400 hover:text-black transition-colors font-mono text-sm">
                TEST WEBHOOK
              </button>
              <button className="px-4 py-2 border border-gray-600 text-gray-300 hover:bg-gray-800 transition-colors">
                <Settings size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BaseInfrastructureTab;
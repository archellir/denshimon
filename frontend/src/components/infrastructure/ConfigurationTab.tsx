import { useState, useEffect } from 'react';
import { RefreshCw, GitBranch, CheckCircle, AlertTriangle, Activity, Eye, GitCommit, Webhook, Monitor, Bell, Settings } from 'lucide-react';
import { API_ENDPOINTS } from '@constants';
import { MOCK_ENABLED, mockBaseInfrastructureRepo, mockSyncMetrics, mockMonitoringData, mockWebhookData, simulateSync } from '@/mocks';
import type { BaseInfrastructureRepo, SyncMetrics } from '@/types/infrastructure';
import SkeletonLoader from '@components/common/SkeletonLoader';
import NoRepositoryConnected from './NoRepositoryConnected';
import ConfigCard from './ConfigCard';


const ConfigurationTab = () => {
  const [repository, setRepository] = useState<BaseInfrastructureRepo | null>(null);
  const [metrics, setMetrics] = useState<SyncMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [monitoringData, setMonitoringData] = useState(mockMonitoringData);
  const [webhookData, setWebhookData] = useState(mockWebhookData);

  const fetchBaseRepository = async () => {
    try {
      setLoading(true);
      
      // Use mock data if enabled
      if (MOCK_ENABLED) {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 500));
        // Show mock base infrastructure repository
        setRepository(mockBaseInfrastructureRepo);
        setMetrics(mockSyncMetrics);
        setMonitoringData(mockMonitoringData);
        setWebhookData(mockWebhookData);
      } else {
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
      }
      
    } catch (error) {
      // console.error('Failed to fetch base repository:', error);
      // Fallback to mock data on error
      setRepository(mockBaseInfrastructureRepo);
      setMetrics(mockSyncMetrics);
      setMonitoringData(mockMonitoringData);
      setWebhookData(mockWebhookData);
    } finally {
      setLoading(false);
    }
  };

  const syncRepository = async () => {
    if (!repository) return;
    
    try {
      setSyncing(true);
      
      if (MOCK_ENABLED) {
        // Use mock sync function
        const result = await simulateSync(repository.id);
        if (result.success) {
          // Update mock data to show sync completed
          const updatedRepo = { 
            ...repository, 
            last_sync: new Date().toISOString(),
            sync_status: 'synced' as const
          };
          setRepository(updatedRepo);
          
          // Update metrics with random changes
          setMetrics(prev => prev ? {
            ...prev,
            last_sync_time: new Date().toISOString(),
            recent_deployments: prev.recent_deployments + Math.floor(Math.random() * 3)
          } : null);
        }
        // console.log(result.message);
      } else {
        const response = await fetch(API_ENDPOINTS.GITOPS.REPOSITORY_SYNC(repository.id), {
          method: 'POST'
        });
        
        if (response.ok) {
          await fetchBaseRepository(); // Refresh data
        }
      }
    } catch (error) {
      // console.error('Failed to sync repository:', error);
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
    return <SkeletonLoader variant="infra-config" />;
  }

  if (!repository) {
    return (
      <NoRepositoryConnected 
        onRepositoryConnected={(connectedRepo) => {
          setRepository(connectedRepo);
          // Optionally refresh metrics after connection
          fetchBaseRepository();
        }}
      />
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
        {/* Repository Status Card */}
        <ConfigCard
          title="REPOSITORY STATUS"
          icon={Eye}
          iconColor="text-blue-400"
          items={[
            {
              label: 'STATUS',
              value: (
                <div className="flex items-center space-x-2">
                  {(() => {
                    const StatusIcon = getStatusIcon(repository.status);
                    return <StatusIcon size={16} className={getStatusColor(repository.status)} />;
                  })()}
                  <span className={`uppercase ${getStatusColor(repository.status)}`}>
                    {repository.status}
                  </span>
                </div>
              )
            },
            {
              label: 'BRANCH',
              value: repository.branch.toUpperCase()
            },
            {
              label: 'SYNC STATUS',
              value: repository.sync_status.toUpperCase(),
              valueColor: getStatusColor(repository.sync_status)
            },
            {
              label: 'HEALTH',
              value: repository.health.toUpperCase(),
              valueColor: getStatusColor(repository.health)
            }
          ]}
        />

        {/* Sync Information Card */}
        <ConfigCard
          title="SYNC INFORMATION"
          icon={Activity}
          iconColor="text-green-400"
          items={[
            {
              label: 'LAST SYNC',
              value: repository.last_sync 
                ? new Date(repository.last_sync).toLocaleString().toUpperCase()
                : 'NEVER'
            },
            ...(metrics ? [
              {
                label: 'TOTAL APPS',
                value: metrics.total_applications.toString()
              },
              {
                label: 'SYNCED',
                value: metrics.synced_applications.toString(),
                valueColor: 'text-green-400'
              },
              {
                label: 'OUT OF SYNC',
                value: metrics.out_of_sync_applications.toString(),
                valueColor: 'text-yellow-400'
              }
            ] : [])
          ]}
        />

        {/* Recent Activity Card */}
        <ConfigCard
          title="RECENT ACTIVITY"
          icon={GitCommit}
          iconColor="text-yellow-400"
          items={[
            ...(metrics ? [{
              label: 'RECENT DEPLOYMENTS',
              value: metrics.recent_deployments.toString()
            }] : []),
            {
              label: '',
              value: (
                <div className="flex items-center space-x-2 text-gray-300">
                  <GitCommit size={14} />
                  <span className="text-xs">ALL KUBERNETES CONFIGURATIONS MANAGED IN BASE REPOSITORY</span>
                </div>
              )
            }
          ]}
        />
      </div>

      {/* Monitoring & Webhooks Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* GitOps Monitoring Card */}
        <ConfigCard
          title="GITOPS MONITORING"
          icon={Monitor}
          iconColor="text-blue-400"
          items={[
            {
              label: 'HEALTH CHECKS',
              value: monitoringData.healthChecks,
              valueColor: 'text-green-400'
            },
            {
              label: 'DRIFT DETECTION',
              value: monitoringData.driftDetection,
              valueColor: 'text-green-400'
            },
            {
              label: 'AUTO SYNC',
              value: `${monitoringData.autoSyncInterval} INTERVAL`,
              valueColor: 'text-blue-400'
            },
            {
              label: 'ALERTS',
              value: (
                <div className="flex items-center space-x-2">
                  <Bell size={14} className="text-yellow-400" />
                  <span>{monitoringData.activeAlerts} ACTIVE</span>
                </div>
              )
            }
          ]}
          buttons={[
            {
              label: 'VIEW MONITORING DASHBOARD',
              onClick: () => {},
              color: 'blue'
            }
          ]}
        />

        {/* Webhook Integration Card */}
        <ConfigCard
          title="WEBHOOK INTEGRATION"
          icon={Webhook}
          iconColor="text-green-400"
          items={[
            {
              label: 'GIT PUSH EVENTS',
              value: webhookData.gitPushEvents,
              valueColor: 'text-green-400'
            },
            {
              label: 'AUTO DEPLOY',
              value: webhookData.autoDeploy,
              valueColor: 'text-green-400'
            },
            {
              label: 'NOTIFICATIONS',
              value: webhookData.notifications.join(', '),
              valueColor: 'text-blue-400'
            },
            {
              label: 'LAST TRIGGER',
              value: webhookData.lastTrigger 
                ? `${Math.floor((Date.now() - new Date(webhookData.lastTrigger).getTime()) / 60000)}MIN AGO`
                : 'NEVER'
            }
          ]}
          buttons={[
            {
              label: 'TEST WEBHOOK',
              onClick: () => {},
              color: 'green'
            },
            {
              label: 'SETTINGS',
              onClick: () => {},
              color: 'white',
              icon: Settings,
              variant: 'icon'
            }
          ]}
        />
      </div>
    </div>
  );
};

export default ConfigurationTab;
import { useState, useEffect } from 'react';
import { RefreshCw, GitBranch, CheckCircle, AlertTriangle, Activity, Eye, GitCommit, Webhook, Monitor, Bell, Settings, Play, PlayCircle, Clock, Package } from 'lucide-react';
import { API_ENDPOINTS } from '@constants';
import { MOCK_ENABLED, mockBaseInfrastructureRepo, mockSyncMetrics } from '@/mocks';
import type { BaseInfrastructureRepo, SyncMetrics } from '@/types/infrastructure';
import type { Deployment } from '@/types/deployments';
import SkeletonLoader from '@components/common/SkeletonLoader';
import NoRepositoryConnected from './NoRepositoryConnected';
import ConfigCard from './ConfigCard';


const ConfigurationTab = () => {
  const [repository, setRepository] = useState<BaseInfrastructureRepo | null>(null);
  const [metrics, setMetrics] = useState<SyncMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [pendingDeployments, setPendingDeployments] = useState<Deployment[]>([]);
  const [applying, setApplying] = useState<string[]>([]);
  const [selectedDeployments, setSelectedDeployments] = useState<string[]>([]);

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
      } else {
        // Get repositories and find the first one (base repository)
        const reposResponse = await fetch(API_ENDPOINTS.GITOPS.REPOSITORIES);
        const reposData = await reposResponse.json();
        
        if (reposData.repositories && reposData.repositories.length > 0) {
          setRepository(reposData.repositories[0]); // Use first repository as base
        }
        
        // Get sync status
        const syncResponse = await fetch(API_ENDPOINTS.GITOPS.SYNC_STATUS);
        if (syncResponse.ok) {
          const syncData = await syncResponse.json();
          setMetrics(syncData);
        }
      }
      
      // Always fetch pending deployments
      await fetchPendingDeployments();
      
    } catch (error) {
      // console.error('Failed to fetch base repository:', error);
      // Fallback to mock data on error
      setRepository(mockBaseInfrastructureRepo);
      setMetrics(mockSyncMetrics);
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingDeployments = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.DEPLOYMENTS.PENDING);
      if (response.ok) {
        const data = await response.json();
        setPendingDeployments(data);
      }
    } catch (error) {
      console.error('Failed to fetch pending deployments:', error);
    }
  };

  const syncRepository = async () => {
    if (!repository) return;
    
    try {
      setSyncing(true);
      
      if (MOCK_ENABLED) {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 1000));
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
      } else {
        // Force sync - pulls latest changes from git
        const response = await fetch(API_ENDPOINTS.GITOPS.SYNC_FORCE, {
          method: 'POST'
        });
        
        if (response.ok) {
          await fetchBaseRepository(); // Refresh data
        }
      }
    } catch (error) {
      console.error('Failed to sync repository:', error);
    } finally {
      setSyncing(false);
    }
  };

  const applyDeployment = async (deploymentId: string) => {
    try {
      setApplying(prev => [...prev, deploymentId]);
      
      const response = await fetch(`${API_ENDPOINTS.DEPLOYMENTS.BASE}/${deploymentId}/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applied_by: 'user' // Could be enhanced to get actual user info
        })
      });

      if (response.ok) {
        // Remove from pending deployments and refresh list
        await fetchPendingDeployments();
        setSelectedDeployments(prev => prev.filter(id => id !== deploymentId));
      } else {
        throw new Error('Failed to apply deployment');
      }
    } catch (error) {
      console.error('Failed to apply deployment:', error);
      alert('Failed to apply deployment to cluster');
    } finally {
      setApplying(prev => prev.filter(id => id !== deploymentId));
    }
  };

  const batchApplyDeployments = async () => {
    if (selectedDeployments.length === 0) return;
    
    try {
      setApplying(prev => [...prev, ...selectedDeployments]);
      
      const response = await fetch(API_ENDPOINTS.DEPLOYMENTS.BATCH_APPLY, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deployment_ids: selectedDeployments,
          applied_by: 'user'
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log(`Applied ${result.successes} deployments, ${result.failures} failed`);
        
        // Refresh pending deployments
        await fetchPendingDeployments();
        setSelectedDeployments([]);
      } else {
        throw new Error('Failed to batch apply deployments');
      }
    } catch (error) {
      console.error('Failed to batch apply deployments:', error);
      alert('Failed to apply selected deployments');
    } finally {
      setApplying([]);
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

        {/* Manual Controls Card */}
        <ConfigCard
          title="MANUAL CONTROLS"
          icon={Settings}
          iconColor="text-yellow-400"
          items={[
            {
              label: 'PENDING APPLIES',
              value: pendingDeployments.length.toString(),
              valueColor: pendingDeployments.length > 0 ? 'text-yellow-400' : 'text-green-400'
            },
            {
              label: 'WORKFLOW MODE',
              value: 'MANUAL ONLY',
              valueColor: 'text-blue-400'
            },
            {
              label: '',
              value: (
                <div className="flex items-center space-x-2 text-gray-300">
                  <GitCommit size={14} />
                  <span className="text-xs">ALL DEPLOYMENTS REQUIRE MANUAL APPROVAL</span>
                </div>
              )
            }
          ]}
          buttons={[
            {
              label: 'REFRESH PENDING',
              onClick: fetchPendingDeployments,
              color: 'blue'
            }
          ]}
        />
      </div>

      {/* Manual Deploy Controls Section */}
      <div className="space-y-6">
        {/* Pending Deployments Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Clock size={24} className="text-yellow-400" />
            <h3 className="text-lg font-bold text-white font-mono tracking-wider">PENDING DEPLOYMENTS</h3>
            {pendingDeployments.length > 0 && (
              <div className="bg-yellow-400/20 border border-yellow-400/50 px-2 py-1">
                <span className="text-yellow-400 font-mono text-sm">{pendingDeployments.length}</span>
              </div>
            )}
          </div>
          {selectedDeployments.length > 0 && (
            <button
              onClick={batchApplyDeployments}
              disabled={applying.length > 0}
              className="flex items-center space-x-2 px-4 py-2 border border-green-400 text-green-400 hover:bg-green-400 hover:text-black disabled:border-gray-600 disabled:text-gray-600 transition-colors font-mono text-sm tracking-wider"
            >
              <PlayCircle size={16} className={applying.length > 0 ? 'animate-spin' : ''} />
              <span>{applying.length > 0 ? 'APPLYING...' : `APPLY SELECTED (${selectedDeployments.length})`}</span>
            </button>
          )}
        </div>

        {/* Pending Deployments List */}
        {pendingDeployments.length === 0 ? (
          <div className="bg-black border border-white p-8 text-center">
            <CheckCircle size={48} className="text-green-400 mx-auto mb-4" />
            <h4 className="text-lg font-bold text-white font-mono mb-2">NO PENDING DEPLOYMENTS</h4>
            <p className="text-gray-400 font-mono text-sm">
              All deployments are up to date. New deployments will appear here after being committed to git.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {pendingDeployments.map((deployment) => (
              <div key={deployment.id} className="bg-black border border-white p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <input
                      type="checkbox"
                      checked={selectedDeployments.includes(deployment.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedDeployments(prev => [...prev, deployment.id]);
                        } else {
                          setSelectedDeployments(prev => prev.filter(id => id !== deployment.id));
                        }
                      }}
                      className="w-4 h-4 bg-black border border-white text-green-400 focus:ring-green-400"
                    />
                    <Package size={20} className="text-blue-400" />
                    <div>
                      <h4 className="text-white font-mono font-bold">{deployment.name.toUpperCase()}</h4>
                      <div className="flex items-center space-x-4 text-sm text-gray-400 font-mono">
                        <span>NAMESPACE: {deployment.namespace.toUpperCase()}</span>
                        <span>REPLICAS: {deployment.replicas}</span>
                        <span>STATUS: <span className="text-yellow-400">{deployment.status.toUpperCase()}</span></span>
                      </div>
                      <div className="text-xs text-gray-500 font-mono mt-1">
                        IMAGE: {deployment.image}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => applyDeployment(deployment.id)}
                    disabled={applying.includes(deployment.id)}
                    className="flex items-center space-x-2 px-3 py-2 border border-green-400 text-green-400 hover:bg-green-400 hover:text-black disabled:border-gray-600 disabled:text-gray-600 transition-colors font-mono text-xs tracking-wider"
                  >
                    <Play size={14} className={applying.includes(deployment.id) ? 'animate-spin' : ''} />
                    <span>{applying.includes(deployment.id) ? 'APPLYING...' : 'APPLY NOW'}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Manual Controls Info */}
        <div className="bg-blue-400/10 border border-blue-400/30 p-4">
          <div className="flex items-center space-x-2 mb-2">
            <Monitor size={16} className="text-blue-400" />
            <span className="text-blue-400 font-mono text-sm font-bold">MANUAL GITOPS WORKFLOW</span>
          </div>
          <p className="text-blue-300 font-mono text-xs leading-relaxed">
            This system uses manual-only deployments. Changes are committed to git automatically but require manual approval to apply to Kubernetes. 
            Use the controls above to apply pending deployments when ready.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ConfigurationTab;
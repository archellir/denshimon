import { useEffect, useState, FC } from 'react';
import { 
  Play, 
  GitBranch, 
  Rocket, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Loader,
  ArrowRight,
  Container,
  Activity,
  Zap,
  Wifi
} from 'lucide-react';
import useGitOpsStore from '@stores/gitopsStore';
import useGitOpsWebhooks from '@hooks/useGitOpsWebhooks';
import { PipelineStatus, DeploymentStatus, MirrorSyncStatus } from '@/types/gitops';
import type { Application, ContainerImage, PipelineUpdatePayload } from '@/types/gitops';

interface GitOpsPipelineDashboardProps {
  selectedRepository?: string | null;
}

const GitOpsPipelineDashboard: FC<GitOpsPipelineDashboardProps> = ({ selectedRepository }) => {
  const [deployingImage, setDeployingImage] = useState<ContainerImage | null>(null);
  const [realtimeUpdates, setRealtimeUpdates] = useState<PipelineUpdatePayload[]>([]);
  const [isWebhooksConnected, setIsWebhooksConnected] = useState(false);

  const {
    repositories,
    applications,
    giteaActions,
    deploymentHistory,
    isLoading,
    isDeploying,
    error,
    fetchRepositories,
    fetchApplications,
    fetchGiteaActions,
    fetchContainerImages,
    fetchDeploymentHistory,
    deployApplication,
    getImagesByRepository,
    getLatestImage,
    getDeploymentsByApplication
  } = useGitOpsStore();

  // Setup webhook integration for real-time updates
  const { isSubscribed } = useGitOpsWebhooks({
    onPipelineUpdate: (payload: PipelineUpdatePayload) => {
      // Add to real-time updates feed
      setRealtimeUpdates(prev => [payload, ...prev.slice(0, 9)]); // Keep last 10 updates
      setIsWebhooksConnected(true);
    },
    onGiteaWebhook: (payload) => {
      console.log('Gitea webhook:', payload);
      setIsWebhooksConnected(true);
    },
    onGitHubWebhook: (payload) => {
      console.log('GitHub webhook:', payload);
      setIsWebhooksConnected(true);
    }
  });

  // Fetch all pipeline data on mount
  useEffect(() => {
    const fetchData = async () => {
      await Promise.all([
        fetchRepositories(),
        fetchApplications(),
        fetchGiteaActions(),
        fetchContainerImages(),
        fetchDeploymentHistory()
      ]);
    };
    fetchData();
  }, []);

  // Update webhook connection status
  useEffect(() => {
    setIsWebhooksConnected(isSubscribed);
  }, [isSubscribed]);

  // Filter data based on selected repository
  const filteredApplications = selectedRepository 
    ? applications.filter(app => app.repository_id === selectedRepository)
    : applications;

  const filteredActions = selectedRepository
    ? giteaActions.filter(action => action.repository_id === selectedRepository)
    : giteaActions;


  // Get status color and icon
  const getStatusDisplay = (status: PipelineStatus | DeploymentStatus | MirrorSyncStatus) => {
    switch (status) {
      case PipelineStatus.SUCCESS:
      case DeploymentStatus.SUCCESS:
      case MirrorSyncStatus.SYNCED:
        return { color: 'text-green-500', icon: CheckCircle };
      case PipelineStatus.RUNNING:
      case DeploymentStatus.IN_PROGRESS:
      case MirrorSyncStatus.SYNCING:
        return { color: 'text-blue-500', icon: Loader };
      case PipelineStatus.FAILURE:
      case DeploymentStatus.FAILURE:
      case MirrorSyncStatus.ERROR:
        return { color: 'text-red-500', icon: XCircle };
      case PipelineStatus.CANCELLED:
      case DeploymentStatus.CANCELLED:
        return { color: 'text-gray-500', icon: XCircle };
      case PipelineStatus.PENDING:
      case DeploymentStatus.PENDING:
      case MirrorSyncStatus.OUT_OF_SYNC:
        return { color: 'text-yellow-500', icon: AlertCircle };
      default:
        return { color: 'text-gray-500', icon: Clock };
    }
  };

  const handleDeploy = async (app: Application, image: ContainerImage) => {
    try {
      setDeployingImage(image);
      await deployApplication(app.id, image.id);
      setDeployingImage(null);
    } catch (error) {
      console.error('Deployment failed:', error);
      setDeployingImage(null);
    }
  };


  const formatDuration = (seconds?: number) => {
    if (!seconds) return 'N/A';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const formatFileSize = (bytes: number) => {
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader className="w-8 h-8 animate-spin" />
        <span className="ml-2 font-mono">Loading pipeline data...</span>
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

  return (
    <div className="space-y-6">
      {/* Real-time Status & Updates */}
      <div className="border border-white p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-mono flex items-center">
            <GitBranch className="w-5 h-5 mr-2" />
            GITHUB → GITEA → KUBERNETES PIPELINE
          </h2>
          <div className="flex items-center space-x-4">
            {/* Webhook Status */}
            <div className="flex items-center space-x-2">
              <Wifi className={`w-4 h-4 ${isWebhooksConnected ? 'text-green-400' : 'text-red-400'}`} />
              <span className={`text-xs font-mono ${isWebhooksConnected ? 'text-green-400' : 'text-red-400'}`}>
                {isWebhooksConnected ? 'LIVE' : 'OFFLINE'}
              </span>
            </div>
            {/* Real-time Updates Counter */}
            {realtimeUpdates.length > 0 && (
              <div className="flex items-center space-x-2">
                <Zap className="w-4 h-4 text-yellow-400" />
                <span className="text-xs font-mono text-yellow-400">
                  {realtimeUpdates.length} UPDATES
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Recent Pipeline Updates */}
        {realtimeUpdates.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-mono mb-2 text-gray-400">RECENT UPDATES:</h3>
            <div className="space-y-1 max-h-20 overflow-y-auto">
              {realtimeUpdates.slice(0, 3).map((update, index) => {
                const statusDisplay = getStatusDisplay(update.status);
                const StatusIcon = statusDisplay.icon;
                return (
                  <div key={index} className="flex items-center space-x-2 text-xs">
                    <StatusIcon className={`w-3 h-3 ${statusDisplay.color}`} />
                    <span className="font-mono">
                      {update.type.replace('_', ' ').toUpperCase()}
                    </span>
                    <span className="text-gray-400">•</span>
                    <span className={statusDisplay.color}>
                      {update.status.toUpperCase()}
                    </span>
                    <span className="text-gray-400 ml-auto">
                      {new Date(update.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Pipeline Overview */}
      <div className="border border-white p-4">
        <h2 className="text-lg font-mono mb-4 flex items-center">
          <Activity className="w-5 h-5 mr-2" />
          REPOSITORY STATUS
        </h2>

        {/* Repository Selection */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          {repositories.map((repo) => {
            const repoActions = giteaActions.filter(action => action.repository_id === repo.id);
            const latestAction = repoActions.sort((a, b) => 
              new Date(b.started_at).getTime() - new Date(a.started_at).getTime()
            )[0];
            const repoImages = getImagesByRepository(repo.id);
            const mirrorDisplay = getStatusDisplay(repo.mirror_sync_status);
            const MirrorIcon = mirrorDisplay.icon;

            return (
              <div 
                key={repo.id}
                className={`border p-3 cursor-pointer transition-colors ${
                  selectedRepository === repo.id ? 'border-green-400 bg-green-900/20' : 'border-white/30 hover:border-white'
                }`}
                onClick={() => window.location.hash = `#repo=${repo.id}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-mono font-bold">{repo.name}</h3>
                  <div className="flex items-center">
                    <MirrorIcon className={`w-4 h-4 ${mirrorDisplay.color}`} />
                  </div>
                </div>
                
                <div className="text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-gray-400">GitHub:</span>
                    <span>{repo.github_url ? '✓' : '✗'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Actions:</span>
                    <span>{repoActions.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Images:</span>
                    <span>{repoImages.length}</span>
                  </div>
                  {latestAction && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Last Build:</span>
                      <span className={getStatusDisplay(latestAction.status).color}>
                        {latestAction.status.toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Pipeline Flow Visualization */}
        <div className="border border-white/20 p-4 bg-black/50">
          <div className="grid grid-cols-4 gap-4">
            {/* GitHub Mirror */}
            <div className="text-center">
              <div className="flex flex-col items-center space-y-2">
                <GitBranch className="w-8 h-8" />
                <span className="text-sm font-mono">GITHUB</span>
                <span className="text-xs text-gray-400">Source Repository</span>
              </div>
            </div>

            <div className="flex items-center justify-center">
              <ArrowRight className="w-6 h-6 text-gray-400" />
            </div>

            {/* Gitea Actions */}
            <div className="text-center">
              <div className="flex flex-col items-center space-y-2">
                <Activity className="w-8 h-8" />
                <span className="text-sm font-mono">GITEA ACTIONS</span>
                <span className="text-xs text-gray-400">Build & Package</span>
              </div>
            </div>

            <div className="flex items-center justify-center">
              <ArrowRight className="w-6 h-6 text-gray-400" />
            </div>

            {/* Container Images */}
            <div className="text-center">
              <div className="flex flex-col items-center space-y-2">
                <Container className="w-8 h-8" />
                <span className="text-sm font-mono">PACKAGES</span>
                <span className="text-xs text-gray-400">Container Images</span>
              </div>
            </div>

            <div className="flex items-center justify-center">
              <ArrowRight className="w-6 h-6 text-gray-400" />
            </div>

            {/* Kubernetes Deployment */}
            <div className="text-center">
              <div className="flex flex-col items-center space-y-2">
                <Rocket className="w-8 h-8" />
                <span className="text-sm font-mono">KUBERNETES</span>
                <span className="text-xs text-gray-400">Pod Deployment</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Gitea Actions */}
      <div className="border border-white p-4">
        <h3 className="text-lg font-mono mb-4 flex items-center">
          <Activity className="w-5 h-5 mr-2" />
          RECENT BUILD ACTIONS
        </h3>

        <div className="space-y-2">
          {filteredActions.slice(0, 5).map((action) => {
            const statusDisplay = getStatusDisplay(action.status);
            const StatusIcon = statusDisplay.icon;
            const repo = repositories.find(r => r.id === action.repository_id);

            return (
              <div key={action.id} className="border border-white/20 p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <StatusIcon className={`w-4 h-4 ${statusDisplay.color}`} />
                    <div>
                      <div className="font-mono font-bold">{action.workflow_name}</div>
                      <div className="text-sm text-gray-400">
                        {repo?.name} • #{action.run_number} • {action.branch}
                      </div>
                    </div>
                  </div>
                  <div className="text-right text-sm">
                    <div className="font-mono">{formatDuration(action.duration)}</div>
                    <div className="text-gray-400">{action.actor}</div>
                  </div>
                </div>
                <div className="mt-2 text-sm text-gray-300">
                  {action.commit_message}
                </div>
                {action.artifacts.length > 0 && (
                  <div className="mt-2 text-xs">
                    <span className="text-green-400">{action.artifacts.length} artifacts built</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Applications & Deployment */}
      <div className="border border-white p-4">
        <h3 className="text-lg font-mono mb-4 flex items-center">
          <Rocket className="w-5 h-5 mr-2" />
          APPLICATION DEPLOYMENTS
        </h3>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredApplications.map((app) => {
            const repo = repositories.find(r => r.id === app.repository_id);
            const latestImage = getLatestImage(app.repository_id);
            const deployments = getDeploymentsByApplication(app.id);
            const latestDeployment = deployments[0];
            const statusDisplay = getStatusDisplay(app.deployment_status);
            const StatusIcon = statusDisplay.icon;

            return (
              <div key={app.id} className="border border-white/20 p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="font-mono font-bold">{app.name}</h4>
                    <div className="text-sm text-gray-400">{repo?.name} • {app.namespace}</div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <StatusIcon className={`w-4 h-4 ${statusDisplay.color}`} />
                    <span className={`text-xs font-mono ${statusDisplay.color}`}>
                      {app.deployment_status.toUpperCase()}
                    </span>
                  </div>
                </div>

                {/* Current Image */}
                {app.current_image && (
                  <div className="bg-black/50 p-2 mb-3">
                    <div className="text-xs text-gray-400 mb-1">CURRENT IMAGE:</div>
                    <div className="font-mono text-sm">
                      {app.current_image.name}:{app.current_image.tag}
                    </div>
                    <div className="text-xs text-gray-400">
                      {formatFileSize(app.current_image.size_bytes)} • 
                      {new Date(app.current_image.pushed_at).toLocaleString()}
                    </div>
                  </div>
                )}

                {/* Available Images for Deployment */}
                {latestImage && (
                  <div className="space-y-2">
                    <div className="text-xs text-gray-400">AVAILABLE IMAGES:</div>
                    <div className="border border-green-400/30 p-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-mono text-sm">{latestImage.name}:{latestImage.tag}</div>
                          <div className="text-xs text-gray-400">
                            {formatFileSize(latestImage.size_bytes)} • 
                            {new Date(latestImage.pushed_at).toLocaleString()}
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeploy(app, latestImage)}
                          disabled={isDeploying || app.deployment_status === DeploymentStatus.IN_PROGRESS}
                          className="px-3 py-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white text-xs font-mono flex items-center space-x-1"
                        >
                          {isDeploying && deployingImage?.id === latestImage.id ? (
                            <Loader className="w-3 h-3 animate-spin" />
                          ) : (
                            <Play className="w-3 h-3" />
                          )}
                          <span>DEPLOY</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Auto Deploy Status */}
                <div className="mt-3 flex items-center justify-between text-xs">
                  <span className="text-gray-400">
                    Auto Deploy: {app.auto_deploy_on_image_update ? 'ON' : 'OFF'}
                  </span>
                  {latestDeployment && (
                    <span className="text-gray-400">
                      Last: {new Date(latestDeployment.started_at).toLocaleString()}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Deployments */}
      <div className="border border-white p-4">
        <h3 className="text-lg font-mono mb-4 flex items-center">
          <Clock className="w-5 h-5 mr-2" />
          RECENT DEPLOYMENTS
        </h3>

        <div className="space-y-2">
          {deploymentHistory.slice(0, 10).map((deployment) => {
            const app = applications.find(a => a.id === deployment.application_id);
            const statusDisplay = getStatusDisplay(deployment.status);
            const StatusIcon = statusDisplay.icon;

            return (
              <div key={deployment.id} className="border border-white/20 p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <StatusIcon className={`w-4 h-4 ${statusDisplay.color}`} />
                    <div>
                      <div className="font-mono font-bold">{app?.name}</div>
                      <div className="text-sm text-gray-400">
                        {deployment.image.name}:{deployment.image.tag}
                      </div>
                    </div>
                  </div>
                  <div className="text-right text-sm">
                    <div className="font-mono">{formatDuration(deployment.duration)}</div>
                    <div className="text-gray-400 capitalize">
                      {deployment.triggered_by} 
                      {deployment.triggered_by_user && ` • ${deployment.triggered_by_user}`}
                    </div>
                  </div>
                </div>
                
                {deployment.error_message && (
                  <div className="mt-2 text-sm text-red-400">
                    {deployment.error_message}
                  </div>
                )}

                {deployment.rollback_target && (
                  <div className="mt-2 text-sm text-yellow-400">
                    Rollback from deployment {deployment.rollback_target}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default GitOpsPipelineDashboard;
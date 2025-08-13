import { useEffect, type FC } from 'react';
import { Rocket, RotateCcw, Trash2 } from 'lucide-react';
import useDeploymentStore from '@/stores/deploymentStore';

const DeploymentsTab: FC = () => {
  const { 
    deployments, 
    loading, 
    fetchDeployments,
    scaleDeployment,
    restartDeployment,
    deleteDeployment
  } = useDeploymentStore();

  useEffect(() => {
    fetchDeployments();
  }, [fetchDeployments]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running':
        return 'text-green-400';
      case 'pending':
        return 'text-yellow-400';
      case 'failed':
        return 'text-red-400';
      case 'updating':
        return 'text-blue-400';
      case 'terminating':
        return 'text-orange-400';
      default:
        return 'text-gray-400';
    }
  };

  const handleScale = async (deployment: any) => {
    const newReplicas = prompt(`Scale ${deployment.name} (current: ${deployment.replicas}):`, deployment.replicas.toString());
    if (newReplicas && !isNaN(Number(newReplicas))) {
      await scaleDeployment(deployment.id, Number(newReplicas));
    }
  };

  const handleRestart = async (deployment: any) => {
    if (confirm(`Restart ${deployment.name}?`)) {
      await restartDeployment(deployment.id);
    }
  };

  const handleDelete = async (deployment: any) => {
    if (confirm(`Delete ${deployment.name}? This cannot be undone.`)) {
      await deleteDeployment(deployment.id);
    }
  };


  return (
    <>
      {loading.deployments ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin w-8 h-8 border-2 border-white border-t-transparent rounded-full" />
          <span className="ml-3 font-mono">Loading deployments...</span>
        </div>
      ) : deployments.length === 0 ? (
        <div className="border border-white/20 p-8 text-center">
          <Rocket size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-mono mb-2">NO DEPLOYMENTS</h3>
          <p className="text-gray-400">
            No deployments found. Deploy container images to create your first deployment.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {deployments.map((deployment) => (
            <div key={deployment.id} className="border border-white/20 p-4 hover:border-white/40 transition-colors">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xl font-mono font-bold">{deployment.name}</h3>
                  <div className="flex items-center space-x-4 text-sm text-gray-400">
                    <span>Namespace: {deployment.namespace}</span>
                    <span className={getStatusColor(deployment.status)}>
                      Status: {deployment.status.toUpperCase()}
                    </span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleScale(deployment)}
                    className="px-3 py-1 border border-blue-400 text-blue-400 hover:bg-blue-400 hover:text-black transition-colors font-mono text-sm"
                  >
                    SCALE
                  </button>
                  <button
                    onClick={() => handleRestart(deployment)}
                    className="px-3 py-1 border border-yellow-400 text-yellow-400 hover:bg-yellow-400 hover:text-black transition-colors font-mono text-sm"
                  >
                    <RotateCcw size={14} />
                  </button>
                  <button
                    onClick={() => handleDelete(deployment)}
                    className="px-3 py-1 border border-red-400 text-red-400 hover:bg-red-400 hover:text-black transition-colors font-mono text-sm"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <h4 className="text-sm font-mono text-gray-400 mb-2">IMAGE</h4>
                  <div className="font-mono text-sm">
                    {deployment.image.split('/').pop()}
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-mono text-gray-400 mb-2">REPLICAS</h4>
                  <div className="font-mono text-sm">
                    {deployment.availableReplicas || 0}/{deployment.replicas}
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-mono text-gray-400 mb-2">CREATED</h4>
                  <div className="font-mono text-sm">
                    {new Date(deployment.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>

              {/* Pods */}
              {deployment.pods && deployment.pods.length > 0 && (
                <div>
                  <h4 className="text-sm font-mono text-gray-400 mb-2">PODS</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                    {deployment.pods.map((pod) => (
                      <div key={pod.name} className="border border-white/10 p-2 text-xs">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-mono truncate">{pod.name.split('-').pop()}</span>
                          <span className={`font-mono ${pod.ready ? 'text-green-400' : 'text-red-400'}`}>
                            {pod.phase}
                          </span>
                        </div>
                        <div className="text-gray-400">
                          Node: {pod.nodeName || 'Unknown'}
                        </div>
                        {pod.restarts > 0 && (
                          <div className="text-yellow-400">
                            Restarts: {pod.restarts}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  );
};

export default DeploymentsTab;
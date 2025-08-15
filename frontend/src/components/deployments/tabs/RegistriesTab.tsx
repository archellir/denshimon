import { useState, type FC } from 'react';
import { Trash2, TestTube, CheckCircle, XCircle, Clock, Package } from 'lucide-react';
import useDeploymentStore from '@stores/deploymentStore';
import RegistryForm from '../forms/RegistryForm';
import type { Registry } from '@/types/deployments';

const RegistriesTab: FC = () => {
  const [showForm, setShowForm] = useState(false);
  const [editingRegistry, setEditingRegistry] = useState<Registry | null>(null);
  const { 
    registries, 
    loading, 
    deleteRegistry, 
    testRegistry 
  } = useDeploymentStore();

  const getStatusColor = (status: Registry['status']) => {
    switch (status) {
      case 'connected':
        return 'text-green-400';
      case 'error':
        return 'text-red-400';
      case 'pending':
        return 'text-yellow-400';
      default:
        return 'text-gray-400';
    }
  };

  const getStatusIcon = (status: Registry['status']) => {
    switch (status) {
      case 'connected':
        return CheckCircle;
      case 'error':
        return XCircle;
      case 'pending':
        return Clock;
      default:
        return Clock;
    }
  };

  const handleTestRegistry = async (registry: Registry) => {
    const success = await testRegistry(registry.id);
    console.log(`Registry test ${success ? 'passed' : 'failed'}`);
  };

  const handleDeleteRegistry = async (registry: Registry) => {
    if (confirm(`Are you sure you want to delete ${registry.name}?`)) {
      await deleteRegistry(registry.id);
    }
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingRegistry(null);
  };

  return (
    <>
      {loading.registries ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin w-8 h-8 border-2 border-white border-t-transparent rounded-full" />
          <span className="ml-3 font-mono">Loading registries...</span>
        </div>
      ) : registries.length === 0 ? (
        <div className="border border-white/20 p-8 text-center">
          <div className="mb-4">
            <Package size={48} className="mx-auto text-gray-400" />
          </div>
          <h3 className="text-lg font-mono mb-2">NO REGISTRIES CONFIGURED</h3>
          <p className="text-gray-400 mb-4">
            Add container registries to deploy images from Docker Hub, Gitea, or other sources.
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 border border-green-400 text-green-400 hover:bg-green-400 hover:text-black transition-colors font-mono"
          >
            ADD FIRST REGISTRY
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {registries.map((registry) => {
            const StatusIcon = getStatusIcon(registry.status);
            return (
              <div key={registry.id} className="border border-white/20 p-4 hover:border-white/40 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-mono font-bold text-lg">{registry.name}</h3>
                    <p className="text-sm text-gray-400">{registry.type.toUpperCase()}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <StatusIcon size={16} className={getStatusColor(registry.status)} />
                    <span className={`text-xs font-mono ${getStatusColor(registry.status)}`}>
                      {registry.status.toUpperCase()}
                    </span>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="text-sm">
                    <span className="text-gray-400">URL:</span>
                    <span className="ml-2 font-mono">{registry.config.url}</span>
                  </div>
                  {registry.config.namespace && (
                    <div className="text-sm">
                      <span className="text-gray-400">Namespace:</span>
                      <span className="ml-2 font-mono">{registry.config.namespace}</span>
                    </div>
                  )}
                  {registry.error && (
                    <div className="text-sm text-red-400 border border-red-400/20 p-2 bg-red-900/10">
                      {registry.error}
                    </div>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleTestRegistry(registry)}
                    className="flex-1 flex items-center justify-center space-x-1 px-3 py-1 border border-blue-400 text-blue-400 hover:bg-blue-400 hover:text-black transition-colors font-mono text-sm"
                  >
                    <TestTube size={14} />
                    <span>TEST</span>
                  </button>
                  <button
                    onClick={() => handleDeleteRegistry(registry)}
                    className="flex items-center justify-center px-3 py-1 border border-red-400 text-red-400 hover:bg-red-400 hover:text-black transition-colors font-mono text-sm"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Registry Form Modal */}
      {showForm && (
        <RegistryForm
          registry={editingRegistry}
          onClose={handleFormClose}
          onSave={handleFormClose}
        />
      )}
    </>
  );
};

export default RegistriesTab;
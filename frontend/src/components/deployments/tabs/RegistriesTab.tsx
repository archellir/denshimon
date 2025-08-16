import { useState, type FC } from 'react';
import { Trash2, TestTube, CheckCircle, XCircle, Clock, Package } from 'lucide-react';
import useDeploymentStore from '@stores/deploymentStore';
import RegistryForm from '../forms/RegistryForm';
import CustomDialog from '@components/common/CustomDialog';
import CustomButton from '@components/common/CustomButton';
import type { Registry } from '@/types/deployments';

interface RegistriesTabProps {
  showForm?: boolean;
  setShowForm?: (show: boolean) => void;
}

const RegistriesTab: FC<RegistriesTabProps> = ({ 
  showForm: externalShowForm, 
  setShowForm: externalSetShowForm 
}) => {
  const [internalShowForm, setInternalShowForm] = useState(false);
  
  // Use external state if provided, otherwise use internal state
  const showForm = externalShowForm !== undefined ? externalShowForm : internalShowForm;
  const setShowForm = externalSetShowForm || setInternalShowForm;
  const [editingRegistry, setEditingRegistry] = useState<Registry | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; registry: Registry | null }>({ 
    open: false, 
    registry: null 
  });
  const [actionLoading, setActionLoading] = useState(false);
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

  const handleDeleteRegistry = (registry: Registry) => {
    setDeleteDialog({ 
      open: true, 
      registry 
    });
  };

  const onDeleteConfirm = async () => {
    if (!deleteDialog.registry) return;
    
    try {
      setActionLoading(true);
      await deleteRegistry(deleteDialog.registry.id);
      setDeleteDialog({ open: false, registry: null });
    } catch (error) {
      console.error('Failed to delete registry:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingRegistry(null);
  };

  return (
    <>
      {loading.registries ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, index) => (
            <div key={`skeleton-${index}`} className="border border-white/20 p-4 animate-pulse flex flex-col h-full">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="h-5 bg-white/10 rounded w-24 mb-2"></div>
                  <div className="h-4 bg-white/10 rounded w-20"></div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="h-4 w-4 bg-white/10 rounded-full"></div>
                  <div className="h-3 bg-white/10 rounded w-16"></div>
                </div>
              </div>
              <div className="space-y-2 mb-4 flex-1">
                <div className="flex">
                  <div className="h-4 bg-white/10 rounded w-10 mr-2"></div>
                  <div className="h-4 bg-white/10 rounded w-32"></div>
                </div>
                <div className="flex">
                  <div className="h-4 bg-white/10 rounded w-20 mr-2"></div>
                  <div className="h-4 bg-white/10 rounded w-24"></div>
                </div>
              </div>
              <div className="flex items-center justify-end space-x-2">
                <div className="h-8 bg-white/10 rounded w-16"></div>
                <div className="h-8 bg-white/10 rounded w-8"></div>
              </div>
            </div>
          ))}
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
          <CustomButton
            label="ADD FIRST REGISTRY"
            onClick={() => setShowForm(true)}
            color="green"
            className="w-auto px-6"
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {registries.map((registry) => {
            const StatusIcon = getStatusIcon(registry.status);
            return (
              <div key={registry.id} className="border border-white/20 p-4 hover:border-white/40 transition-colors flex flex-col h-full">
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

                <div className="space-y-2 mb-4 flex-1">
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

                <div className="flex items-center justify-end space-x-2">
                  <CustomButton
                    label="TEST"
                    icon={TestTube}
                    onClick={() => handleTestRegistry(registry)}
                    color="blue"
                    className="w-auto"
                  />
                  <CustomButton
                    label=""
                    icon={Trash2}
                    onClick={() => handleDeleteRegistry(registry)}
                    color="red"
                    className="w-auto px-2 py-1"
                  />
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

      {/* Delete Dialog */}
      <CustomDialog
        isOpen={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, registry: null })}
        onConfirm={onDeleteConfirm}
        title="Delete Registry"
        message={`Are you sure you want to permanently delete ${deleteDialog.registry?.name?.toUpperCase()}? This action cannot be undone and will remove all associated configurations.`}
        confirmText="DELETE"
        cancelText="CANCEL"
        variant="danger"
        icon={Trash2}
        loading={actionLoading}
      />
    </>
  );
};

export default RegistriesTab;
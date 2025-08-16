import { useState, useEffect } from 'react';
import { Rocket, RotateCcw, Trash2, Scale } from 'lucide-react';
import useDeploymentStore from '@stores/deploymentStore';
import { Deployment } from '@/types/deployments';
import { getDeploymentStatusColor } from '@utils/status';
import CustomDialog from '@components/common/CustomDialog';
import CustomButton from '@components/common/CustomButton';
import DeploymentModal from '@components/deployments/DeploymentModal';
import SkeletonLoader from '@components/common/SkeletonLoader';

interface DeploymentsTabProps {
  showDeployModal?: boolean;
  setShowDeployModal?: (show: boolean) => void;
}

const DeploymentsTab = ({ 
  showDeployModal = false, 
  setShowDeployModal
}: DeploymentsTabProps) => {
  const { 
    deployments, 
    loading, 
    fetchDeployments,
    scaleDeployment,
    restartDeployment,
    deleteDeployment
  } = useDeploymentStore();


  // Dialog states
  const [scaleDialog, setScaleDialog] = useState<{ open: boolean; deployment: Deployment | null; value: string }>({ 
    open: false, 
    deployment: null, 
    value: '' 
  });
  const [restartDialog, setRestartDialog] = useState<{ open: boolean; deployment: Deployment | null }>({ 
    open: false, 
    deployment: null 
  });
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; deployment: Deployment | null }>({ 
    open: false, 
    deployment: null 
  });
  const [actionLoading, setActionLoading] = useState(false);


  useEffect(() => {
    fetchDeployments();
  }, [fetchDeployments]);






  const handleScale = (deployment: Deployment) => {
    setScaleDialog({ 
      open: true, 
      deployment, 
      value: deployment.replicas.toString() 
    });
  };

  const handleRestart = (deployment: Deployment) => {
    setRestartDialog({ 
      open: true, 
      deployment 
    });
  };

  const handleDelete = (deployment: Deployment) => {
    setDeleteDialog({ 
      open: true, 
      deployment 
    });
  };

  const onScaleConfirm = async () => {
    if (!scaleDialog.deployment || !scaleDialog.value || isNaN(Number(scaleDialog.value))) return;
    
    try {
      setActionLoading(true);
      await scaleDeployment(scaleDialog.deployment.id, Number(scaleDialog.value));
      setScaleDialog({ open: false, deployment: null, value: '' });
    } catch (error) {
      console.error('Failed to scale deployment:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const onRestartConfirm = async () => {
    if (!restartDialog.deployment) return;
    
    try {
      setActionLoading(true);
      await restartDeployment(restartDialog.deployment.id);
      setRestartDialog({ open: false, deployment: null });
    } catch (error) {
      console.error('Failed to restart deployment:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const onDeleteConfirm = async () => {
    if (!deleteDialog.deployment) return;
    
    try {
      setActionLoading(true);
      await deleteDeployment(deleteDialog.deployment.id);
      setDeleteDialog({ open: false, deployment: null });
    } catch (error) {
      console.error('Failed to delete deployment:', error);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="h-full overflow-y-auto">
      {loading.deployments ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <SkeletonLoader variant="card" count={4} />
        </div>
      ) : deployments.length === 0 ? (
        <div className="border border-white p-8 text-center bg-black">
          <Rocket size={48} className="mx-auto text-green-400 mb-4" />
          <h3 className="text-lg font-mono mb-2 text-white">NO DEPLOYMENTS DETECTED</h3>
          <p className="text-gray-300 mb-4 font-mono text-sm">
            Initialize application deployment sequence using GitOps protocol.
          </p>
          <CustomButton
            label="DEPLOY APPLICATION"
            icon={Rocket}
            onClick={() => setShowDeployModal?.(true)}
            color="green"
            className="w-auto px-6"
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {deployments.map((deployment) => (
            <div key={deployment.id} className="border border-white p-4 hover:border-green-400 transition-colors bg-black">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xl font-mono font-bold text-white">{deployment.name.toUpperCase()}</h3>
                  <div className="flex items-center space-x-4 text-sm text-gray-300 font-mono">
                    <span>NS: {deployment.namespace}</span>
                    <span className={getDeploymentStatusColor(deployment.status as any)}>
                      STATUS: {deployment.status.toUpperCase()}
                    </span>
                    <span>REPLICAS: {deployment.replicas}</span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <CustomButton
                    label="SCALE"
                    onClick={() => handleScale(deployment)}
                    color="blue"
                    className="w-auto px-3 py-1"
                  />
                  <CustomButton
                    label=""
                    icon={RotateCcw}
                    onClick={() => handleRestart(deployment)}
                    color="yellow"
                    className="w-auto px-3 py-1"
                  />
                  <CustomButton
                    label=""
                    icon={Trash2}
                    onClick={() => handleDelete(deployment)}
                    color="red"
                    className="w-auto px-3 py-1"
                  />
                </div>
              </div>
              <div className="text-sm text-gray-300 font-mono">
                <div>IMAGE: {deployment.image}</div>
                {deployment.createdAt && (
                  <div>CREATED: {new Date(deployment.createdAt).toLocaleString()}</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <DeploymentModal
        isOpen={showDeployModal}
        onClose={() => setShowDeployModal?.(false)}
      />

      {/* Scale Dialog */}
      <CustomDialog
        isOpen={scaleDialog.open}
        onClose={() => setScaleDialog({ open: false, deployment: null, value: '' })}
        onConfirm={onScaleConfirm}
        title="Scale Deployment"
        message={`Adjust the number of replicas for ${scaleDialog.deployment?.name?.toUpperCase()}`}
        confirmText="SCALE"
        cancelText="CANCEL"
        variant="info"
        icon={Scale}
        loading={actionLoading}
        inputField={{
          label: "Number of Replicas",
          type: "number",
          value: scaleDialog.value,
          onChange: (value) => setScaleDialog(prev => ({ ...prev, value })),
          placeholder: "Enter replica count",
          min: 0,
          max: 100,
          required: true
        }}
      />

      {/* Restart Dialog */}
      <CustomDialog
        isOpen={restartDialog.open}
        onClose={() => setRestartDialog({ open: false, deployment: null })}
        onConfirm={onRestartConfirm}
        title="Restart Deployment"
        message={`Are you sure you want to restart ${restartDialog.deployment?.name?.toUpperCase()}? This will trigger a rolling restart of all pods.`}
        confirmText="RESTART"
        cancelText="CANCEL"
        variant="warning"
        icon={RotateCcw}
        loading={actionLoading}
      />

      {/* Delete Dialog */}
      <CustomDialog
        isOpen={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, deployment: null })}
        onConfirm={onDeleteConfirm}
        title="Delete Deployment"
        message={`Are you sure you want to permanently delete ${deleteDialog.deployment?.name?.toUpperCase()}? This action cannot be undone and will remove all associated resources.`}
        confirmText="DELETE"
        cancelText="CANCEL"
        variant="danger"
        icon={Trash2}
        loading={actionLoading}
      />
    </div>
  );
};

export default DeploymentsTab;
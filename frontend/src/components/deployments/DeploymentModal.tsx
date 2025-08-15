import { useState, useEffect, type FC } from 'react';
import { X, Container, Database, Server, Globe, Shield, Activity } from 'lucide-react';
import { ContainerImage } from '@/types';
import { API_ENDPOINTS } from '@constants';
import useModalKeyboard from '@hooks/useModalKeyboard';
import useDeploymentStore from '@stores/deploymentStore';
import CustomSelector from '@components/common/CustomSelector';

interface DeploymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedImage?: ContainerImage | null;
}

const DeploymentModal: FC<DeploymentModalProps> = ({
  isOpen,
  onClose,
  preselectedImage
}) => {
  const { images, fetchImages } = useDeploymentStore();
  
  const [selectedImage, setSelectedImage] = useState<ContainerImage | null>(preselectedImage || null);
  const [deploying, setDeploying] = useState(false);
  const [deployForm, setDeployForm] = useState({
    name: '',
    namespace: 'base-infra',
    replicas: 1,
    port: 8080,
    environment: {} as Record<string, string>,
    resources: {
      cpu_request: '10m',
      cpu_limit: '50m',
      memory_request: '32Mi',
      memory_limit: '64Mi'
    }
  });

  useEffect(() => {
    if (isOpen) {
      fetchImages();
      if (preselectedImage) {
        setSelectedImage(preselectedImage);
      }
    }
  }, [isOpen, preselectedImage, fetchImages]);

  const handleSubmit = async () => {
    if (!selectedImage || !deployForm.name) return;

    try {
      setDeploying(true);
      
      const manifestResponse = await fetch(API_ENDPOINTS.GITOPS.MANIFESTS_GENERATE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          application: {
            name: deployForm.name,
            namespace: deployForm.namespace,
            image: selectedImage.fullName,
            replicas: deployForm.replicas,
            resources: deployForm.resources,
            environment: deployForm.environment
          },
          resource_type: "Full",
          options: {
            service: true,
            port: deployForm.port
          }
        })
      });

      if (!manifestResponse.ok) {
        throw new Error('Failed to generate manifest');
      }

      const manifestData = await manifestResponse.json();

      const createResponse = await fetch(API_ENDPOINTS.GITOPS.APPLICATIONS, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: deployForm.name,
          namespace: deployForm.namespace,
          image: selectedImage.fullName,
          replicas: deployForm.replicas,
          environment: deployForm.environment,
          resources: deployForm.resources,
          manifest: manifestData.manifest
        })
      });

      if (createResponse.ok) {
        onClose();
        resetForm();
      }
    } catch (error) {
      console.error('Failed to deploy application:', error);
    } finally {
      setDeploying(false);
    }
  };

  const resetForm = () => {
    setSelectedImage(null);
    setDeployForm({
      name: '',
      namespace: 'base-infra',
      replicas: 1,
      port: 8080,
      environment: {},
      resources: {
        cpu_request: '10m',
        cpu_limit: '50m',
        memory_request: '32Mi',
        memory_limit: '64Mi'
      }
    });
  };

  const { createClickOutsideHandler, preventClickThrough } = useModalKeyboard({
    isOpen,
    onClose,
    onSubmit: handleSubmit,
    canSubmit: Boolean(selectedImage && deployForm.name && !deploying),
    modalId: 'deployment-modal'
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50" onClick={createClickOutsideHandler(onClose)}>
      <div id="deployment-modal" className="bg-black border border-white p-6 max-w-md w-full mx-4" onClick={preventClickThrough}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-white font-mono tracking-wider">DEPLOY APPLICATION</h3>
          <button
            onClick={onClose}
            className="p-1 border border-red-400 text-red-400 hover:bg-red-400 hover:text-black transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="space-y-4">
          {/* Image Selection */}
          <div>
            <label className="block text-sm font-mono text-gray-400 mb-2">CONTAINER IMAGE</label>
            {preselectedImage ? (
              <div className="p-3 border border-green-400/20 bg-green-400/5">
                <div className="text-sm font-mono text-green-400">SELECTED IMAGE</div>
                <div className="text-white font-mono">{preselectedImage.repository}:{preselectedImage.tag}</div>
                <div className="text-xs text-gray-400">{preselectedImage.registry}</div>
              </div>
            ) : (
              <CustomSelector
                value={selectedImage?.fullName || ''}
                options={images.map(image => ({
                  value: image.fullName,
                  label: `${image.repository.toUpperCase()} : ${image.tag}`,
                  description: image.size ? `${(image.size / 1024 / 1024).toFixed(1)} MB` : 'Container Image'
                }))}
                onChange={(value) => {
                  const image = images.find(img => img.fullName === value);
                  setSelectedImage(image || null);
                }}
                placeholder="-- SELECT AN IMAGE --"
                icon={Container}
                size="sm"
              />
            )}
          </div>

          {/* Basic Configuration */}
          <div>
            <label className="block text-sm font-mono text-gray-400 mb-2">APPLICATION NAME</label>
            <input
              type="text"
              value={deployForm.name}
              onChange={(e) => setDeployForm(prev => ({...prev, name: e.target.value}))}
              className="w-full bg-black border border-white text-white px-3 py-2 font-mono text-sm"
              placeholder="my-app"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-mono text-gray-400 mb-2">NAMESPACE</label>
              <CustomSelector
                value={deployForm.namespace}
                options={[
                  { value: 'base-infra', label: 'BASE-INFRA' },
                  { value: 'default', label: 'DEFAULT' },
                  { value: 'kube-system', label: 'KUBE-SYSTEM' }
                ]}
                onChange={(value) => setDeployForm(prev => ({...prev, namespace: value}))}
                icon={Database}
                size="sm"
              />
            </div>
            <div>
              <label className="block text-sm font-mono text-gray-400 mb-2">REPLICAS</label>
              <input
                type="number"
                min="1"
                value={deployForm.replicas}
                onChange={(e) => setDeployForm(prev => ({...prev, replicas: parseInt(e.target.value)}))}
                className="w-full bg-black border border-white text-white px-3 py-2 font-mono text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-mono text-gray-400 mb-2">CONTAINER PORT</label>
            <input
              type="number"
              min="1"
              max="65535"
              value={deployForm.port}
              onChange={(e) => setDeployForm(prev => ({...prev, port: parseInt(e.target.value)}))}
              className="w-full bg-black border border-white text-white px-3 py-2 font-mono text-sm"
              placeholder="8080"
            />
          </div>
        </div>

        {/* Deploy Button */}
        <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-white/20">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-red-400 text-red-400 hover:bg-red-400 hover:text-black transition-colors font-mono text-sm tracking-wider"
          >
            CANCEL
          </button>
          <button
            onClick={handleSubmit}
            disabled={!selectedImage || !deployForm.name || deploying}
            className="px-6 py-2 border border-green-400 text-green-400 hover:bg-green-400 hover:text-black disabled:border-gray-600 disabled:text-gray-600 transition-colors font-mono text-sm flex items-center space-x-2 tracking-wider"
          >
            {deploying && <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full" />}
            <span>{deploying ? 'DEPLOYING...' : 'DEPLOY'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeploymentModal;
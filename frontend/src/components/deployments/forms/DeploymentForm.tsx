import { useState, type FC } from 'react';
import { X, Play, Package } from 'lucide-react';
import useDeploymentStore from '@stores/deploymentStore';
import type { ContainerImage, DeploymentRequest } from '@/types/deployments';

interface DeploymentFormProps {
  image?: ContainerImage;
  onClose: () => void;
  onSuccess?: () => void;
}

const DeploymentForm: FC<DeploymentFormProps> = ({ image, onClose, onSuccess }) => {
  const { createDeployment, loading } = useDeploymentStore();
  const [formData, setFormData] = useState<DeploymentRequest>({
    name: image ? `${image.repository.split('/').pop()}-deployment` : '',
    namespace: 'default',
    image: image ? `${image.repository}:${image.tag}` : '',
    replicas: 1,
    resources: {
      requests: { cpu: '100m', memory: '128Mi' },
      limits: { cpu: '500m', memory: '512Mi' }
    },
    env: [],
    ports: [{ containerPort: 80, protocol: 'TCP' }],
    labels: {},
    annotations: {}
  });

  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (field: keyof DeploymentRequest, value: unknown) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleResourceChange = (type: 'requests' | 'limits', resource: 'cpu' | 'memory', value: string) => {
    setFormData(prev => ({
      ...prev,
      resources: {
        ...prev.resources,
        [type]: {
          ...prev.resources[type],
          [resource]: value
        }
      }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      await createDeployment(formData);
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create deployment');
    }
  };

  const commonNamespaces = ['default', 'kube-system', 'production', 'staging', 'development'];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-black border border-white/20 p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Package className="text-green-400" size={24} />
            <h2 className="text-xl font-mono font-bold">CREATE DEPLOYMENT</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 p-3 mb-4">
            <p className="text-red-400 font-mono text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-mono text-gray-300">BASIC INFORMATION</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-mono text-gray-400 mb-2">
                  DEPLOYMENT NAME *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="w-full bg-black border border-white/20 p-2 font-mono text-sm focus:border-white/40 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-mono text-gray-400 mb-2">
                  NAMESPACE *
                </label>
                <select
                  value={formData.namespace}
                  onChange={(e) => handleInputChange('namespace', e.target.value)}
                  className="w-full bg-black border border-white/20 p-2 font-mono text-sm focus:border-white/40 outline-none"
                  required
                >
                  {commonNamespaces.map(ns => (
                    <option key={ns} value={ns}>{ns}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-mono text-gray-400 mb-2">
                CONTAINER IMAGE *
              </label>
              <input
                type="text"
                value={formData.image}
                onChange={(e) => handleInputChange('image', e.target.value)}
                className="w-full bg-black border border-white/20 p-2 font-mono text-sm focus:border-white/40 outline-none"
                placeholder="nginx:latest"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-mono text-gray-400 mb-2">
                REPLICAS
              </label>
              <input
                type="number"
                min="0"
                value={formData.replicas}
                onChange={(e) => handleInputChange('replicas', parseInt(e.target.value))}
                className="w-full bg-black border border-white/20 p-2 font-mono text-sm focus:border-white/40 outline-none"
              />
            </div>
          </div>

          {/* Resource Limits */}
          <div className="space-y-4">
            <h3 className="text-lg font-mono text-gray-300">RESOURCE LIMITS</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-mono text-gray-400 mb-2">REQUESTS</h4>
                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="CPU (e.g., 100m)"
                    value={formData.resources.requests.cpu}
                    onChange={(e) => handleResourceChange('requests', 'cpu', e.target.value)}
                    className="w-full bg-black border border-white/20 p-2 font-mono text-xs focus:border-white/40 outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Memory (e.g., 128Mi)"
                    value={formData.resources.requests.memory}
                    onChange={(e) => handleResourceChange('requests', 'memory', e.target.value)}
                    className="w-full bg-black border border-white/20 p-2 font-mono text-xs focus:border-white/40 outline-none"
                  />
                </div>
              </div>

              <div>
                <h4 className="text-sm font-mono text-gray-400 mb-2">LIMITS</h4>
                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="CPU (e.g., 500m)"
                    value={formData.resources.limits.cpu}
                    onChange={(e) => handleResourceChange('limits', 'cpu', e.target.value)}
                    className="w-full bg-black border border-white/20 p-2 font-mono text-xs focus:border-white/40 outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Memory (e.g., 512Mi)"
                    value={formData.resources.limits.memory}
                    onChange={(e) => handleResourceChange('limits', 'memory', e.target.value)}
                    className="w-full bg-black border border-white/20 p-2 font-mono text-xs focus:border-white/40 outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-4 pt-4 border-t border-white/20">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-400 text-gray-400 hover:bg-gray-400 hover:text-black transition-colors font-mono text-sm"
            >
              CANCEL
            </button>
            <button
              type="submit"
              disabled={loading.deploying}
              className="px-4 py-2 border border-green-400 text-green-400 hover:bg-green-400 hover:text-black transition-colors font-mono text-sm flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading.deploying ? (
                <>
                  <div className="animate-spin w-4 h-4 border border-green-400 border-t-transparent rounded-full" />
                  <span>DEPLOYING...</span>
                </>
              ) : (
                <>
                  <Play size={14} />
                  <span>DEPLOY</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DeploymentForm;
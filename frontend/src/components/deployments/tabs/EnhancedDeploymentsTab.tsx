import { useState, useEffect } from 'react';
import { Rocket, RotateCcw, Trash2, Plus, Package, Settings, X } from 'lucide-react';
import useDeploymentStore from '@/stores/deploymentStore';
import { Deployment } from '@/types/deployments';
import { API_ENDPOINTS } from '@/constants';

interface Template {
  id: string;
  name: string;
  type: string;
  description: string;
  variables: Array<{
    name: string;
    required: boolean;
    default?: string;
    description?: string;
  }>;
}

interface ContainerImage {
  id: string;
  name: string;
  tag: string;
  full_name: string;
  repository_id: string;
  size?: string;
  created_at: string;
}

const EnhancedDeploymentsTab = () => {
  const { 
    deployments, 
    loading, 
    fetchDeployments,
    scaleDeployment,
    restartDeployment,
    deleteDeployment
  } = useDeploymentStore();

  // Deployment states
  const [showDeployModal, setShowDeployModal] = useState(false);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [images, setImages] = useState<ContainerImage[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [selectedImage, setSelectedImage] = useState<ContainerImage | null>(null);
  const [deploying, setDeploying] = useState(false);
  const [deployForm, setDeployForm] = useState({
    name: '',
    namespace: 'default',
    replicas: 1,
    environment: {} as Record<string, string>,
    resources: {
      cpu_request: '100m',
      cpu_limit: '500m',
      memory_request: '128Mi',
      memory_limit: '512Mi'
    }
  });

  useEffect(() => {
    fetchDeployments();
    if (showDeployModal) {
      fetchTemplates();
      fetchImages();
    }
  }, [fetchDeployments, showDeployModal]);

  const fetchTemplates = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.GITOPS.TEMPLATES);
      const data = await response.json();
      setTemplates(data.templates || []);
    } catch (error) {
      console.error('Failed to fetch templates:', error);
    }
  };

  const fetchImages = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.GITEA.IMAGES);
      const data = await response.json();
      setImages(data.images || []);
    } catch (error) {
      console.error('Failed to fetch images:', error);
    }
  };

  const handleDeploy = async () => {
    if (!selectedTemplate || !selectedImage) return;

    try {
      setDeploying(true);
      
      // Generate manifest
      const manifestResponse = await fetch(API_ENDPOINTS.GITOPS.MANIFESTS_GENERATE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          template_id: selectedTemplate.id,
          variables: {
            Name: deployForm.name,
            Namespace: deployForm.namespace,
            Image: selectedImage.full_name,
            Replicas: deployForm.replicas,
            'CPU.Request': deployForm.resources.cpu_request,
            'CPU.Limit': deployForm.resources.cpu_limit,
            'Memory.Request': deployForm.resources.memory_request,
            'Memory.Limit': deployForm.resources.memory_limit,
            Environment: deployForm.environment
          }
        })
      });

      if (!manifestResponse.ok) {
        throw new Error('Failed to generate manifest');
      }

      const manifestData = await manifestResponse.json();

      // Create and deploy application
      const createResponse = await fetch(API_ENDPOINTS.GITOPS.APPLICATIONS, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: deployForm.name,
          namespace: deployForm.namespace,
          image: selectedImage.full_name,
          replicas: deployForm.replicas,
          environment: deployForm.environment,
          resources: deployForm.resources,
          manifest: manifestData.data.manifest
        })
      });

      if (createResponse.ok) {
        setShowDeployModal(false);
        resetDeployForm();
        await fetchDeployments(); // Refresh deployments list
      }
    } catch (error) {
      console.error('Failed to deploy application:', error);
    } finally {
      setDeploying(false);
    }
  };

  const resetDeployForm = () => {
    setSelectedTemplate(null);
    setSelectedImage(null);
    setDeployForm({
      name: '',
      namespace: 'default',
      replicas: 1,
      environment: {},
      resources: {
        cpu_request: '100m',
        cpu_limit: '500m',
        memory_request: '128Mi',
        memory_limit: '512Mi'
      }
    });
  };

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

  const handleScale = async (deployment: Deployment) => {
    const newReplicas = prompt(`Scale ${deployment.name} (current: ${deployment.replicas}):`, deployment.replicas.toString());
    if (newReplicas && !isNaN(Number(newReplicas))) {
      await scaleDeployment(deployment.id, Number(newReplicas));
    }
  };

  const handleRestart = async (deployment: Deployment) => {
    if (confirm(`Restart ${deployment.name}?`)) {
      await restartDeployment(deployment.id);
    }
  };

  const handleDelete = async (deployment: Deployment) => {
    if (confirm(`Delete ${deployment.name}? This cannot be undone.`)) {
      await deleteDeployment(deployment.id);
    }
  };

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white font-mono">APPLICATION DEPLOYMENTS</h2>
        <button
          onClick={() => setShowDeployModal(true)}
          className="flex items-center space-x-2 px-4 py-2 border border-green-400 text-green-400 hover:bg-green-400 hover:text-black transition-colors font-mono text-sm uppercase tracking-wider"
        >
          <Plus size={16} />
          <span>Deploy New Application</span>
        </button>
      </div>

      {loading.deployments ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin w-8 h-8 border-2 border-white border-t-transparent rounded-full" />
          <span className="ml-3 font-mono">Loading deployments...</span>
        </div>
      ) : deployments.length === 0 ? (
        <div className="border border-white p-8 text-center bg-black">
          <Rocket size={48} className="mx-auto text-green-400 mb-4" />
          <h3 className="text-lg font-mono mb-2 text-white">NO DEPLOYMENTS DETECTED</h3>
          <p className="text-gray-300 mb-4 font-mono text-sm">
            Initialize application deployment sequence using GitOps protocol.
          </p>
          <button
            onClick={() => setShowDeployModal(true)}
            className="px-6 py-2 border border-green-400 text-green-400 hover:bg-green-400 hover:text-black transition-colors font-mono text-sm uppercase tracking-wider"
          >
            Deploy Application
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {deployments.map((deployment) => (
            <div key={deployment.id} className="border border-white p-4 hover:border-green-400 transition-colors bg-black">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xl font-mono font-bold text-white">{deployment.name.toUpperCase()}</h3>
                  <div className="flex items-center space-x-4 text-sm text-gray-300 font-mono">
                    <span>NS: {deployment.namespace}</span>
                    <span className={getStatusColor(deployment.status)}>
                      STATUS: {deployment.status.toUpperCase()}
                    </span>
                    <span>REPLICAS: {deployment.replicas}</span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleScale(deployment)}
                    className="px-3 py-1 border border-blue-400 text-blue-400 hover:bg-blue-400 hover:text-black transition-colors font-mono text-sm tracking-wider"
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
              <div className="text-sm text-gray-300 font-mono">
                <div>IMAGE: {deployment.image}</div>
                {deployment.created_at && (
                  <div>CREATED: {new Date(deployment.created_at).toLocaleString()}</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Deploy Application Modal */}
      {showDeployModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-black border border-white p-6 max-w-4xl w-full mx-4 max-h-screen overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white font-mono tracking-wider">DEPLOY NEW APPLICATION</h3>
              <button
                onClick={() => setShowDeployModal(false)}
                className="p-2 border border-red-400 text-red-400 hover:bg-red-400 hover:text-black transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Template Selection */}
              <div>
                <h4 className="font-bold text-white mb-3 font-mono tracking-wider">1. SELECT TEMPLATE</h4>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {templates.map((template) => (
                    <div
                      key={template.id}
                      onClick={() => setSelectedTemplate(template)}
                      className={`p-3 border cursor-pointer transition-colors ${
                        selectedTemplate?.id === template.id
                          ? 'border-blue-400 bg-blue-900/20'
                          : 'border-white/30 hover:border-white/50'
                      }`}
                    >
                      <div className="font-mono text-sm text-white">{template.name.toUpperCase()}</div>
                      <div className="text-xs text-gray-300 font-mono">{template.type.toUpperCase()}</div>
                      <div className="text-xs text-gray-400 mt-1">{template.description}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Image Selection */}
              <div>
                <h4 className="font-bold text-white mb-3 font-mono tracking-wider">2. SELECT CONTAINER IMAGE</h4>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {images.map((image) => (
                    <div
                      key={image.id}
                      onClick={() => setSelectedImage(image)}
                      className={`p-3 border cursor-pointer transition-colors ${
                        selectedImage?.id === image.id
                          ? 'border-green-400 bg-green-900/20'
                          : 'border-white/30 hover:border-white/50'
                      }`}
                    >
                      <div className="font-mono text-sm text-white">{image.name.toUpperCase()}</div>
                      <div className="text-xs text-gray-300 font-mono">{image.tag}</div>
                      {image.size && (
                        <div className="text-xs text-gray-400">SIZE: {image.size}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Configuration Form */}
              <div>
                <h4 className="font-bold text-white mb-3 font-mono tracking-wider">3. CONFIGURE DEPLOYMENT</h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-mono text-gray-300 mb-1">APPLICATION NAME</label>
                    <input
                      type="text"
                      value={deployForm.name}
                      onChange={(e) => setDeployForm(prev => ({...prev, name: e.target.value}))}
                      className="w-full bg-black border border-white text-white px-3 py-2 font-mono text-sm"
                      placeholder="my-app"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-mono text-gray-300 mb-1">NAMESPACE</label>
                    <input
                      type="text"
                      value={deployForm.namespace}
                      onChange={(e) => setDeployForm(prev => ({...prev, namespace: e.target.value}))}
                      className="w-full bg-black border border-white text-white px-3 py-2 font-mono text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-mono text-gray-300 mb-1">REPLICAS</label>
                    <input
                      type="number"
                      min="1"
                      value={deployForm.replicas}
                      onChange={(e) => setDeployForm(prev => ({...prev, replicas: parseInt(e.target.value)}))}
                      className="w-full bg-black border border-white text-white px-3 py-2 font-mono text-sm"
                    />
                  </div>
                  
                  {/* Resource Limits */}
                  <div>
                    <label className="block text-sm font-mono text-gray-300 mb-2">RESOURCE LIMITS</label>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <input
                        type="text"
                        placeholder="CPU REQUEST"
                        value={deployForm.resources.cpu_request}
                        onChange={(e) => setDeployForm(prev => ({
                          ...prev,
                          resources: {...prev.resources, cpu_request: e.target.value}
                        }))}
                        className="bg-black border border-white text-white px-2 py-1 font-mono"
                      />
                      <input
                        type="text"
                        placeholder="CPU LIMIT"
                        value={deployForm.resources.cpu_limit}
                        onChange={(e) => setDeployForm(prev => ({
                          ...prev,
                          resources: {...prev.resources, cpu_limit: e.target.value}
                        }))}
                        className="bg-black border border-white text-white px-2 py-1 font-mono"
                      />
                      <input
                        type="text"
                        placeholder="MEMORY REQUEST"
                        value={deployForm.resources.memory_request}
                        onChange={(e) => setDeployForm(prev => ({
                          ...prev,
                          resources: {...prev.resources, memory_request: e.target.value}
                        }))}
                        className="bg-black border border-white text-white px-2 py-1 font-mono"
                      />
                      <input
                        type="text"
                        placeholder="MEMORY LIMIT"
                        value={deployForm.resources.memory_limit}
                        onChange={(e) => setDeployForm(prev => ({
                          ...prev,
                          resources: {...prev.resources, memory_limit: e.target.value}
                        }))}
                        className="bg-black border border-white text-white px-2 py-1 font-mono"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Deploy Button */}
            <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-white">
              <button
                onClick={() => setShowDeployModal(false)}
                className="px-4 py-2 border border-red-400 text-red-400 hover:bg-red-400 hover:text-black transition-colors font-mono text-sm tracking-wider"
              >
                CANCEL
              </button>
              <button
                onClick={handleDeploy}
                disabled={!selectedTemplate || !selectedImage || !deployForm.name || deploying}
                className="px-6 py-2 border border-green-400 text-green-400 hover:bg-green-400 hover:text-black disabled:border-gray-600 disabled:text-gray-600 transition-colors font-mono text-sm flex items-center space-x-2 tracking-wider"
              >
                {deploying && <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full" />}
                <span>{deploying ? 'DEPLOYING...' : 'DEPLOY APPLICATION'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default EnhancedDeploymentsTab;
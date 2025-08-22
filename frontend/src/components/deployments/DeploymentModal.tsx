import { useState, useEffect, useCallback, type FC } from 'react';
import { X, Container, Database, Server, Globe, Shield, Activity } from 'lucide-react';
import { ContainerImage } from '@/types';
import { API_ENDPOINTS } from '@constants';
import useModalKeyboard from '@hooks/useModalKeyboard';
import useDeploymentStore from '@stores/deploymentStore';
import CustomSelector from '@components/common/CustomSelector';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';


interface DeploymentModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  preselectedImage?: ContainerImage | null;
}

const DeploymentModal: FC<DeploymentModalProps> = ({ 
  isOpen = false, 
  onClose,
  preselectedImage
}) => {
  const { images, fetchImages } = useDeploymentStore();
  
  // Deployment states
  const [selectedImage, setSelectedImage] = useState<ContainerImage | null>(null);
  
  const [deploying, setDeploying] = useState(false);
  const [currentStep, setCurrentStep] = useState<'configure' | 'preview' | 'committed'>('configure');
  const [yamlPreview, setYamlPreview] = useState<string>('');
  const [deploymentId, setDeploymentId] = useState<string>('');

  // Deployment form state
  const [deployForm, setDeployForm] = useState({
    name: '',
    namespace: 'base-infra',
    replicas: 1,
    port: 8080,
    resources: {
      cpu_request: '10m',
      cpu_limit: '50m',
      memory_request: '32Mi',
      memory_limit: '64Mi'
    },
    storage: {
      enabled: false,
      size: '20Gi',
      accessMode: 'ReadWriteOnce',
      mountPath: '/data'
    },
    healthCheck: {
      enabled: false,
      type: 'http',
      path: '/health',
      initialDelaySeconds: 30,
      timeoutSeconds: 5,
      periodSeconds: 10,
      successThreshold: 1,
      failureThreshold: 3
    },
    ingress: {
      enabled: false,
      host: '',
      path: '/'
    },
    autoscaling: {
      enabled: false,
      minReplicas: 1,
      maxReplicas: 10,
      targetCPUUtilization: 80
    },
    service: {
      type: 'ClusterIP',
      port: 80,
      targetPort: 8080
    },
    deployment: {
      strategy: 'RollingUpdate',
      maxSurge: '25%',
      maxUnavailable: '25%'
    },
    security: {
      runAsNonRoot: true,
      runAsUser: 1000,
      runAsGroup: 1000,
      readOnlyRootFilesystem: false,
      allowPrivilegeEscalation: false
    },
    labels: {} as Record<string, string>,
    annotations: {} as Record<string, string>,
    environment: {} as Record<string, string>
  });

  useEffect(() => {
    if (isOpen) {
      fetchImages();
      if (preselectedImage) {
        setSelectedImage(preselectedImage);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, preselectedImage]);

  // Form field updaters for controlled inputs (selectors and checkboxes only)
  const updateFormField = useCallback((field: string, value: any) => {
    setDeployForm(prev => ({ ...prev, [field]: value }));
  }, []);

  const updateStorageField = useCallback((field: string, value: any) => {
    setDeployForm(prev => ({
      ...prev,
      storage: { ...prev.storage, [field]: value }
    }));
  }, []);

  const updateHealthCheckField = useCallback((field: string, value: any) => {
    setDeployForm(prev => ({
      ...prev,
      healthCheck: { ...prev.healthCheck, [field]: value }
    }));
  }, []);

  const updateIngressField = useCallback((field: string, value: any) => {
    setDeployForm(prev => ({
      ...prev,
      ingress: { ...prev.ingress, [field]: value }
    }));
  }, []);

  const updateAutoscalingField = useCallback((field: string, value: any) => {
    setDeployForm(prev => ({
      ...prev,
      autoscaling: { ...prev.autoscaling, [field]: value }
    }));
  }, []);

  const updateServiceField = useCallback((field: string, value: any) => {
    setDeployForm(prev => ({
      ...prev,
      service: { ...prev.service, [field]: value }
    }));
  }, []);

  const updateDeploymentField = useCallback((field: string, value: any) => {
    setDeployForm(prev => ({
      ...prev,
      deployment: { ...prev.deployment, [field]: value }
    }));
  }, []);

  const updateSecurityField = useCallback((field: string, value: any) => {
    setDeployForm(prev => ({
      ...prev,
      security: { ...prev.security, [field]: value }
    }));
  }, []);



  // Step 1: Generate and preview YAML manifest
  const handleGeneratePreview = async () => {
    if (!selectedImage || !deployForm.name) return;

    try {
      setDeploying(true);
      
      // Generate manifest from configuration
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
            storage: deployForm.storage,
            healthCheck: deployForm.healthCheck,
            ingress: deployForm.ingress,
            autoscaling: deployForm.autoscaling,
            service: deployForm.service,
            deployment: deployForm.deployment,
            security: deployForm.security,
            labels: deployForm.labels,
            annotations: deployForm.annotations
          },
          resource_type: "Full",
          options: {
            service: true,
            ingress: deployForm.ingress?.enabled || false,
            autoscaling: deployForm.autoscaling?.enabled || false,
            storage: deployForm.storage?.enabled || false,
            deployment_id: `dep-${Date.now().toString(36)}`, // Temporary ID for preview
            service_type: 'backend' // Default service type
          }
        })
      });

      if (!manifestResponse.ok) {
        throw new Error('Failed to generate manifest');
      }

      const manifestData = await manifestResponse.json();
      setYamlPreview(manifestData.manifest);
      setCurrentStep('preview');
    } catch (error) {
      console.error('Failed to generate preview:', error);
      alert('Failed to generate YAML preview');
    } finally {
      setDeploying(false);
    }
  };

  // Step 2: Commit to git (create deployment record)
  const handleCommitToGit = async () => {
    if (!selectedImage || !deployForm.name) return;

    try {
      setDeploying(true);
      
      // Create deployment using new API
      const createResponse = await fetch(API_ENDPOINTS.DEPLOYMENTS.CREATE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: deployForm.name,
          namespace: deployForm.namespace,
          image: selectedImage.fullName,
          registry_id: selectedImage.registry || 'dockerhub',
          replicas: deployForm.replicas,
          resources: {
            limits: {
              cpu: deployForm.resources.cpu_limit,
              memory: deployForm.resources.memory_limit
            },
            requests: {
              cpu: deployForm.resources.cpu_request,
              memory: deployForm.resources.memory_request
            }
          },
          environment: deployForm.environment || {},
          service_type: 'backend' // Default service type
        })
      });

      if (createResponse.ok) {
        const deployment = await createResponse.json();
        setDeploymentId(deployment.id);
        setCurrentStep('committed');
      } else {
        throw new Error('Failed to create deployment');
      }
    } catch (error) {
      console.error('Failed to commit to git:', error);
      alert('Failed to commit deployment to git');
    } finally {
      setDeploying(false);
    }
  };

  // Step 3: Apply to Kubernetes cluster (manual step)
  const handleApplyToCluster = async () => {
    if (!deploymentId) return;

    try {
      setDeploying(true);
      
      const applyResponse = await fetch(`${API_ENDPOINTS.DEPLOYMENTS.BASE}/${deploymentId}/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applied_by: 'user' // Could be enhanced to get actual user info
        })
      });

      if (applyResponse.ok) {
        // Success - close modal and reset
        onClose?.();
        resetModal();
      } else {
        throw new Error('Failed to apply deployment');
      }
    } catch (error) {
      console.error('Failed to apply to cluster:', error);
      alert('Failed to apply deployment to Kubernetes cluster');
    } finally {
      setDeploying(false);
    }
  };

  // Reset modal to initial state
  const resetModal = () => {
    setCurrentStep('configure');
    setYamlPreview('');
    setDeploymentId('');
    setSelectedImage(null);
    setDeployForm({
      name: '',
      namespace: 'base-infra',
      replicas: 1,
      port: 8080,
      resources: {
        cpu_request: '10m',
        cpu_limit: '50m',
        memory_request: '32Mi',
        memory_limit: '64Mi'
      },
      storage: {
        enabled: false,
        size: '20Gi',
        accessMode: 'ReadWriteOnce',
        mountPath: '/data'
      },
      healthCheck: {
        enabled: false,
        type: 'http',
        path: '/health',
        initialDelaySeconds: 30,
        timeoutSeconds: 5,
        periodSeconds: 10,
        successThreshold: 1,
        failureThreshold: 3
      },
      ingress: {
        enabled: false,
        host: '',
        path: '/'
      },
      autoscaling: {
        enabled: false,
        minReplicas: 1,
        maxReplicas: 10,
        targetCPUUtilization: 80
      },
      service: {
        type: 'ClusterIP',
        port: 80,
        targetPort: 8080
      },
      deployment: {
        strategy: 'RollingUpdate',
        maxSurge: '25%',
        maxUnavailable: '25%'
      },
      security: {
        runAsNonRoot: true,
        runAsUser: 1000,
        runAsGroup: 1000,
        readOnlyRootFilesystem: false,
        allowPrivilegeEscalation: false
      },
      labels: {} as Record<string, string>,
      annotations: {} as Record<string, string>,
      environment: {} as Record<string, string>
    });
  };

  // Unified deploy handler that delegates to appropriate step
  const handleDeploy = () => {
    switch (currentStep) {
      case 'configure':
        handleGeneratePreview();
        break;
      case 'preview':
        handleCommitToGit();
        break;
      case 'committed':
        handleApplyToCluster();
        break;
    }
  };

  // Handle modal close with reset
  const handleClose = () => {
    resetModal();
    onClose?.();
  };

  const { createClickOutsideHandler, preventClickThrough } = useModalKeyboard({
    isOpen,
    onClose: handleClose,
    onSubmit: handleDeploy,
    canSubmit: Boolean(selectedImage && deployForm.name && !deploying),
    modalId: 'deploy-modal'
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50" onClick={createClickOutsideHandler(handleClose)}>
      <div id="deploy-modal" className="bg-black border border-white max-w-7xl w-full mx-4 max-h-[95vh] flex flex-col" onClick={preventClickThrough}>
        {/* Fixed Header */}
        <div className="flex items-center justify-between p-8 pb-4 border-b border-white/30">
          <div>
            <h3 className="text-2xl font-bold text-white font-mono tracking-wider">DEPLOY NEW APPLICATION</h3>
            <div className="flex items-center space-x-4 mt-2">
              <div className={`text-xs font-mono px-2 py-1 border ${currentStep === 'configure' ? 'border-blue-400 text-blue-400' : 'border-green-400 text-green-400'}`}>
                1. CONFIGURE
              </div>
              <div className={`text-xs font-mono px-2 py-1 border ${currentStep === 'preview' ? 'border-blue-400 text-blue-400' : currentStep === 'committed' ? 'border-green-400 text-green-400' : 'border-gray-600 text-gray-600'}`}>
                2. PREVIEW
              </div>
              <div className={`text-xs font-mono px-2 py-1 border ${currentStep === 'committed' ? 'border-blue-400 text-blue-400' : 'border-gray-600 text-gray-600'}`}>
                3. APPLY
              </div>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 border border-red-400 text-red-400 hover:bg-red-400 hover:text-black transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-8 py-4">

        {/* Step-based Content */}
        <div className={currentStep === 'configure' ? 'block' : 'hidden'}>
          <>
            {/* Container Image Selection at Top */}
            <div className="mb-6 pb-6 border-b border-white/30">
              <label className="block text-lg font-bold text-white mb-3 font-mono tracking-wider">SELECT CONTAINER IMAGE</label>
              {preselectedImage ? (
                <div className="p-4 border border-green-400/20 bg-green-400/5">
                  <div className="text-sm font-mono text-green-400">PRESELECTED IMAGE</div>
                  <div className="text-white font-mono text-lg">{preselectedImage.repository}:{preselectedImage.tag}</div>
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
                  size="lg"
                  variant="detailed"
                  maxHeight="max-h-64"
                />
              )}
            </div>

            {/* Configuration Form in 2 Columns */}
            <div className="space-y-8">
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column */}
            <div className="space-y-8">
              {/* Basic Configuration */}
              <div className="bg-gray-900/50 border border-gray-700 rounded-sm p-4">
                <div className="bg-blue-600/20 border-l-4 border-blue-400 px-3 py-2 mb-4">
                  <h3 className="text-sm font-mono text-blue-400 font-bold tracking-wider">BASIC CONFIGURATION</h3>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-mono text-gray-300 mb-1 uppercase tracking-wider">Application Name</label>
                    <input
                      type="text"
                      placeholder="my-app"
                      className="w-full bg-black border border-gray-600 focus:border-blue-400 text-white px-3 py-2 font-mono text-sm transition-colors"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-mono text-gray-300 mb-1 uppercase tracking-wider">Namespace</label>
                      <CustomSelector
                        value={deployForm.namespace}
                        options={[
                          { value: 'base-infra', label: 'BASE-INFRA' },
                          { value: 'default', label: 'DEFAULT' },
                          { value: 'kube-system', label: 'KUBE-SYSTEM' }
                        ]}
                        onChange={(value) => updateFormField('namespace', value)}
                        icon={Database}
                        size="sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-mono text-gray-300 mb-1 uppercase tracking-wider">Replicas</label>
                      <input
                        type="number"
                        min="1"
                        max="100"
                        placeholder="1"
                        className="w-full bg-black border border-gray-600 focus:border-blue-400 text-white px-3 py-2 font-mono text-sm transition-colors"
                        onInput={(e) => {
                          const target = e.target as HTMLInputElement;
                          target.value = target.value.replace(/[^0-9]/g, '');
                        }}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-gray-300 mb-1 uppercase tracking-wider">Container Port</label>
                    <input
                      type="number"
                      min="1"
                      max="65535"
                      placeholder="8080"
                      className="w-full bg-black border border-gray-600 focus:border-blue-400 text-white px-3 py-2 font-mono text-sm transition-colors"
                      onInput={(e) => {
                        const target = e.target as HTMLInputElement;
                        const value = target.value.replace(/[^0-9]/g, '');
                        if (value && (parseInt(value) < 1 || parseInt(value) > 65535)) {
                          target.setCustomValidity('Port must be between 1 and 65535');
                        } else {
                          target.setCustomValidity('');
                        }
                        target.value = value;
                      }}
                    />
                  </div>
                </div>
              </div>
              {/* Resource Limits */}
              <div className="bg-gray-900/50 border border-gray-700 rounded-sm p-4">
                <div className="bg-green-600/20 border-l-4 border-green-400 px-3 py-2 mb-4">
                  <h3 className="text-sm font-mono text-green-400 font-bold tracking-wider">RESOURCE LIMITS</h3>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-mono text-gray-300 mb-1 uppercase tracking-wider">CPU Request</label>
                    <input
                      type="text"
                      placeholder="10m"
                      className="w-full bg-black border border-gray-600 focus:border-green-400 text-white px-3 py-2 font-mono text-sm transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-gray-300 mb-1 uppercase tracking-wider">CPU Limit</label>
                    <input
                      type="text"
                      placeholder="50m"
                      className="w-full bg-black border border-gray-600 focus:border-green-400 text-white px-3 py-2 font-mono text-sm transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-gray-300 mb-1 uppercase tracking-wider">Memory Request</label>
                    <input
                      type="text"
                      placeholder="32Mi"
                      className="w-full bg-black border border-gray-600 focus:border-green-400 text-white px-3 py-2 font-mono text-sm transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-gray-300 mb-1 uppercase tracking-wider">Memory Limit</label>
                    <input
                      type="text"
                      placeholder="64Mi"
                      className="w-full bg-black border border-gray-600 focus:border-green-400 text-white px-3 py-2 font-mono text-sm transition-colors"
                    />
                  </div>
                </div>
                <div className="mt-3 text-xs text-gray-400 font-mono">
                  CPU: m=millicores (1000m=1 core) | Memory: Mi/Gi (Mi=MiB, Gi=GiB)
                </div>
              </div>

              {/* Environment Variables */}
              <div className="bg-gray-900/50 border border-gray-700 rounded-sm p-4">
                <div className="bg-cyan-600/20 border-l-4 border-cyan-400 px-3 py-2 mb-4">
                  <h3 className="text-sm font-mono text-cyan-400 font-bold tracking-wider">ENVIRONMENT VARIABLES</h3>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-mono text-gray-300 mb-2 uppercase tracking-wider">From Secrets</label>
                    <div className="grid grid-cols-3 gap-2">
                      <input
                        type="text"
                        placeholder="VAR_NAME"
                        className="bg-black border border-gray-600 focus:border-cyan-400 text-white px-2 py-1 font-mono text-xs transition-colors"
                      />
                      <input
                        type="text"
                        placeholder="secret-name"
                        className="bg-black border border-gray-600 focus:border-cyan-400 text-white px-2 py-1 font-mono text-xs transition-colors"
                      />
                      <input
                        type="text"
                        placeholder="key"
                        className="bg-black border border-gray-600 focus:border-cyan-400 text-white px-2 py-1 font-mono text-xs transition-colors"
                      />
                    </div>
                    <button className="mt-2 px-2 py-1 border border-cyan-400 text-cyan-400 hover:bg-cyan-400 hover:text-black transition-colors font-mono text-xs">
                      + Secret
                    </button>
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-gray-300 mb-2 uppercase tracking-wider">Direct Values</label>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="VAR_NAME"
                        className="bg-black border border-gray-600 focus:border-cyan-400 text-white px-2 py-1 font-mono text-xs transition-colors"
                      />
                      <input
                        type="text"
                        placeholder="value"
                        className="bg-black border border-gray-600 focus:border-cyan-400 text-white px-2 py-1 font-mono text-xs transition-colors"
                      />
                    </div>
                    <button className="mt-2 px-2 py-1 border border-cyan-400 text-cyan-400 hover:bg-cyan-400 hover:text-black transition-colors font-mono text-xs">
                      + Variable
                    </button>
                  </div>
                </div>
              </div>

              {/* Volume Mounts */}
              <div className="bg-gray-900/50 border border-gray-700 rounded-sm p-4">
                <div className="bg-orange-600/20 border-l-4 border-orange-400 px-3 py-2 mb-4">
                  <h3 className="text-sm font-mono text-orange-400 font-bold tracking-wider">VOLUME MOUNTS</h3>
                </div>
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Name</label>
                      <input
                        type="text"
                        placeholder="config"
                        className="w-full bg-black border border-gray-600 focus:border-orange-400 text-white px-2 py-1 font-mono text-xs transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Path</label>
                      <input
                        type="text"
                        placeholder="/app/config"
                        className="w-full bg-black border border-gray-600 focus:border-orange-400 text-white px-2 py-1 font-mono text-xs transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">SubPath</label>
                      <input
                        type="text"
                        placeholder="(optional)"
                        className="w-full bg-black border border-gray-600 focus:border-orange-400 text-white px-2 py-1 font-mono text-xs transition-colors"
                      />
                    </div>
                  </div>
                  <button className="px-2 py-1 border border-orange-400 text-orange-400 hover:bg-orange-400 hover:text-black transition-colors font-mono text-xs">
                    + Mount
                  </button>
                  <div className="text-xs text-gray-400 font-mono">
                    Common: /etc/timezone, /app/config, /data
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-8">
              {/* Persistent Storage */}
              <div className="bg-gray-900/50 border border-gray-700 rounded-sm p-4">
                <div className="bg-purple-600/20 border-l-4 border-purple-400 px-3 py-2 mb-4">
                  <h3 className="text-sm font-mono text-purple-400 font-bold tracking-wider">PERSISTENT STORAGE</h3>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="storage"
                      checked={deployForm.storage.enabled}
                      onChange={(e) => updateStorageField('enabled', e.target.checked)}
                      className="w-4 h-4 text-purple-400 bg-black border-gray-600 rounded focus:ring-purple-400"
                    />
                    <label htmlFor="storage" className="text-sm font-mono text-gray-300">Enable Persistent Volume</label>
                  </div>
                  {deployForm.storage.enabled && (
                    <div className="space-y-3 pl-7 border-l-2 border-purple-400/30">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-mono text-gray-300 mb-1 uppercase tracking-wider">Size</label>
                          <input
                            type="text"
                            placeholder="20Gi"
                            className="w-full bg-black border border-gray-600 focus:border-purple-400 text-white px-3 py-2 font-mono text-sm transition-colors"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-mono text-gray-300 mb-1 uppercase tracking-wider">Access Mode</label>
                          <CustomSelector
                            value={deployForm.storage.accessMode}
                            options={[
                              { value: 'ReadWriteOnce', label: 'RWO' },
                              { value: 'ReadOnlyMany', label: 'ROX' },
                              { value: 'ReadWriteMany', label: 'RWX' }
                            ]}
                            onChange={(value) => updateStorageField('accessMode', value)}
                            icon={Shield}
                            size="sm"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-mono text-gray-300 mb-1 uppercase tracking-wider">Mount Path</label>
                        <input
                          type="text"
                          placeholder="/data"
                          className="w-full bg-black border border-gray-600 focus:border-purple-400 text-white px-3 py-2 font-mono text-sm transition-colors"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Health Check Configuration */}
              <div className="bg-gray-900/50 border border-gray-700 rounded-sm p-4">
                <div className="bg-red-600/20 border-l-4 border-red-400 px-3 py-2 mb-4">
                  <h3 className="text-sm font-mono text-red-400 font-bold tracking-wider">HEALTH CHECKS</h3>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="healthcheck"
                      checked={deployForm.healthCheck.enabled}
                      onChange={(e) => updateHealthCheckField('enabled', e.target.checked)}
                      className="w-4 h-4 text-red-400 bg-black border-gray-600 rounded focus:ring-red-400"
                    />
                    <label htmlFor="healthcheck" className="text-sm font-mono text-gray-300">Enable Health Checks</label>
                  </div>
                  {deployForm.healthCheck.enabled && (
                    <div className="space-y-3 pl-7 border-l-2 border-red-400/30">
                      <div className="grid grid-cols-2 gap-3">
                        <CustomSelector
                          value={deployForm.healthCheck.type}
                          options={[
                            { value: 'http', label: 'HTTP' },
                            { value: 'exec', label: 'EXEC' },
                            { value: 'tcp', label: 'TCP' }
                          ]}
                          onChange={(value) => updateHealthCheckField('type', value)}
                          icon={Activity}
                          size="sm"
                        />
                        <input
                          type="text"
                          placeholder="/health"
                          className="bg-black border border-gray-600 focus:border-red-400 text-white px-3 py-2 font-mono text-sm transition-colors"
                        />
                      </div>
                      <div className="grid grid-cols-5 gap-1">
                        <div>
                          <label className="block text-xs text-gray-400 mb-1">Delay</label>
                          <input
                            type="number"
                            min="0"
                            placeholder="30"
                            className="w-full bg-black border border-gray-600 focus:border-red-400 text-white px-1 py-1 font-mono text-xs transition-colors"
                            onInput={(e) => {
                              const target = e.target as HTMLInputElement;
                              target.value = target.value.replace(/[^0-9]/g, '');
                            }}
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-400 mb-1">Timeout</label>
                          <input
                            type="number"
                            min="1"
                            placeholder="5"
                            className="w-full bg-black border border-gray-600 focus:border-red-400 text-white px-1 py-1 font-mono text-xs transition-colors"
                            onInput={(e) => {
                              const target = e.target as HTMLInputElement;
                              target.value = target.value.replace(/[^0-9]/g, '');
                            }}
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-400 mb-1">Period</label>
                          <input
                            type="number"
                            min="1"
                            placeholder="10"
                            className="w-full bg-black border border-gray-600 focus:border-red-400 text-white px-1 py-1 font-mono text-xs transition-colors"
                            onInput={(e) => {
                              const target = e.target as HTMLInputElement;
                              target.value = target.value.replace(/[^0-9]/g, '');
                            }}
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-400 mb-1">Success</label>
                          <input
                            type="number"
                            min="1"
                            placeholder="1"
                            className="w-full bg-black border border-gray-600 focus:border-red-400 text-white px-1 py-1 font-mono text-xs transition-colors"
                            onInput={(e) => {
                              const target = e.target as HTMLInputElement;
                              target.value = target.value.replace(/[^0-9]/g, '');
                            }}
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-400 mb-1">Failure</label>
                          <input
                            type="number"
                            min="1"
                            placeholder="3"
                            className="w-full bg-black border border-gray-600 focus:border-red-400 text-white px-1 py-1 font-mono text-xs transition-colors"
                            onInput={(e) => {
                              const target = e.target as HTMLInputElement;
                              target.value = target.value.replace(/[^0-9]/g, '');
                            }}
                          />
                        </div>
                      </div>
                      <div className="text-xs text-gray-400 font-mono">
                        All values in seconds. HTTP path example: /api/health
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Ingress Configuration */}
              <div className="bg-gray-900/50 border border-gray-700 rounded-sm p-4">
                <div className="bg-indigo-600/20 border-l-4 border-indigo-400 px-3 py-2 mb-4">
                  <h3 className="text-sm font-mono text-indigo-400 font-bold tracking-wider">INGRESS</h3>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="ingress"
                      checked={deployForm.ingress.enabled}
                      onChange={(e) => updateIngressField('enabled', e.target.checked)}
                      className="w-4 h-4 text-indigo-400 bg-black border-gray-600 rounded focus:ring-indigo-400"
                    />
                    <label htmlFor="ingress" className="text-sm font-mono text-gray-300">Enable External Access</label>
                  </div>
                  {deployForm.ingress.enabled && (
                    <div className="grid grid-cols-2 gap-3 pl-7 border-l-2 border-indigo-400/30">
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Host</label>
                        <input
                          type="text"
                          placeholder="app.domain.com"
                          className="w-full bg-black border border-gray-600 focus:border-indigo-400 text-white px-2 py-1 font-mono text-xs transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Path</label>
                        <input
                          type="text"
                          placeholder="/"
                          className="w-full bg-black border border-gray-600 focus:border-indigo-400 text-white px-2 py-1 font-mono text-xs transition-colors"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Autoscaling Configuration */}
              <div className="bg-gray-900/50 border border-gray-700 rounded-sm p-4">
                <div className="bg-yellow-600/20 border-l-4 border-yellow-400 px-3 py-2 mb-4">
                  <h3 className="text-sm font-mono text-yellow-400 font-bold tracking-wider">AUTOSCALING</h3>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="autoscaling"
                      checked={deployForm.autoscaling.enabled}
                      onChange={(e) => updateAutoscalingField('enabled', e.target.checked)}
                      className="w-4 h-4 text-yellow-400 bg-black border-gray-600 rounded focus:ring-yellow-400"
                    />
                    <label htmlFor="autoscaling" className="text-sm font-mono text-gray-300">Enable Auto Scaling</label>
                  </div>
                  {deployForm.autoscaling.enabled && (
                    <div className="grid grid-cols-3 gap-2 pl-7 border-l-2 border-yellow-400/30">
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Min</label>
                        <input
                          type="number"
                          placeholder="1"
                          min="1"
                          className="w-full bg-black border border-gray-600 focus:border-yellow-400 text-white px-2 py-1 font-mono text-xs transition-colors"
                          onInput={(e) => {
                            const target = e.target as HTMLInputElement;
                            target.value = target.value.replace(/[^0-9]/g, '');
                          }}
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Max</label>
                        <input
                          type="number"
                          placeholder="10"
                          min="1"
                          className="w-full bg-black border border-gray-600 focus:border-yellow-400 text-white px-2 py-1 font-mono text-xs transition-colors"
                          onInput={(e) => {
                            const target = e.target as HTMLInputElement;
                            target.value = target.value.replace(/[^0-9]/g, '');
                          }}
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">CPU %</label>
                        <input
                          type="number"
                          placeholder="80"
                          min="1"
                          max="100"
                          className="w-full bg-black border border-gray-600 focus:border-yellow-400 text-white px-2 py-1 font-mono text-xs transition-colors"
                          onInput={(e) => {
                            const target = e.target as HTMLInputElement;
                            const value = target.value.replace(/[^0-9]/g, '');
                            if (value && (parseInt(value) < 1 || parseInt(value) > 100)) {
                              target.setCustomValidity('CPU target must be between 1 and 100');
                            } else {
                              target.setCustomValidity('');
                            }
                            target.value = value;
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Service Configuration & Deployment Strategy */}
              <div className="bg-gray-900/50 border border-gray-700 rounded-sm p-4">
                <div className="bg-teal-600/20 border-l-4 border-teal-400 px-3 py-2 mb-4">
                  <h3 className="text-sm font-mono text-teal-400 font-bold tracking-wider">SERVICE & DEPLOYMENT</h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono text-gray-300 mb-1 uppercase tracking-wider">Service Type</label>
                    <CustomSelector
                      value={deployForm.service.type}
                      options={[
                        { value: 'ClusterIP', label: 'ClusterIP' },
                        { value: 'NodePort', label: 'NodePort' },
                        { value: 'LoadBalancer', label: 'LoadBalancer' }
                      ]}
                      onChange={(value) => updateServiceField('type', value)}
                      icon={Globe}
                      size="xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-gray-300 mb-1 uppercase tracking-wider">Strategy</label>
                    <CustomSelector
                      value={deployForm.deployment.strategy}
                      options={[
                        { value: 'RollingUpdate', label: 'Rolling' },
                        { value: 'Recreate', label: 'Recreate' }
                      ]}
                      onChange={(value) => updateDeploymentField('strategy', value)}
                      icon={Server}
                      size="xs"
                    />
                  </div>
                </div>
              </div>

              {/* Rolling Update Parameters */}
              {deployForm.deployment.strategy === 'RollingUpdate' && (
                <div className="bg-gray-900/50 border border-gray-700 rounded-sm p-4">
                  <div className="bg-pink-600/20 border-l-4 border-pink-400 px-3 py-2 mb-4">
                    <h3 className="text-sm font-mono text-pink-400 font-bold tracking-wider">ROLLING UPDATE</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-mono text-gray-300 mb-1 uppercase tracking-wider">Max Surge</label>
                      <input
                        type="text"
                        placeholder="25%"
                        className="w-full bg-black border border-gray-600 focus:border-pink-400 text-white px-2 py-1 font-mono text-xs transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-mono text-gray-300 mb-1 uppercase tracking-wider">Max Unavailable</label>
                      <input
                        type="text"
                        placeholder="25%"
                        className="w-full bg-black border border-gray-600 focus:border-pink-400 text-white px-2 py-1 font-mono text-xs transition-colors"
                      />
                    </div>
                  </div>
                  <div className="mt-3 text-xs text-gray-400 font-mono">
                    Values can be absolute (e.g. 2) or percentage (e.g. 25%)
                  </div>
                </div>
              )}

              {/* Security Context */}
              <div className="bg-gray-900/50 border border-gray-700 rounded-sm p-4">
                <div className="bg-emerald-600/20 border-l-4 border-emerald-400 px-3 py-2 mb-4">
                  <h3 className="text-sm font-mono text-emerald-400 font-bold tracking-wider">SECURITY CONTEXT</h3>
                </div>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-mono text-gray-300 mb-1 uppercase tracking-wider">User ID</label>
                      <input
                        type="number"
                        min="0"
                        placeholder="1000"
                        className="w-full bg-black border border-gray-600 focus:border-emerald-400 text-white px-3 py-2 font-mono text-sm transition-colors"
                        onInput={(e) => {
                          const target = e.target as HTMLInputElement;
                          target.value = target.value.replace(/[^0-9]/g, '');
                        }}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-mono text-gray-300 mb-1 uppercase tracking-wider">Group ID</label>
                      <input
                        type="number"
                        min="0"
                        placeholder="1000"
                        className="w-full bg-black border border-gray-600 focus:border-emerald-400 text-white px-3 py-2 font-mono text-sm transition-colors"
                        onInput={(e) => {
                          const target = e.target as HTMLInputElement;
                          target.value = target.value.replace(/[^0-9]/g, '');
                        }}
                      />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        id="runAsNonRoot"
                        checked={deployForm.security.runAsNonRoot}
                        onChange={(e) => updateSecurityField('runAsNonRoot', e.target.checked)}
                        className="w-4 h-4 text-emerald-400 bg-black border-gray-600 rounded focus:ring-emerald-400"
                      />
                      <label htmlFor="runAsNonRoot" className="text-sm font-mono text-gray-300">Run as Non-Root</label>
                    </div>
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        id="readOnlyRoot"
                        checked={deployForm.security.readOnlyRootFilesystem}
                        onChange={(e) => updateSecurityField('readOnlyRootFilesystem', e.target.checked)}
                        className="w-4 h-4 text-emerald-400 bg-black border-gray-600 rounded focus:ring-emerald-400"
                      />
                      <label htmlFor="readOnlyRoot" className="text-sm font-mono text-gray-300">Read-Only Root Filesystem</label>
                    </div>
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        id="allowPrivEsc"
                        checked={!deployForm.security.allowPrivilegeEscalation}
                        onChange={(e) => updateSecurityField('allowPrivilegeEscalation', !e.target.checked)}
                        className="w-4 h-4 text-emerald-400 bg-black border-gray-600 rounded focus:ring-emerald-400"
                      />
                      <label htmlFor="allowPrivEsc" className="text-sm font-mono text-gray-300">Prevent Privilege Escalation</label>
                    </div>
                  </div>
                  <div className="text-xs text-gray-400 font-mono">
                    Standard non-root: UID/GID 1000
                  </div>
                </div>
              </div>
            </div>
          </div>
            </div>
          </>
        </div>

        {/* YAML Preview Step */}
        <div className={currentStep === 'preview' ? 'block' : 'hidden'}>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-bold text-white font-mono tracking-wider">YAML PREVIEW</h4>
              <button
                onClick={() => setCurrentStep('configure')}
                className="px-3 py-1 border border-gray-400 text-gray-400 hover:bg-gray-400 hover:text-black transition-colors font-mono text-xs"
              >
                ← BACK TO CONFIG
              </button>
            </div>
            <div className="bg-gray-900 border border-white rounded-sm overflow-hidden">
              <SyntaxHighlighter
                language="yaml"
                style={vscDarkPlus}
                customStyle={{
                  margin: 0,
                  padding: '16px',
                  background: '#1a1a1a',
                  fontSize: '12px',
                  maxHeight: '384px',
                  overflow: 'auto'
                }}
                wrapLongLines={true}
              >
                {yamlPreview || '# YAML manifest will be generated here...'}
              </SyntaxHighlighter>
            </div>
            <div className="text-sm text-gray-400 font-mono">
              Review the generated Kubernetes manifest. Click "COMMIT TO GIT" to save this deployment configuration.
            </div>
          </div>
        </div>

        {/* Committed Step */}
        <div className={currentStep === 'committed' ? 'block' : 'hidden'}>
          <div className="space-y-6">
            <div className="text-center p-8">
              <div className="text-green-400 text-6xl mb-4">✓</div>
              <h4 className="text-lg font-bold text-white font-mono tracking-wider mb-2">DEPLOYMENT COMMITTED TO GIT</h4>
              <p className="text-gray-300 font-mono text-sm mb-4">
                Deployment ID: <span className="text-blue-400">{deploymentId}</span>
              </p>
              <p className="text-gray-400 font-mono text-xs max-w-lg mx-auto leading-relaxed">
                The deployment configuration has been committed to your GitOps repository. 
                To complete the deployment, click "APPLY TO CLUSTER" to deploy the application to Kubernetes.
              </p>
            </div>
            <div className="bg-yellow-400/10 border border-yellow-400/30 p-4">
              <div className="text-yellow-400 font-mono text-sm font-bold mb-1">MANUAL APPLY REQUIRED</div>
              <div className="text-yellow-300 font-mono text-xs">
                This deployment uses the manual-only workflow. The manifests are committed to git but will only be applied to Kubernetes when you manually trigger the deployment.
              </div>
            </div>
          </div>
        </div>
        </div>

        {/* Fixed Footer */}
        <div className="flex justify-end space-x-3 p-8 pt-4 border-t border-white/30">
          <button
            onClick={handleClose}
            className="px-4 py-2 border border-red-400 text-red-400 hover:bg-red-400 hover:text-black transition-colors font-mono text-sm tracking-wider"
          >
            {currentStep === 'committed' ? 'CLOSE' : 'CANCEL'}
          </button>
          <button
            onClick={handleDeploy}
            disabled={(!selectedImage || !deployForm.name || deploying) && currentStep !== 'committed'}
            className="px-6 py-2 border border-green-400 text-green-400 hover:bg-green-400 hover:text-black disabled:border-gray-600 disabled:text-gray-600 transition-colors font-mono text-sm flex items-center space-x-2 tracking-wider"
          >
            {deploying && <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full" />}
            <span>
              {deploying
                ? currentStep === 'configure'
                  ? 'GENERATING...'
                  : currentStep === 'preview'
                  ? 'COMMITTING...'
                  : 'APPLYING...'
                : currentStep === 'configure'
                ? 'GENERATE PREVIEW'
                : currentStep === 'preview'
                ? 'COMMIT TO GIT'
                : 'APPLY TO CLUSTER'
              }
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeploymentModal;
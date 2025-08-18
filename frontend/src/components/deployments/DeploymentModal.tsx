import { useState, useEffect, type FC } from 'react';
import { X, Container, Database, Server, Globe, Shield, Activity } from 'lucide-react';
import { ContainerImage } from '@/types';
import { API_ENDPOINTS } from '@constants';
import useModalKeyboard from '@hooks/useModalKeyboard';
import useDeploymentStore from '@stores/deploymentStore';
import CustomSelector from '@components/common/CustomSelector';


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
  }, [isOpen, preselectedImage, fetchImages]);


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
        {currentStep === 'configure' && (
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
            <div className="space-y-6">
              <h4 className="text-lg font-bold text-white font-mono tracking-wider">CONFIGURATION</h4>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-6">
              {/* Basic Configuration */}
              <div>
                <h5 className="text-sm font-bold text-gray-300 mb-3 font-mono tracking-wider border-b border-white/20 pb-2">BASIC</h5>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-mono text-gray-400 mb-1">APPLICATION NAME</label>
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
                      <label className="block text-xs font-mono text-gray-400 mb-1">NAMESPACE</label>
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
                      <label className="block text-xs font-mono text-gray-400 mb-1">REPLICAS</label>
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
                    <label className="block text-xs font-mono text-gray-400 mb-1">CONTAINER PORT</label>
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
              </div>
              {/* Resource Limits */}
              <div>
                <h5 className="text-sm font-bold text-gray-300 mb-3 font-mono tracking-wider border-b border-white/20 pb-2">RESOURCES</h5>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-mono text-gray-400 mb-1">CPU REQUEST</label>
                    <input
                      type="text"
                      placeholder="e.g., 10m"
                      value={deployForm.resources.cpu_request}
                      onChange={(e) => setDeployForm(prev => ({
                        ...prev,
                        resources: {...prev.resources, cpu_request: e.target.value}
                      }))}
                      className="w-full bg-black border border-white text-white px-3 py-2 font-mono text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-gray-400 mb-1">CPU LIMIT</label>
                    <input
                      type="text"
                      placeholder="e.g., 50m"
                      value={deployForm.resources.cpu_limit}
                      onChange={(e) => setDeployForm(prev => ({
                        ...prev,
                        resources: {...prev.resources, cpu_limit: e.target.value}
                      }))}
                      className="w-full bg-black border border-white text-white px-3 py-2 font-mono text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-gray-400 mb-1">MEMORY REQUEST</label>
                    <input
                      type="text"
                      placeholder="e.g., 32Mi"
                      value={deployForm.resources.memory_request}
                      onChange={(e) => setDeployForm(prev => ({
                        ...prev,
                        resources: {...prev.resources, memory_request: e.target.value}
                      }))}
                      className="w-full bg-black border border-white text-white px-3 py-2 font-mono text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-gray-400 mb-1">MEMORY LIMIT</label>
                    <input
                      type="text"
                      placeholder="e.g., 64Mi"
                      value={deployForm.resources.memory_limit}
                      onChange={(e) => setDeployForm(prev => ({
                        ...prev,
                        resources: {...prev.resources, memory_limit: e.target.value}
                      }))}
                      className="w-full bg-black border border-white text-white px-3 py-2 font-mono text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Persistent Storage */}
              <div>
                <h5 className="text-sm font-bold text-gray-300 mb-3 font-mono tracking-wider border-b border-white/20 pb-2">STORAGE</h5>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="storage"
                      checked={deployForm.storage.enabled}
                      onChange={(e) => setDeployForm(prev => ({
                        ...prev,
                        storage: {...prev.storage, enabled: e.target.checked}
                      }))}
                      className="bg-black border border-white w-4 h-4"
                    />
                    <label htmlFor="storage" className="text-sm font-mono text-gray-300">ENABLE PERSISTENT VOLUME</label>
                  </div>
                  {deployForm.storage.enabled && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-mono text-gray-400 mb-1">SIZE</label>
                          <input
                            type="text"
                            placeholder="e.g., 512Mi, 20Gi"
                            value={deployForm.storage.size}
                            onChange={(e) => setDeployForm(prev => ({
                              ...prev,
                              storage: {...prev.storage, size: e.target.value}
                            }))}
                            className="w-full bg-black border border-white text-white px-3 py-2 font-mono text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-mono text-gray-400 mb-1">ACCESS MODE</label>
                          <CustomSelector
                            value={deployForm.storage.accessMode}
                            options={[
                              { value: 'ReadWriteOnce', label: 'READ WRITE ONCE' },
                              { value: 'ReadOnlyMany', label: 'READ ONLY MANY' },
                              { value: 'ReadWriteMany', label: 'READ WRITE MANY' }
                            ]}
                            onChange={(value) => setDeployForm(prev => ({
                              ...prev,
                              storage: {...prev.storage, accessMode: value}
                            }))}
                            icon={Shield}
                            size="sm"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-mono text-gray-400 mb-1">MOUNT PATH</label>
                        <input
                          type="text"
                          placeholder="e.g., /data"
                          value={deployForm.storage.mountPath}
                          onChange={(e) => setDeployForm(prev => ({
                            ...prev,
                            storage: {...prev.storage, mountPath: e.target.value}
                          }))}
                          className="w-full bg-black border border-white text-white px-3 py-2 font-mono text-sm"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Service & Networking */}
              <div>
                <label className="block text-sm font-mono text-gray-300 mb-3 tracking-wider">ENVIRONMENT VARIABLES</label>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-mono text-gray-400 mb-2">FROM SECRETS (secretKeyRef)</label>
                    <div className="grid grid-cols-3 gap-2">
                      <input
                        type="text"
                        placeholder="ENV VAR NAME"
                        className="bg-black border border-white text-white px-3 py-2 font-mono text-sm"
                      />
                      <input
                        type="text"
                        placeholder="SECRET NAME (e.g., app-secrets)"
                        className="bg-black border border-white text-white px-3 py-2 font-mono text-sm"
                      />
                      <input
                        type="text"
                        placeholder="SECRET KEY"
                        className="bg-black border border-white text-white px-3 py-2 font-mono text-sm"
                      />
                    </div>
                    <button className="mt-2 px-3 py-1 border border-green-400 text-green-400 hover:bg-green-400 hover:text-black transition-colors font-mono text-xs tracking-wider">
                      ADD SECRET REF
                    </button>
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-gray-400 mb-2">DIRECT VALUES</label>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="ENV VAR NAME"
                        className="bg-black border border-white text-white px-3 py-2 font-mono text-sm"
                      />
                      <input
                        type="text"
                        placeholder="VALUE"
                        className="bg-black border border-white text-white px-3 py-2 font-mono text-sm"
                      />
                    </div>
                    <button className="mt-2 px-3 py-1 border border-blue-400 text-blue-400 hover:bg-blue-400 hover:text-black transition-colors font-mono text-xs tracking-wider">
                      ADD ENV VAR
                    </button>
                  </div>
                </div>
              </div>

              {/* Health Check Configuration */}
              <div>
                <div className="flex items-center space-x-2 mb-3">
                  <input
                    type="checkbox"
                    id="healthcheck"
                    checked={deployForm.healthCheck.enabled}
                    onChange={(e) => setDeployForm(prev => ({
                      ...prev,
                      healthCheck: {...prev.healthCheck, enabled: e.target.checked}
                    }))}
                    className="bg-black border border-white w-4 h-4"
                  />
                  <label htmlFor="healthcheck" className="text-sm font-mono text-gray-300 tracking-wider">ENABLE HEALTH CHECKS</label>
                </div>
                {deployForm.healthCheck.enabled && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <CustomSelector
                        value={deployForm.healthCheck.type}
                        options={[
                          { value: 'http', label: 'HTTP GET' },
                          { value: 'exec', label: 'EXEC COMMAND' },
                          { value: 'tcp', label: 'TCP SOCKET' }
                        ]}
                        onChange={(value) => setDeployForm(prev => ({
                          ...prev,
                          healthCheck: {...prev.healthCheck, type: value}
                        }))}
                        icon={Activity}
                        size="sm"
                      />
                      <input
                        type="text"
                        placeholder={deployForm.healthCheck.type === 'http' ? 'PATH (e.g., /api/healthz)' : deployForm.healthCheck.type === 'exec' ? 'COMMAND' : 'PORT'}
                        value={deployForm.healthCheck.path}
                        onChange={(e) => setDeployForm(prev => ({
                          ...prev,
                          healthCheck: {...prev.healthCheck, path: e.target.value}
                        }))}
                        className="bg-black border border-white text-white px-3 py-2 font-mono text-sm"
                      />
                    </div>
                    <div className="grid grid-cols-5 gap-2">
                      <input
                        type="number"
                        placeholder="INITIAL DELAY"
                        value={deployForm.healthCheck.initialDelaySeconds}
                        onChange={(e) => setDeployForm(prev => ({
                          ...prev,
                          healthCheck: {...prev.healthCheck, initialDelaySeconds: parseInt(e.target.value)}
                        }))}
                        className="bg-black border border-white text-white px-2 py-2 font-mono text-sm"
                      />
                      <input
                        type="number"
                        placeholder="TIMEOUT"
                        value={deployForm.healthCheck.timeoutSeconds}
                        onChange={(e) => setDeployForm(prev => ({
                          ...prev,
                          healthCheck: {...prev.healthCheck, timeoutSeconds: parseInt(e.target.value)}
                        }))}
                        className="bg-black border border-white text-white px-2 py-2 font-mono text-sm"
                      />
                      <input
                        type="number"
                        placeholder="PERIOD"
                        value={deployForm.healthCheck.periodSeconds}
                        onChange={(e) => setDeployForm(prev => ({
                          ...prev,
                          healthCheck: {...prev.healthCheck, periodSeconds: parseInt(e.target.value)}
                        }))}
                        className="bg-black border border-white text-white px-2 py-2 font-mono text-sm"
                      />
                      <input
                        type="number"
                        placeholder="SUCCESS"
                        value={deployForm.healthCheck.successThreshold}
                        onChange={(e) => setDeployForm(prev => ({
                          ...prev,
                          healthCheck: {...prev.healthCheck, successThreshold: parseInt(e.target.value)}
                        }))}
                        className="bg-black border border-white text-white px-2 py-2 font-mono text-sm"
                      />
                      <input
                        type="number"
                        placeholder="FAILURE"
                        value={deployForm.healthCheck.failureThreshold}
                        onChange={(e) => setDeployForm(prev => ({
                          ...prev,
                          healthCheck: {...prev.healthCheck, failureThreshold: parseInt(e.target.value)}
                        }))}
                        className="bg-black border border-white text-white px-2 py-2 font-mono text-sm"
                      />
                    </div>
                    <div className="text-xs text-gray-400 font-mono">
                      Based on patterns from gitea (/api/healthz), postgresql (pg_isready), and timing configurations
                    </div>
                  </div>
                )}
              </div>

              {/* Volume Mounts */}
              <div>
                <label className="block text-sm font-mono text-gray-300 mb-3 tracking-wider">VOLUME MOUNTS</label>
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-3">
                    <input
                      type="text"
                      placeholder="VOLUME NAME (e.g., timezone)"
                      className="bg-black border border-white text-white px-3 py-2 font-mono text-sm"
                    />
                    <input
                      type="text"
                      placeholder="MOUNT PATH (e.g., /etc/timezone)"
                      className="bg-black border border-white text-white px-3 py-2 font-mono text-sm"
                    />
                    <input
                      type="text"
                      placeholder="SUB PATH (optional)"
                      className="bg-black border border-white text-white px-3 py-2 font-mono text-sm"
                    />
                  </div>
                  <button className="px-3 py-1 border border-cyan-400 text-cyan-400 hover:bg-cyan-400 hover:text-black transition-colors font-mono text-xs tracking-wider">
                    ADD VOLUME MOUNT
                  </button>
                  <div className="text-xs text-gray-400 font-mono">
                    Common patterns: timezone (/etc/timezone), localtime (/etc/localtime), config files, static content
                  </div>
                </div>
              </div>

              {/* Ingress Configuration */}
              <div>
                <div className="flex items-center space-x-2 mb-3">
                  <input
                    type="checkbox"
                    id="ingress"
                    checked={deployForm.ingress.enabled}
                    onChange={(e) => setDeployForm(prev => ({
                      ...prev,
                      ingress: {...prev.ingress, enabled: e.target.checked}
                    }))}
                    className="bg-black border border-white"
                  />
                  <label htmlFor="ingress" className="text-xs font-mono text-gray-300 tracking-wider">ENABLE INGRESS</label>
                </div>
                {deployForm.ingress.enabled && (
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="HOST (e.g., app.example.com)"
                      value={deployForm.ingress.host}
                      onChange={(e) => setDeployForm(prev => ({
                        ...prev,
                        ingress: {...prev.ingress, host: e.target.value}
                      }))}
                      className="bg-black border border-white text-white px-2 py-1 font-mono text-xs"
                    />
                    <input
                      type="text"
                      placeholder="PATH"
                      value={deployForm.ingress.path}
                      onChange={(e) => setDeployForm(prev => ({
                        ...prev,
                        ingress: {...prev.ingress, path: e.target.value}
                      }))}
                      className="bg-black border border-white text-white px-2 py-1 font-mono text-xs"
                    />
                  </div>
                )}
              </div>

              {/* Autoscaling Configuration */}
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <input
                    type="checkbox"
                    id="autoscaling"
                    checked={deployForm.autoscaling.enabled}
                    onChange={(e) => setDeployForm(prev => ({
                      ...prev,
                      autoscaling: {...prev.autoscaling, enabled: e.target.checked}
                    }))}
                    className="bg-black border border-white"
                  />
                  <label htmlFor="autoscaling" className="text-xs font-mono text-gray-300 tracking-wider">ENABLE AUTOSCALING</label>
                </div>
                {deployForm.autoscaling.enabled && (
                  <div className="grid grid-cols-3 gap-2">
                    <input
                      type="number"
                      placeholder="MIN REPLICAS"
                      min="1"
                      value={deployForm.autoscaling.minReplicas}
                      onChange={(e) => setDeployForm(prev => ({
                        ...prev,
                        autoscaling: {...prev.autoscaling, minReplicas: parseInt(e.target.value)}
                      }))}
                      className="bg-black border border-white text-white px-2 py-1 font-mono text-xs"
                    />
                    <input
                      type="number"
                      placeholder="MAX REPLICAS"
                      min="1"
                      value={deployForm.autoscaling.maxReplicas}
                      onChange={(e) => setDeployForm(prev => ({
                        ...prev,
                        autoscaling: {...prev.autoscaling, maxReplicas: parseInt(e.target.value)}
                      }))}
                      className="bg-black border border-white text-white px-2 py-1 font-mono text-xs"
                    />
                    <input
                      type="number"
                      placeholder="CPU TARGET %"
                      min="1"
                      max="100"
                      value={deployForm.autoscaling.targetCPUUtilization}
                      onChange={(e) => setDeployForm(prev => ({
                        ...prev,
                        autoscaling: {...prev.autoscaling, targetCPUUtilization: parseInt(e.target.value)}
                      }))}
                      className="bg-black border border-white text-white px-2 py-1 font-mono text-xs"
                    />
                  </div>
                )}
              </div>

              {/* Service Configuration & Deployment Strategy */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono text-gray-300 mb-2">SERVICE TYPE</label>
                  <CustomSelector
                    value={deployForm.service.type}
                    options={[
                      { value: 'ClusterIP', label: 'CLUSTER IP' },
                      { value: 'NodePort', label: 'NODE PORT' },
                      { value: 'LoadBalancer', label: 'LOAD BALANCER' }
                    ]}
                    onChange={(value) => setDeployForm(prev => ({
                      ...prev,
                      service: {...prev.service, type: value}
                    }))}
                    icon={Globe}
                    size="xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-gray-300 mb-2">DEPLOYMENT STRATEGY</label>
                  <CustomSelector
                    value={deployForm.deployment.strategy}
                    options={[
                      { value: 'RollingUpdate', label: 'ROLLING UPDATE' },
                      { value: 'Recreate', label: 'RECREATE' }
                    ]}
                    onChange={(value) => setDeployForm(prev => ({
                      ...prev,
                      deployment: {...prev.deployment, strategy: value}
                    }))}
                    icon={Server}
                    size="xs"
                  />
                </div>
              </div>

              {/* Rolling Update Parameters */}
              {deployForm.deployment.strategy === 'RollingUpdate' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono text-gray-400 mb-1">MAX SURGE</label>
                    <input
                      type="text"
                      placeholder="25%"
                      value={deployForm.deployment.maxSurge}
                      onChange={(e) => setDeployForm(prev => ({
                        ...prev,
                        deployment: {...prev.deployment, maxSurge: e.target.value}
                      }))}
                      className="w-full bg-black border border-white text-white px-2 py-1 font-mono text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-gray-400 mb-1">MAX UNAVAILABLE</label>
                    <input
                      type="text"
                      placeholder="25%"
                      value={deployForm.deployment.maxUnavailable}
                      onChange={(e) => setDeployForm(prev => ({
                        ...prev,
                        deployment: {...prev.deployment, maxUnavailable: e.target.value}
                      }))}
                      className="w-full bg-black border border-white text-white px-2 py-1 font-mono text-xs"
                    />
                  </div>
                </div>
              )}

              {/* Security Context */}
              <div>
                <label className="block text-sm font-mono text-gray-300 mb-3 tracking-wider">SECURITY CONTEXT</label>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="number"
                      placeholder="USER ID (e.g., 1000)"
                      value={deployForm.security.runAsUser}
                      onChange={(e) => setDeployForm(prev => ({
                        ...prev,
                        security: {...prev.security, runAsUser: parseInt(e.target.value)}
                      }))}
                      className="bg-black border border-white text-white px-3 py-2 font-mono text-sm"
                    />
                    <input
                      type="number"
                      placeholder="GROUP ID (e.g., 1000)"
                      value={deployForm.security.runAsGroup}
                      onChange={(e) => setDeployForm(prev => ({
                        ...prev,
                        security: {...prev.security, runAsGroup: parseInt(e.target.value)}
                      }))}
                      className="bg-black border border-white text-white px-3 py-2 font-mono text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="runAsNonRoot"
                        checked={deployForm.security.runAsNonRoot}
                        onChange={(e) => setDeployForm(prev => ({
                          ...prev,
                          security: {...prev.security, runAsNonRoot: e.target.checked}
                        }))}
                        className="bg-black border border-white w-4 h-4"
                      />
                      <label htmlFor="runAsNonRoot" className="text-sm font-mono text-gray-300">RUN AS NON-ROOT</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="readOnlyRoot"
                        checked={deployForm.security.readOnlyRootFilesystem}
                        onChange={(e) => setDeployForm(prev => ({
                          ...prev,
                          security: {...prev.security, readOnlyRootFilesystem: e.target.checked}
                        }))}
                        className="bg-black border border-white w-4 h-4"
                      />
                      <label htmlFor="readOnlyRoot" className="text-sm font-mono text-gray-300">READ-ONLY ROOT FILESYSTEM</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="allowPrivEsc"
                        checked={!deployForm.security.allowPrivilegeEscalation}
                        onChange={(e) => setDeployForm(prev => ({
                          ...prev,
                          security: {...prev.security, allowPrivilegeEscalation: !e.target.checked}
                        }))}
                        className="bg-black border border-white w-4 h-4"
                      />
                      <label htmlFor="allowPrivEsc" className="text-sm font-mono text-gray-300">PREVENT PRIVILEGE ESCALATION</label>
                    </div>
                  </div>
                  <div className="text-xs text-gray-400 font-mono">
                    Based on gitea configuration: USER_UID=1000, USER_GID=1000
                  </div>
                </div>
              </div>
            </div>
          </div>
            </div>
          </>
        )}

        {/* YAML Preview Step */}
        {currentStep === 'preview' && (
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
            <div className="bg-gray-900 border border-white p-4 font-mono text-sm text-white overflow-auto max-h-96">
              <pre className="whitespace-pre-wrap">{yamlPreview}</pre>
            </div>
            <div className="text-sm text-gray-400 font-mono">
              Review the generated Kubernetes manifest. Click "COMMIT TO GIT" to save this deployment configuration.
            </div>
          </div>
        )}

        {/* Committed Step */}
        {currentStep === 'committed' && (
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
        )}
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
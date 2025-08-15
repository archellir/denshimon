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
  const { images, loading, fetchImages } = useDeploymentStore();
  
  // Deployment states
  const [selectedImage, setSelectedImage] = useState<ContainerImage | null>(null);
  const [deploying, setDeploying] = useState(false);

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
    annotations: {} as Record<string, string>
  });

  useEffect(() => {
    if (isOpen) {
      fetchImages();
      if (preselectedImage) {
        setSelectedImage(preselectedImage);
      }
    }
  }, [isOpen, preselectedImage, fetchImages]);


  const handleDeploy = async () => {
    if (!selectedImage || !deployForm.name || !onClose) return;

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
            ingress: deployForm.ingress.enabled,
            autoscaling: deployForm.autoscaling.enabled,
            storage: deployForm.storage.enabled
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
          image: selectedImage.fullName,
          replicas: deployForm.replicas,
          resources: deployForm.resources,
          manifest: manifestData.manifest,
          config: deployForm
        })
      });

      if (createResponse.ok) {
        onClose?.();
        setSelectedImage(null);
        // Reset form
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
          annotations: {} as Record<string, string>
        });
      }
    } catch (error) {
      console.error('Failed to deploy application:', error);
    } finally {
      setDeploying(false);
    }
  };

  const { createClickOutsideHandler, preventClickThrough } = useModalKeyboard({
    isOpen,
    onClose: () => onClose?.(),
    onSubmit: handleDeploy,
    canSubmit: Boolean(selectedImage && deployForm.name && !deploying),
    modalId: 'deploy-modal'
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50" onClick={createClickOutsideHandler(() => onClose?.())}>
      <div id="deploy-modal" className="bg-black border border-white p-8 max-w-7xl w-full mx-4 max-h-[95vh] overflow-y-auto" onClick={preventClickThrough}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-white font-mono tracking-wider">DEPLOY NEW APPLICATION</h3>
          <button
            onClick={() => onClose?.()}
            className="p-2 border border-red-400 text-red-400 hover:bg-red-400 hover:text-black transition-colors"
          >
            <X size={20} />
          </button>
        </div>

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
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-h-[60vh] overflow-y-auto pr-2">
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

        {/* Deploy Button */}
        <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-white">
          <button
            onClick={() => onClose?.()}
            className="px-4 py-2 border border-red-400 text-red-400 hover:bg-red-400 hover:text-black transition-colors font-mono text-sm tracking-wider"
          >
            CANCEL
          </button>
          <button
            onClick={handleDeploy}
            disabled={!selectedImage || !deployForm.name || deploying}
            className="px-6 py-2 border border-green-400 text-green-400 hover:bg-green-400 hover:text-black disabled:border-gray-600 disabled:text-gray-600 transition-colors font-mono text-sm flex items-center space-x-2 tracking-wider"
          >
            {deploying && <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full" />}
            <span>{deploying ? 'DEPLOYING...' : 'DEPLOY APPLICATION'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeploymentModal;
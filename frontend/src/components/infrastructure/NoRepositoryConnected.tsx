import { useState } from 'react';
import { GitBranch, CheckCircle, Activity, ExternalLink, Key } from 'lucide-react';
import CustomDialog from '@components/common/CustomDialog';
import CustomSelector from '@components/common/CustomSelector';
import { apiService } from '@services/api';
import { API_ENDPOINTS } from '@constants';
import type { BaseInfrastructureRepo } from '@/types/infrastructure';

interface NoRepositoryConnectedProps {
  onRepositoryConnected?: (repository: BaseInfrastructureRepo) => void;
}

const NoRepositoryConnected = ({ onRepositoryConnected }: NoRepositoryConnectedProps) => {
  const [showConnectDialog, setShowConnectDialog] = useState(false);
  const [repoUrl, setRepoUrl] = useState('');
  const [authMethod, setAuthMethod] = useState('ssh');
  const [branch, setBranch] = useState('main');
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  const validateForm = (): boolean => {
    setConnectionError(null);
    
    if (!repoUrl.trim()) {
      setConnectionError('Repository URL is required');
      return false;
    }
    
    // Basic URL validation
    try {
      new URL(repoUrl);
    } catch {
      setConnectionError('Invalid repository URL format');
      return false;
    }
    
    if (!authMethod) {
      setConnectionError('Authentication method is required');
      return false;
    }
    
    if (!branch.trim()) {
      setConnectionError('Branch name is required');
      return false;
    }
    
    return true;
  };

  const handleConnect = async () => {
    if (!validateForm()) {
      return;
    }
    
    setIsConnecting(true);
    setConnectionError(null);
    
    try {
      // Prepare repository connection payload
      const repositoryData = {
        url: repoUrl.trim(),
        branch: branch.trim(),
        auth_method: authMethod,
        // Additional authentication data would be handled separately
        // in a real implementation (SSH keys, tokens, etc.)
      };
      
      // Call the GitOps API to connect repository
      const response = await apiService.post<BaseInfrastructureRepo>(
        API_ENDPOINTS.GITOPS.REPOSITORIES,
        repositoryData
      );
      
      if (response.success && response.data) {
        // Successfully connected repository
        // console.log('Repository connected successfully:', response.data);
        
        // Close dialog and reset form
        setShowConnectDialog(false);
        setRepoUrl('');
        setAuthMethod('ssh');
        setBranch('main');
        
        // Notify parent component about the successful connection
        onRepositoryConnected?.(response.data);
        
      } else {
        setConnectionError(response.error || 'Failed to connect repository');
      }
      
    } catch (error) {
      // console.error('Repository connection failed:', error);
      
      // Handle different types of errors
      if (error instanceof Error) {
        setConnectionError(error.message);
      } else {
        setConnectionError('Failed to connect repository. Please check your connection and try again.');
      }
    } finally {
      setIsConnecting(false);
    }
  };

  const openDocumentation = () => {
    window.open('https://kubernetes.io/docs/concepts/configuration/', '_blank');
  };

  // Generate repository structure based on actual base_infrastructure/k8s structure
  const repositoryStructure = `infrastructure-repo/
├── k8s/
│   ├── cert-manager/
│   │   └── cluster-issuer.yaml
│   ├── monitoring/
│   │   ├── namespace.yaml
│   │   ├── prometheus-deployment.yaml
│   │   ├── prometheus-config.yaml
│   │   ├── kube-state-metrics.yaml
│   │   └── node-exporter.yaml
│   ├── namespace/
│   │   ├── namespace.yaml
│   │   ├── configmap.yaml
│   │   └── secrets.example.yaml
│   ├── postgresql/
│   │   ├── postgresql-statefulset.yaml
│   │   └── postgresql-service.yaml
│   ├── storage/
│   │   ├── local-storage-class.yaml
│   │   ├── postgresql-pv.yaml
│   │   └── services-pvs.yaml
│   ├── ingress/
│   │   └── ingress.yaml
│   ├── applications/
│   │   ├── gitea/
│   │   ├── filebrowser/
│   │   ├── umami/
│   │   └── uptime-kuma/
│   └── static-sites/
│       ├── dashboard-deployment.yaml
│       ├── homepage-deployment.yaml
│       └── nginx-config.yaml
├── environments/
│   ├── production/
│   ├── staging/
│   └── development/
└── README.md`;

  return (
    <>
      <div className="space-y-6">
        {/* No Repository Connected State */}
        <div className="bg-black border border-yellow-400 p-8">
          <div className="text-center">
            <GitBranch size={48} className="text-yellow-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white font-mono tracking-wider uppercase mb-4">
              NO INFRASTRUCTURE REPOSITORY CONNECTED
            </h2>
            <p className="text-gray-300 font-mono text-sm mb-6 max-w-2xl mx-auto">
              Connect your infrastructure repository to enable GitOps-based Kubernetes management. 
              This repository will contain all your cluster configurations, manifests, and deployment definitions.
            </p>
            
            <div className="flex justify-center space-x-4">
              <button 
                onClick={() => setShowConnectDialog(true)}
                className="px-6 py-3 border border-green-400 text-green-400 hover:bg-green-400 hover:text-black transition-colors font-mono text-sm tracking-wider uppercase"
              >
                CONNECT REPOSITORY
              </button>
              <button 
                onClick={openDocumentation}
                className="flex items-center space-x-2 px-6 py-3 border border-blue-400 text-blue-400 hover:bg-blue-400 hover:text-black transition-colors font-mono text-sm tracking-wider uppercase"
              >
                <span>VIEW DOCUMENTATION</span>
                <ExternalLink size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Setup Requirements */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-black border border-white p-6">
            <div className="flex items-center space-x-3 mb-4">
              <GitBranch size={24} className="text-green-400" />
              <h3 className="text-lg font-bold text-white font-mono tracking-wider uppercase">REPOSITORY SETUP</h3>
            </div>
            <ul className="space-y-2 text-sm text-gray-300 font-mono">
              <li>• Git repository with Kubernetes manifests</li>
              <li>• Proper directory structure</li>
              <li>• YAML configuration files</li>
              <li>• Branch-based environments</li>
            </ul>
          </div>

          <div className="bg-black border border-white p-6">
            <div className="flex items-center space-x-3 mb-4">
              <CheckCircle size={24} className="text-blue-400" />
              <h3 className="text-lg font-bold text-white font-mono tracking-wider uppercase">AUTHENTICATION</h3>
            </div>
            <ul className="space-y-2 text-sm text-gray-300 font-mono">
              <li>• SSH key pairs for private repos</li>
              <li>• Personal access tokens</li>
              <li>• Deploy keys (recommended)</li>
              <li>• Webhook secrets</li>
            </ul>
          </div>

          <div className="bg-black border border-white p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Activity size={24} className="text-yellow-400" />
              <h3 className="text-lg font-bold text-white font-mono tracking-wider uppercase">SYNC OPTIONS</h3>
            </div>
            <ul className="space-y-2 text-sm text-gray-300 font-mono">
              <li>• Automatic sync on git push</li>
              <li>• Manual sync triggers</li>
              <li>• Health monitoring</li>
              <li>• Drift detection</li>
            </ul>
          </div>
        </div>

        {/* Example Repository Structure */}
        <div className="bg-black border border-green-400 p-6 relative overflow-hidden">
          {/* Cyberpunk scanning lines */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-green-400/5 to-transparent animate-pulse" />
          <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-green-400 to-transparent opacity-50 animate-scan" />
          
          {/* Corner accents */}
          <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-green-400" />
          <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-green-400" />
          <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-green-400" />
          <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-green-400" />
          
          <div className="relative z-10">
            <h3 className="text-lg font-bold text-green-400 font-mono tracking-wider uppercase mb-4">
              ⟨ EXAMPLE REPOSITORY STRUCTURE ⟩
            </h3>
            <p className="text-sm text-gray-400 font-mono mb-4">
              Based on production infrastructure repository pattern
            </p>
            <div className="bg-black border border-green-400/30 p-4 font-mono text-sm text-gray-300 overflow-x-auto relative">
              {/* Code block scanning effect */}
              <div className="absolute inset-0 bg-gradient-to-b from-green-400/5 via-transparent to-green-400/5 animate-pulse" />
              <div className="relative z-10">
                <pre>{repositoryStructure}</pre>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Connect Repository Dialog */}
      <CustomDialog
        isOpen={showConnectDialog}
        onClose={() => {
          if (!isConnecting) {
            setShowConnectDialog(false);
            setConnectionError(null);
          }
        }}
        onConfirm={handleConnect}
        title="Connect Infrastructure Repository"
        variant="info"
        icon={GitBranch}
        width="xl"
        height="lg"
        confirmText={isConnecting ? "CONNECTING..." : "CONNECT"}
        cancelText="CANCEL"
        loading={isConnecting}
        preventClickOutside={isConnecting}
      >
        <div className="space-y-4">
          {/* Error Display */}
          {connectionError && (
            <div className="bg-red-900/20 border border-red-400 p-3 text-red-400 font-mono text-sm">
              <div className="flex items-center space-x-2">
                <span className="text-red-400">⚠</span>
                <span>{connectionError}</span>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-mono text-gray-400 mb-2 uppercase tracking-wider">
              Repository URL
            </label>
            <input
              type="text"
              value={repoUrl}
              onChange={(e) => {
                setRepoUrl(e.target.value);
                setConnectionError(null); // Clear error when user starts typing
              }}
              placeholder="https://github.com/your-org/infrastructure-repo.git"
              className="w-full bg-black border border-white text-white px-3 py-2 font-mono text-sm focus:outline-none focus:border-green-400 transition-colors"
              disabled={isConnecting}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono text-gray-400 mb-2 uppercase tracking-wider">
                Authentication Method
              </label>
              <CustomSelector
                value={authMethod}
                options={[
                  { value: 'ssh', label: 'SSH Key' },
                  { value: 'token', label: 'Personal Access Token' },
                  { value: 'deploy-key', label: 'Deploy Key (Recommended)' }
                ]}
                onChange={(value) => {
                  setAuthMethod(value);
                  setConnectionError(null);
                }}
                placeholder="Select Authentication Method"
                icon={Key}
                size="sm"
                disabled={isConnecting}
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-gray-400 mb-2 uppercase tracking-wider">
                Branch
              </label>
              <input
                type="text"
                value={branch}
                onChange={(e) => {
                  setBranch(e.target.value);
                  setConnectionError(null);
                }}
                placeholder="main"
                className="w-full bg-black border border-white text-white px-3 py-2 font-mono text-sm focus:outline-none focus:border-green-400 transition-colors"
                disabled={isConnecting}
              />
            </div>
          </div>

          <div className="bg-black border border-cyan-400 p-4 text-xs font-mono relative overflow-hidden">
            {/* Cyberpunk scanning lines */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-400/5 to-transparent animate-pulse" />
            <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-50 animate-scan" />
            
            {/* Corner accents */}
            <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-cyan-400" />
            <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-cyan-400" />
            <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-cyan-400" />
            <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-cyan-400" />
            
            <div className="relative z-10">
              <p className="mb-3 text-cyan-400 uppercase tracking-wider font-bold">⟨ VALIDATION PROTOCOL ⟩</p>
              <ul className="space-y-2 ml-4 text-gray-300">
                <li className="flex items-center space-x-2">
                  <span className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></span>
                  <span>REPOSITORY NETWORK ACCESSIBILITY</span>
                </li>
                <li className="flex items-center space-x-2">
                  <span className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></span>
                  <span>AUTHENTICATION CREDENTIAL VERIFICATION</span>
                </li>
                <li className="flex items-center space-x-2">
                  <span className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></span>
                  <span>KUBERNETES MANIFEST STRUCTURE ANALYSIS</span>
                </li>
                <li className="flex items-center space-x-2">
                  <span className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></span>
                  <span>BRANCH EXISTENCE & PERMISSION MATRIX</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </CustomDialog>
    </>
  );
};

export default NoRepositoryConnected;
export type { NoRepositoryConnectedProps };
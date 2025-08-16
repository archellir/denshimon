import { useState } from 'react';
import { GitBranch, CheckCircle, Activity, ExternalLink } from 'lucide-react';
import CustomDialog from '@components/common/CustomDialog';

const NoRepositoryConnected = () => {
  const [showConnectDialog, setShowConnectDialog] = useState(false);
  const [repoUrl, setRepoUrl] = useState('');
  const [authMethod, setAuthMethod] = useState('ssh');
  const [branch, setBranch] = useState('main');

  const handleConnect = () => {
    // In a real implementation, this would connect to the repository
    console.log('Connecting repository:', { repoUrl, authMethod, branch });
    alert(`Would connect to repository:\n\nURL: ${repoUrl}\nAuth: ${authMethod}\nBranch: ${branch}\n\nThis would validate the repository, set up authentication, and configure sync settings.`);
    setShowConnectDialog(false);
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
        <div className="bg-black border border-white p-6">
          <h3 className="text-lg font-bold text-white font-mono tracking-wider uppercase mb-4">
            EXAMPLE REPOSITORY STRUCTURE
          </h3>
          <p className="text-sm text-gray-400 font-mono mb-4">
            Based on production infrastructure repository pattern
          </p>
          <div className="bg-gray-900 border border-gray-600 p-4 font-mono text-sm text-gray-300 overflow-x-auto">
            <pre>{repositoryStructure}</pre>
          </div>
        </div>
      </div>

      {/* Connect Repository Dialog */}
      <CustomDialog
        isOpen={showConnectDialog}
        onClose={() => setShowConnectDialog(false)}
        onConfirm={handleConnect}
        title="Connect Infrastructure Repository"
        variant="info"
        icon={GitBranch}
        width="xl"
        height="lg"
        confirmText="CONNECT"
        cancelText="CANCEL"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-mono text-gray-400 mb-2 uppercase tracking-wider">
              Repository URL
            </label>
            <input
              type="text"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              placeholder="https://github.com/your-org/infrastructure-repo.git"
              className="w-full bg-black border border-white text-white px-3 py-2 font-mono text-sm focus:outline-none focus:border-green-400 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-gray-400 mb-2 uppercase tracking-wider">
              Authentication Method
            </label>
            <select
              value={authMethod}
              onChange={(e) => setAuthMethod(e.target.value)}
              className="w-full bg-black border border-white text-white px-3 py-2 font-mono text-sm focus:outline-none focus:border-green-400 transition-colors"
            >
              <option value="ssh">SSH Key</option>
              <option value="token">Personal Access Token</option>
              <option value="deploy-key">Deploy Key</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-mono text-gray-400 mb-2 uppercase tracking-wider">
              Branch
            </label>
            <input
              type="text"
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              placeholder="main"
              className="w-full bg-black border border-white text-white px-3 py-2 font-mono text-sm focus:outline-none focus:border-green-400 transition-colors"
            />
          </div>

          <div className="bg-gray-900 border border-gray-600 p-3 text-xs text-gray-400 font-mono">
            <p className="mb-2">Connection will validate:</p>
            <ul className="space-y-1 ml-4">
              <li>• Repository accessibility</li>
              <li>• Authentication credentials</li>
              <li>• Kubernetes manifest structure</li>
              <li>• Branch existence and permissions</li>
            </ul>
          </div>
        </div>
      </CustomDialog>
    </>
  );
};

export default NoRepositoryConnected;
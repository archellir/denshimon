import { useState, type FC } from 'react';
import { X, Save } from 'lucide-react';
import useDeploymentStore from '@/stores/deploymentStore';
import type { Registry } from '@/types/deployments';

interface RegistryFormProps {
  registry?: Registry | null;
  onClose: () => void;
  onSave: () => void;
}

const RegistryForm: FC<RegistryFormProps> = ({ registry, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: registry?.name || '',
    type: registry?.type || 'dockerhub' as const,
    url: registry?.config.url || '',
    namespace: registry?.config.namespace || '',
    username: registry?.config.username || '',
    password: registry?.config.password || '',
    token: registry?.config.token || '',
  });

  const { addRegistry, loading } = useDeploymentStore();

  const registryTypes = [
    { value: 'dockerhub', label: 'Docker Hub', defaultUrl: 'https://index.docker.io/v1/' },
    { value: 'gitea', label: 'Gitea Packages', defaultUrl: 'https://gitea.example.com' },
    { value: 'gitlab', label: 'GitLab Registry', defaultUrl: 'https://gitlab.example.com' },
    { value: 'generic', label: 'Generic OCI Registry', defaultUrl: 'https://registry.example.com' },
  ];

  const selectedType = registryTypes.find(t => t.value === formData.type);

  const handleTypeChange = (type: typeof formData.type) => {
    const typeConfig = registryTypes.find(t => t.value === type);
    setFormData(prev => ({
      ...prev,
      type,
      url: typeConfig?.defaultUrl || '',
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await addRegistry({
        name: formData.name,
        type: formData.type,
        config: {
          url: formData.url,
          namespace: formData.namespace || undefined,
          username: formData.username || undefined,
          password: formData.password || undefined,
          token: formData.token || undefined,
        },
        status: 'pending',
      });
      onSave();
    } catch (error) {
      console.error('Failed to save registry:', error);
    }
  };

  // Auth logic handled in form display
  const useTokenAuth = formData.type === 'gitea' || formData.type === 'gitlab' || formData.token;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-black border border-white w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-white/20 p-4">
          <h2 className="text-xl font-mono">
            {registry ? 'EDIT REGISTRY' : 'ADD REGISTRY'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/10 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-mono text-gray-400 mb-2">
                REGISTRY NAME *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full bg-black border border-white text-white px-3 py-2 font-mono focus:outline-none focus:border-green-400"
                placeholder="My Registry"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-mono text-gray-400 mb-2">
                REGISTRY TYPE *
              </label>
              <select
                value={formData.type}
                onChange={(e) => handleTypeChange(e.target.value as typeof formData.type)}
                className="w-full bg-black border border-white text-white px-3 py-2 font-mono focus:outline-none focus:border-green-400"
              >
                {registryTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-mono text-gray-400 mb-2">
                REGISTRY URL *
              </label>
              <input
                type="url"
                value={formData.url}
                onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
                className="w-full bg-black border border-white text-white px-3 py-2 font-mono focus:outline-none focus:border-green-400"
                placeholder={selectedType?.defaultUrl}
                required
              />
            </div>

            {formData.type !== 'dockerhub' && (
              <div>
                <label className="block text-sm font-mono text-gray-400 mb-2">
                  NAMESPACE
                </label>
                <input
                  type="text"
                  value={formData.namespace}
                  onChange={(e) => setFormData(prev => ({ ...prev, namespace: e.target.value }))}
                  className="w-full bg-black border border-white text-white px-3 py-2 font-mono focus:outline-none focus:border-green-400"
                  placeholder="organization or user"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Organization, user, or project namespace
                </p>
              </div>
            )}
          </div>

          {/* Authentication */}
          <div className="border-t border-white/20 pt-6">
            <h3 className="text-lg font-mono mb-4">AUTHENTICATION</h3>
            
            {useTokenAuth ? (
              <div>
                <label className="block text-sm font-mono text-gray-400 mb-2">
                  ACCESS TOKEN
                </label>
                <input
                  type="password"
                  value={formData.token}
                  onChange={(e) => setFormData(prev => ({ ...prev, token: e.target.value }))}
                  className="w-full bg-black border border-white text-white px-3 py-2 font-mono focus:outline-none focus:border-green-400"
                  placeholder="Personal access token or API key"
                />
                <p className="text-xs text-gray-400 mt-1">
                  {formData.type === 'gitea' && 'Gitea personal access token with package read permissions'}
                  {formData.type === 'gitlab' && 'GitLab personal access token or deploy token'}
                  {formData.type === 'generic' && 'Registry access token or API key'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-mono text-gray-400 mb-2">
                    USERNAME
                  </label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                    className="w-full bg-black border border-white text-white px-3 py-2 font-mono focus:outline-none focus:border-green-400"
                    placeholder="username"
                  />
                </div>
                <div>
                  <label className="block text-sm font-mono text-gray-400 mb-2">
                    PASSWORD
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    className="w-full bg-black border border-white text-white px-3 py-2 font-mono focus:outline-none focus:border-green-400"
                    placeholder="password or token"
                  />
                </div>
              </div>
            )}

            <p className="text-xs text-gray-400 mt-2">
              Leave authentication fields empty for public registries
            </p>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end space-x-3 border-t border-white/20 pt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-white text-white hover:bg-white hover:text-black transition-colors font-mono"
            >
              CANCEL
            </button>
            <button
              type="submit"
              disabled={loading.creating}
              className="flex items-center space-x-2 px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-mono"
            >
              {loading.creating ? (
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
              ) : (
                <Save size={16} />
              )}
              <span>{loading.creating ? 'SAVING...' : 'SAVE'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegistryForm;
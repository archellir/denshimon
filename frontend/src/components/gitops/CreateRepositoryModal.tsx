import { useState } from 'react';
import type { FC } from 'react';
import { X, GitBranch, Lock, Key, Globe } from 'lucide-react';
import useGitOpsStore from '@stores/gitopsStore';

interface CreateRepositoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface RepositoryFormData {
  name: string;
  url: string;
  branch: string;
  auth_type: 'none' | 'token' | 'ssh';
  credentials: Record<string, string>;
}

interface FormErrors {
  [key: string]: string | null;
}

const CreateRepositoryModal: FC<CreateRepositoryModalProps> = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState<RepositoryFormData>({
    name: '',
    url: '',
    branch: 'main',
    auth_type: 'none',
    credentials: {}
  });
  const [activeAuthTab, setActiveAuthTab] = useState<'none' | 'token' | 'ssh'>('none');
  const [errors, setErrors] = useState<FormErrors>({});

  const { createRepository, isCreating } = useGitOpsStore();

  const handleInputChange = (field: keyof RepositoryFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const handleCredentialChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      credentials: { ...prev.credentials, [field]: value }
    }));
  };

  const handleAuthTypeChange = (authType: 'none' | 'token' | 'ssh') => {
    setActiveAuthTab(authType);
    setFormData(prev => ({
      ...prev,
      auth_type: authType,
      credentials: {}
    }));
  };

  const validateForm = () => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Repository name is required';
    } else if (!/^[a-zA-Z0-9-_]+$/.test(formData.name)) {
      newErrors.name = 'Name can only contain letters, numbers, hyphens, and underscores';
    }

    if (!formData.url.trim()) {
      newErrors.url = 'Repository URL is required';
    } else if (!isValidGitUrl(formData.url)) {
      newErrors.url = 'Invalid Git repository URL';
    }

    if (!formData.branch.trim()) {
      newErrors.branch = 'Branch name is required';
    }

    if (formData.auth_type === 'token' && !formData.credentials.token?.trim()) {
      newErrors.token = 'Access token is required';
    }

    if (formData.auth_type === 'ssh') {
      if (!formData.credentials.private_key?.trim()) {
        newErrors.private_key = 'SSH private key is required';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidGitUrl = (url: string) => {
    const gitUrlRegex = /^(https?:\/\/|git@)[\w.-]+[/:][\w.-]+\/[\w.-]+\.git$/;
    const httpsRepoRegex = /^https:\/\/[\w.-]+\/[\w.-]+\/[\w.-]+\/?$/;
    return gitUrlRegex.test(url) || httpsRepoRegex.test(url);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      await createRepository(formData);
      onClose();
      // Reset form
      setFormData({
        name: '',
        url: '',
        branch: 'main',
        auth_type: 'none',
        credentials: {}
      });
      setActiveAuthTab('none');
    } catch (error) {
      setErrors({ submit: error instanceof Error ? error.message : 'An unknown error occurred' });
    }
  };

  const authTypes = [
    { id: 'none', label: 'Public', icon: Globe, description: 'Public repository, no authentication' },
    { id: 'token', label: 'Token', icon: Key, description: 'Personal access token or app password' },
    { id: 'ssh', label: 'SSH', icon: Lock, description: 'SSH key authentication' },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-black border border-white max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <GitBranch size={24} />
            <h2 className="text-xl font-mono">CREATE REPOSITORY</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white hover:text-black transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <h3 className="font-mono text-sm border-b border-white pb-2">BASIC INFORMATION</h3>
            
            <div>
              <label className="block text-xs font-mono opacity-60 mb-2">REPOSITORY NAME *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="my-app-repo"
                className={`w-full px-3 py-2 bg-black border font-mono text-sm focus:outline-none ${
                  errors.name ? 'border-red-400' : 'border-white focus:border-green-400'
                }`}
              />
              {errors.name && <p className="text-red-400 text-xs font-mono mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-xs font-mono opacity-60 mb-2">REPOSITORY URL *</label>
              <input
                type="url"
                value={formData.url}
                onChange={(e) => handleInputChange('url', e.target.value)}
                placeholder="https://github.com/user/repo.git"
                className={`w-full px-3 py-2 bg-black border font-mono text-sm focus:outline-none ${
                  errors.url ? 'border-red-400' : 'border-white focus:border-green-400'
                }`}
              />
              {errors.url && <p className="text-red-400 text-xs font-mono mt-1">{errors.url}</p>}
            </div>

            <div>
              <label className="block text-xs font-mono opacity-60 mb-2">BRANCH</label>
              <input
                type="text"
                value={formData.branch}
                onChange={(e) => handleInputChange('branch', e.target.value)}
                placeholder="main"
                className={`w-full px-3 py-2 bg-black border font-mono text-sm focus:outline-none ${
                  errors.branch ? 'border-red-400' : 'border-white focus:border-green-400'
                }`}
              />
              {errors.branch && <p className="text-red-400 text-xs font-mono mt-1">{errors.branch}</p>}
            </div>
          </div>

          {/* Authentication */}
          <div className="space-y-4">
            <h3 className="font-mono text-sm border-b border-white pb-2">AUTHENTICATION</h3>
            
            {/* Auth Type Tabs */}
            <div className="flex space-x-0 border border-white">
              {authTypes.map((auth) => (
                <button
                  key={auth.id}
                  type="button"
                  onClick={() => handleAuthTypeChange(auth.id as 'none' | 'token' | 'ssh')}
                  className={`flex items-center space-x-2 px-4 py-3 border-r border-white last:border-r-0 font-mono text-sm transition-colors ${
                    activeAuthTab === auth.id
                      ? 'bg-white text-black'
                      : 'bg-black text-white hover:bg-white hover:text-black'
                  }`}
                >
                  <auth.icon size={16} />
                  <span>{auth.label}</span>
                </button>
              ))}
            </div>

            {/* Auth Description */}
            <div className="p-3 border border-white bg-gray-900/20">
              <p className="text-xs font-mono opacity-80">
                {authTypes.find(auth => auth.id === activeAuthTab)?.description}
              </p>
            </div>

            {/* Token Authentication */}
            {activeAuthTab === 'token' && (
              <div>
                <label className="block text-xs font-mono opacity-60 mb-2">ACCESS TOKEN *</label>
                <input
                  type="password"
                  value={formData.credentials.token || ''}
                  onChange={(e) => handleCredentialChange('token', e.target.value)}
                  placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                  className={`w-full px-3 py-2 bg-black border font-mono text-sm focus:outline-none ${
                    errors.token ? 'border-red-400' : 'border-white focus:border-green-400'
                  }`}
                />
                {errors.token && <p className="text-red-400 text-xs font-mono mt-1">{errors.token}</p>}
                <p className="text-xs font-mono opacity-60 mt-1">
                  Personal access token or app password for repository access
                </p>
              </div>
            )}

            {/* SSH Authentication */}
            {activeAuthTab === 'ssh' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-mono opacity-60 mb-2">SSH PRIVATE KEY *</label>
                  <textarea
                    value={formData.credentials.private_key || ''}
                    onChange={(e) => handleCredentialChange('private_key', e.target.value)}
                    placeholder="-----BEGIN OPENSSH PRIVATE KEY-----"
                    rows={6}
                    className={`w-full px-3 py-2 bg-black border font-mono text-sm focus:outline-none resize-none ${
                      errors.private_key ? 'border-red-400' : 'border-white focus:border-green-400'
                    }`}
                  />
                  {errors.private_key && <p className="text-red-400 text-xs font-mono mt-1">{errors.private_key}</p>}
                </div>

                <div>
                  <label className="block text-xs font-mono opacity-60 mb-2">SSH PASSPHRASE (Optional)</label>
                  <input
                    type="password"
                    value={formData.credentials.passphrase || ''}
                    onChange={(e) => handleCredentialChange('passphrase', e.target.value)}
                    placeholder="SSH key passphrase"
                    className="w-full px-3 py-2 bg-black border border-white font-mono text-sm focus:outline-none focus:border-green-400"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Error Message */}
          {errors.submit && (
            <div className="p-3 border border-red-400 bg-red-900/20">
              <p className="text-red-400 font-mono text-sm">{errors.submit}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end space-x-4 pt-4 border-t border-white">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-white font-mono hover:bg-white hover:text-black transition-colors"
            >
              CANCEL
            </button>
            <button
              type="submit"
              disabled={isCreating}
              className="px-6 py-2 border border-green-400 text-green-400 font-mono hover:bg-green-400 hover:text-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCreating ? 'CREATING...' : 'CREATE REPOSITORY'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateRepositoryModal;
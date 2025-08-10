import { useState } from 'react';
import type { FC } from 'react';
import { X, Package } from 'lucide-react';
import useGitOpsStore from '@stores/gitopsStore';
import type { Repository } from '@types/gitops';

interface CreateApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  repositories: Repository[];
}

interface ApplicationFormData {
  name: string;
  repository_id: string;
  path: string;
  namespace: string;
  sync_policy: {
    auto_sync: boolean;
    prune: boolean;
    self_heal: boolean;
  };
}

interface FormErrors {
  [key: string]: string | null;
}

const CreateApplicationModal: FC<CreateApplicationModalProps> = ({ isOpen, onClose, repositories }) => {
  const [formData, setFormData] = useState<ApplicationFormData>({
    name: '',
    repository_id: '',
    path: '.',
    namespace: 'default',
    sync_policy: {
      auto_sync: false,
      prune: false,
      self_heal: false,
    }
  });
  const [errors, setErrors] = useState<FormErrors>({});

  const { createApplication, isCreating } = useGitOpsStore();

  const handleInputChange = (field: keyof ApplicationFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const handleSyncPolicyChange = (field: keyof ApplicationFormData['sync_policy'], value: boolean) => {
    setFormData(prev => ({
      ...prev,
      sync_policy: { ...prev.sync_policy, [field]: value }
    }));
  };

  const validateForm = () => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Application name is required';
    } else if (!/^[a-zA-Z0-9-]+$/.test(formData.name)) {
      newErrors.name = 'Name can only contain letters, numbers, and hyphens';
    }

    if (!formData.repository_id) {
      newErrors.repository_id = 'Repository is required';
    }

    if (!formData.namespace.trim()) {
      newErrors.namespace = 'Namespace is required';
    } else if (!/^[a-z0-9-]+$/.test(formData.namespace)) {
      newErrors.namespace = 'Namespace must be lowercase letters, numbers, and hyphens only';
    }

    if (!formData.path.trim()) {
      newErrors.path = 'Path is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      await createApplication(formData);
      onClose();
      // Reset form
      setFormData({
        name: '',
        repository_id: '',
        path: '.',
        namespace: 'default',
        sync_policy: {
          auto_sync: false,
          prune: false,
          self_heal: false,
        }
      });
    } catch (error) {
      setErrors({ submit: error instanceof Error ? error.message : 'An unknown error occurred' });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-black border border-white max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Package size={24} />
            <h2 className="text-xl font-mono">CREATE APPLICATION</h2>
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
            <h3 className="font-mono text-sm border-b border-white pb-2">APPLICATION DETAILS</h3>
            
            <div>
              <label className="block text-xs font-mono opacity-60 mb-2">APPLICATION NAME *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="my-web-app"
                className={`w-full px-3 py-2 bg-black border font-mono text-sm focus:outline-none ${
                  errors.name ? 'border-red-400' : 'border-white focus:border-green-400'
                }`}
              />
              {errors.name && <p className="text-red-400 text-xs font-mono mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-xs font-mono opacity-60 mb-2">REPOSITORY *</label>
              <select
                value={formData.repository_id}
                onChange={(e) => handleInputChange('repository_id', e.target.value)}
                className={`w-full px-3 py-2 bg-black border font-mono text-sm focus:outline-none ${
                  errors.repository_id ? 'border-red-400' : 'border-white focus:border-green-400'
                }`}
              >
                <option value="">Select a repository...</option>
                {repositories.map((repo) => (
                  <option key={repo.id} value={repo.id}>
                    {repo.name} ({repo.url})
                  </option>
                ))}
              </select>
              {errors.repository_id && <p className="text-red-400 text-xs font-mono mt-1">{errors.repository_id}</p>}
              {repositories.length === 0 && (
                <p className="text-yellow-400 text-xs font-mono mt-1">
                  No repositories available. Create a repository first.
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono opacity-60 mb-2">PATH IN REPOSITORY</label>
                <input
                  type="text"
                  value={formData.path}
                  onChange={(e) => handleInputChange('path', e.target.value)}
                  placeholder="."
                  className={`w-full px-3 py-2 bg-black border font-mono text-sm focus:outline-none ${
                    errors.path ? 'border-red-400' : 'border-white focus:border-green-400'
                  }`}
                />
                {errors.path && <p className="text-red-400 text-xs font-mono mt-1">{errors.path}</p>}
                <p className="text-xs font-mono opacity-60 mt-1">
                  Path to Kubernetes manifests (relative to repo root)
                </p>
              </div>

              <div>
                <label className="block text-xs font-mono opacity-60 mb-2">NAMESPACE *</label>
                <input
                  type="text"
                  value={formData.namespace}
                  onChange={(e) => handleInputChange('namespace', e.target.value)}
                  placeholder="default"
                  className={`w-full px-3 py-2 bg-black border font-mono text-sm focus:outline-none ${
                    errors.namespace ? 'border-red-400' : 'border-white focus:border-green-400'
                  }`}
                />
                {errors.namespace && <p className="text-red-400 text-xs font-mono mt-1">{errors.namespace}</p>}
              </div>
            </div>
          </div>

          {/* Sync Policy */}
          <div className="space-y-4">
            <h3 className="font-mono text-sm border-b border-white pb-2">SYNC POLICY</h3>
            
            <div className="space-y-3">
              <label className="flex items-start space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.sync_policy.auto_sync}
                  onChange={(e) => handleSyncPolicyChange('auto_sync', e.target.checked)}
                  className="mt-1 w-4 h-4"
                />
                <div>
                  <div className="font-mono text-sm">AUTO-SYNC</div>
                  <div className="text-xs font-mono opacity-60">
                    Automatically sync when repository changes are detected
                  </div>
                </div>
              </label>

              <label className="flex items-start space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.sync_policy.prune}
                  onChange={(e) => handleSyncPolicyChange('prune', e.target.checked)}
                  className="mt-1 w-4 h-4"
                />
                <div>
                  <div className="font-mono text-sm">PRUNE RESOURCES</div>
                  <div className="text-xs font-mono opacity-60">
                    Delete resources not defined in Git during sync
                  </div>
                </div>
              </label>

              <label className="flex items-start space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.sync_policy.self_heal}
                  onChange={(e) => handleSyncPolicyChange('self_heal', e.target.checked)}
                  className="mt-1 w-4 h-4"
                />
                <div>
                  <div className="font-mono text-sm">SELF-HEAL</div>
                  <div className="text-xs font-mono opacity-60">
                    Automatically correct drift from desired state
                  </div>
                </div>
              </label>
            </div>

            {/* Policy Warning */}
            {(formData.sync_policy.auto_sync || formData.sync_policy.prune || formData.sync_policy.self_heal) && (
              <div className="p-3 border border-yellow-400 bg-yellow-900/20">
                <div className="text-xs font-mono text-yellow-400 mb-1">⚠ POLICY WARNING</div>
                <div className="text-xs font-mono text-yellow-300">
                  Automated sync policies can make changes to your cluster without manual approval.
                  Make sure you trust the repository content.
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
              disabled={isCreating || repositories.length === 0}
              className="px-6 py-2 border border-green-400 text-green-400 font-mono hover:bg-green-400 hover:text-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCreating ? 'CREATING...' : 'CREATE APPLICATION'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateApplicationModal;
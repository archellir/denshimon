import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Save, Download, AlertCircle, CheckCircle, Lock, Key, Shield, AlertTriangle, Database, X } from 'lucide-react';
import { apiService } from '@services/api';
import CustomButton from '@components/common/CustomButton';
import CustomSelector from '@components/common/CustomSelector';
import { ButtonColor } from '@constants';

interface Secret {
  key: string;
  value: string;
}

interface SecretStatus {
  local: {
    secrets_file_exists: boolean;
    template_exists: boolean;
    secrets_count: number;
  };
  kubernetes: {
    exists_in_k8s: boolean;
    matches_local: boolean;
    namespace: string;
    error?: string;
  };
}

const SecretsTab: React.FC = () => {
  const [secrets, setSecrets] = useState<Secret[]>([]);
  const [status, setStatus] = useState<SecretStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [showValues, setShowValues] = useState<Record<string, boolean>>({});
  const [namespace, setNamespace] = useState('default');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    fetchSecrets();
    fetchStatus();
  }, [namespace]);

  const fetchSecrets = async () => {
    try {
      setLoading(true);
      const response = await apiService.get('/secrets');
      setSecrets(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Failed to fetch secrets:', error);
      showMessage('error', 'Failed to load secrets');
    } finally {
      setLoading(false);
    }
  };

  const fetchStatus = async () => {
    try {
      const response = await apiService.get(`/secrets/status?namespace=${namespace}`);
      setStatus(response.data as SecretStatus);
    } catch (error) {
      console.error('Failed to fetch status:', error);
    }
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const updateSecret = (key: string, value: string) => {
    setSecrets(prev => 
      prev.map(secret => 
        secret.key === key ? { ...secret, value } : secret
      )
    );
    setIsDirty(true);
  };

  const addSecret = () => {
    const newKey = `NEW_SECRET_${secrets.length + 1}`;
    setSecrets(prev => [...prev, { key: newKey, value: '' }]);
    setIsDirty(true);
  };

  const removeSecret = (keyToRemove: string) => {
    setSecrets(prev => prev.filter(secret => secret.key !== keyToRemove));
    setIsDirty(true);
  };

  const saveSecrets = async () => {
    try {
      setLoading(true);
      await apiService.put('/secrets', { secrets });
      setIsDirty(false);
      showMessage('success', 'Secrets saved successfully');
      await fetchStatus();
    } catch (error) {
      console.error('Failed to save secrets:', error);
      showMessage('error', 'Failed to save secrets');
    } finally {
      setLoading(false);
    }
  };

  const applyToKubernetes = async () => {
    try {
      setApplying(true);
      await apiService.post('/secrets/apply', { namespace });
      showMessage('success', `Secrets applied to Kubernetes (${namespace})`);
      await fetchStatus();
    } catch (error) {
      console.error('Failed to apply secrets:', error);
      showMessage('error', 'Failed to apply secrets to Kubernetes');
    } finally {
      setApplying(false);
    }
  };

  const loadTemplate = async () => {
    try {
      setLoading(true);
      const response = await apiService.get('/secrets/template');
      setSecrets(Array.isArray(response.data) ? response.data : []);
      setIsDirty(true);
      showMessage('success', 'Template loaded');
    } catch (error) {
      console.error('Failed to load template:', error);
      showMessage('error', 'Failed to load template');
    } finally {
      setLoading(false);
    }
  };

  const toggleSecretVisibility = (key: string) => {
    setShowValues(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const getStatusColor = () => {
    if (!status) return 'gray';
    if (status.kubernetes.error) return 'red';
    if (!status.kubernetes.exists_in_k8s) return 'yellow';
    if (!status.kubernetes.matches_local) return 'orange';
    return 'green';
  };

  const getStatusMessage = () => {
    if (!status) return 'Loading status...';
    if (status.kubernetes.error) return `Kubernetes error: ${status.kubernetes.error}`;
    if (!status.local.secrets_file_exists) return 'No secrets file found';
    if (!status.kubernetes.exists_in_k8s) return 'Secrets not deployed to Kubernetes';
    if (!status.kubernetes.matches_local) return 'Local secrets differ from Kubernetes';
    return 'Secrets are synchronized';
  };

  if (loading && secrets.length === 0) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full"></div>
          <span className="ml-3 font-mono text-gray-300">Loading secrets...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">

      {/* Message */}
      {message && (
        <div className={`p-4 border-l-4 ${message.type === 'success' ? 'border-green-400 bg-green-400/10' : 'border-red-400 bg-red-400/10'}`}>
          <div className="flex items-center">
            {message.type === 'success' ? (
              <CheckCircle className="h-5 w-5 text-green-400 mr-3" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-400 mr-3" />
            )}
            <span className={`font-mono text-sm ${message.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>
              {message.text}
            </span>
          </div>
        </div>
      )}

      {/* Status Card */}
      <div className="bg-gray-900/50 border border-gray-700 rounded-sm p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`w-3 h-3 rounded-full ${getStatusColor() === 'green' ? 'bg-green-400' : getStatusColor() === 'yellow' ? 'bg-yellow-400' : getStatusColor() === 'orange' ? 'bg-orange-400' : 'bg-red-400'}`}></div>
            <div>
              <h3 className="text-lg font-mono text-white font-bold">SECRET STATUS</h3>
              <p className="text-sm font-mono text-gray-400">{getStatusMessage()}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm font-mono text-gray-400">
              Local: {status?.local.secrets_count || 0} secrets
            </div>
            <div className="text-sm font-mono text-gray-400">
              Namespace: {namespace}
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 mr-4">
            <span className="text-xs font-mono text-gray-400 uppercase tracking-wider">NS:</span>
            <CustomSelector
              value={namespace}
              options={[
                { value: 'default', label: 'DEFAULT' },
                { value: 'base-infra', label: 'BASE-INFRA' },
                { value: 'kube-system', label: 'KUBE-SYSTEM' },
                { value: 'production', label: 'PRODUCTION' },
                { value: 'staging', label: 'STAGING' }
              ]}
              onChange={(value) => setNamespace(value)}
              icon={Database}
              size="sm"
            />
          </div>
          <CustomButton
            onClick={loadTemplate}
            disabled={loading}
            color={ButtonColor.BLUE}
            icon={Download}
            label="TEMPLATE"
          />
          <CustomButton
            onClick={addSecret}
            color={ButtonColor.GREEN}
            icon={Key}
            label="ADD"
          />
        </div>
        <div className="flex items-center space-x-3">
          <CustomButton
            onClick={saveSecrets}
            disabled={!isDirty || loading}
            color={ButtonColor.YELLOW}
            icon={Save}
            label={isDirty ? 'SAVE' : 'SAVED'}
          />
          <CustomButton
            onClick={applyToKubernetes}
            disabled={applying || !status?.local.secrets_file_exists}
            color={ButtonColor.RED}
            icon={Shield}
            label={applying ? 'WORKING...' : 'APPLY'}
          />
        </div>
      </div>

      {/* Security Warning */}
      <div className="bg-yellow-400/10 border border-yellow-400/30 p-4">
        <div className="flex items-start space-x-3">
          <AlertTriangle className="h-5 w-5 text-yellow-400 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="font-mono text-yellow-400 text-sm font-bold mb-1">SECRETS WORKFLOW</h4>
            <p className="font-mono text-yellow-300 text-xs leading-relaxed">
              • secrets.yaml is created/updated in base_infra/k8s/namespace/ • secrets.example.yaml shows template structure
              • Secrets never committed to git • Applied directly to Kubernetes cluster • Use LOAD TEMPLATE to start
            </p>
          </div>
        </div>
      </div>

      {/* Secrets List */}
      <div className="bg-gray-900/50 border border-gray-700 rounded-sm">
        <div className="p-6">
          <h3 className="text-lg font-mono text-white font-bold mb-4">SECRETS</h3>
          {secrets.length === 0 ? (
            <div className="text-center py-12">
              <Lock className="h-12 w-12 text-gray-600 mx-auto mb-4" />
              <p className="font-mono text-gray-400 mb-4">No secrets configured</p>
              <CustomButton
                onClick={loadTemplate}
                color={ButtonColor.BLUE}
                icon={Download}
                label="TEMPLATE"
              />
            </div>
          ) : (
            <div className="space-y-4">
              {secrets.map((secret, index) => (
                <div key={secret.key} className="border border-gray-700 rounded-sm p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-mono text-gray-300 mb-1 uppercase tracking-wider">Secret Key</label>
                      <input
                        type="text"
                        value={secret.key}
                        onChange={(e) => {
                          const newSecrets = [...secrets];
                          newSecrets[index] = { ...secret, key: e.target.value };
                          setSecrets(newSecrets);
                          setIsDirty(true);
                        }}
                        className="w-full bg-black border border-gray-600 focus:border-blue-400 text-white px-3 py-2 font-mono text-sm transition-colors"
                        placeholder="SECRET_KEY_NAME"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-mono text-gray-300 mb-1 uppercase tracking-wider">Secret Value</label>
                      <div className="relative">
                        <input
                          type={showValues[secret.key] ? 'text' : 'password'}
                          value={secret.value}
                          onChange={(e) => updateSecret(secret.key, e.target.value)}
                          className="w-full bg-black border border-gray-600 focus:border-blue-400 text-white px-3 py-2 pr-10 font-mono text-sm transition-colors"
                          placeholder="secret-value"
                        />
                        <button
                          type="button"
                          onClick={() => toggleSecretVisibility(secret.key)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                        >
                          {showValues[secret.key] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 flex justify-end">
                    <CustomButton
                      onClick={() => removeSecret(secret.key)}
                      color={ButtonColor.RED}
                      icon={X}
                      label="REMOVE"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SecretsTab;
import { useState, useEffect } from 'react';
import type { FC } from 'react';
import { X, Database, TestTube, CheckCircle, XCircle, Loader } from 'lucide-react';
import { DatabaseType } from '@/types/database';
import useDatabaseStore from '@stores/databaseStore';

interface AddDatabaseConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface FormData {
  name: string;
  type: DatabaseType;
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  filePath: string;
}

const AddDatabaseConnectionModal: FC<AddDatabaseConnectionModalProps> = ({ isOpen, onClose }) => {
  const {
    createConnection,
    testConnection,
    testResult,
    isLoading,
    error,
    clearError,
    supportedTypes,
    fetchSupportedTypes
  } = useDatabaseStore();

  const [formData, setFormData] = useState<FormData>({
    name: '',
    type: DatabaseType.POSTGRESQL,
    host: 'localhost',
    port: 5432,
    database: '',
    username: '',
    password: '',
    filePath: ''
  });

  const [isTesting, setIsTesting] = useState(false);
  const [hasTestedSuccessfully, setHasTestedSuccessfully] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchSupportedTypes();
      setHasTestedSuccessfully(false);
      clearError();
    }
  }, [isOpen, fetchSupportedTypes, clearError]);

  useEffect(() => {
    if (testResult?.success) {
      setHasTestedSuccessfully(true);
    }
  }, [testResult]);

  const handleInputChange = (field: keyof FormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasTestedSuccessfully(false); // Reset test status when form changes
  };

  const handleTypeChange = (type: DatabaseType) => {
    setFormData(prev => ({
      ...prev,
      type,
      port: type === DatabaseType.POSTGRESQL ? 5432 : 0,
      host: type === DatabaseType.POSTGRESQL ? 'localhost' : '',
      database: type === DatabaseType.POSTGRESQL ? '' : '',
      username: type === DatabaseType.POSTGRESQL ? '' : '',
      password: type === DatabaseType.POSTGRESQL ? '' : '',
      filePath: type === DatabaseType.SQLITE ? '' : ''
    }));
    setHasTestedSuccessfully(false);
  };

  const handleTest = async () => {
    setIsTesting(true);
    try {
      await testConnection(formData);
    } finally {
      setIsTesting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!hasTestedSuccessfully) {
      alert('Please test the connection successfully before saving.');
      return;
    }

    try {
      await createConnection(formData);
      onClose();
      // Reset form
      setFormData({
        name: '',
        type: DatabaseType.POSTGRESQL,
        host: 'localhost',
        port: 5432,
        database: '',
        username: '',
        password: '',
        filePath: ''
      });
      setHasTestedSuccessfully(false);
    } catch (error) {
      // console.error('Failed to create connection:', error);
    }
  };

  const isFormValid = () => {
    if (!formData.name.trim()) return false;
    
    if (formData.type === DatabaseType.POSTGRESQL) {
      return formData.host.trim() && 
             formData.database.trim() && 
             formData.username.trim() && 
             formData.password.trim() &&
             formData.port > 0;
    }
    
    if (formData.type === DatabaseType.SQLITE) {
      return formData.filePath.trim();
    }
    
    return false;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="bg-black border border-white w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white">
          <div className="flex items-center space-x-2">
            <Database size={20} />
            <h2 className="text-lg font-mono">ADD DATABASE CONNECTION</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/10 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Connection Name */}
          <div className="space-y-2">
            <label className="block text-sm font-mono">CONNECTION NAME *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className="w-full bg-black border border-white px-3 py-2 font-mono focus:outline-none focus:border-green-400"
              placeholder="My Database"
              required
            />
          </div>

          {/* Database Type */}
          <div className="space-y-2">
            <label className="block text-sm font-mono">DATABASE TYPE *</label>
            <div className="grid grid-cols-2 gap-2">
              {supportedTypes.length > 0 ? supportedTypes.map(type => (
                <button
                  key={type}
                  type="button"
                  onClick={() => handleTypeChange(type)}
                  className={`p-3 border font-mono text-sm transition-colors ${
                    formData.type === type
                      ? 'bg-white text-black border-white'
                      : 'border-white hover:bg-white/10'
                  }`}
                >
                  {type === DatabaseType.POSTGRESQL ? '🐘 PostgreSQL' : '📁 SQLite'}
                </button>
              )) : (
                <>
                  <button
                    type="button"
                    onClick={() => handleTypeChange(DatabaseType.POSTGRESQL)}
                    className={`p-3 border font-mono text-sm transition-colors ${
                      formData.type === DatabaseType.POSTGRESQL
                        ? 'bg-white text-black border-white'
                        : 'border-white hover:bg-white/10'
                    }`}
                  >
                    🐘 PostgreSQL
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTypeChange(DatabaseType.SQLITE)}
                    className={`p-3 border font-mono text-sm transition-colors ${
                      formData.type === DatabaseType.SQLITE
                        ? 'bg-white text-black border-white'
                        : 'border-white hover:bg-white/10'
                    }`}
                  >
                    📁 SQLite
                  </button>
                </>
              )}
            </div>
          </div>

          {/* PostgreSQL Fields */}
          {formData.type === DatabaseType.POSTGRESQL && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-mono">HOST *</label>
                  <input
                    type="text"
                    value={formData.host}
                    onChange={(e) => handleInputChange('host', e.target.value)}
                    className="w-full bg-black border border-white px-3 py-2 font-mono focus:outline-none focus:border-green-400"
                    placeholder="localhost"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-mono">PORT *</label>
                  <input
                    type="number"
                    value={formData.port}
                    onChange={(e) => handleInputChange('port', parseInt(e.target.value) || 0)}
                    className="w-full bg-black border border-white px-3 py-2 font-mono focus:outline-none focus:border-green-400"
                    placeholder="5432"
                    min="1"
                    max="65535"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-mono">DATABASE NAME *</label>
                <input
                  type="text"
                  value={formData.database}
                  onChange={(e) => handleInputChange('database', e.target.value)}
                  className="w-full bg-black border border-white px-3 py-2 font-mono focus:outline-none focus:border-green-400"
                  placeholder="myapp"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-mono">USERNAME *</label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => handleInputChange('username', e.target.value)}
                    className="w-full bg-black border border-white px-3 py-2 font-mono focus:outline-none focus:border-green-400"
                    placeholder="postgres"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-mono">PASSWORD *</label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    className="w-full bg-black border border-white px-3 py-2 font-mono focus:outline-none focus:border-green-400"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>
            </>
          )}

          {/* SQLite Fields */}
          {formData.type === DatabaseType.SQLITE && (
            <div className="space-y-2">
              <label className="block text-sm font-mono">DATABASE FILE PATH *</label>
              <input
                type="text"
                value={formData.filePath}
                onChange={(e) => handleInputChange('filePath', e.target.value)}
                className="w-full bg-black border border-white px-3 py-2 font-mono focus:outline-none focus:border-green-400"
                placeholder="/path/to/database.db"
                required
              />
              <p className="text-xs font-mono opacity-60">
                Path to the SQLite database file on the server
              </p>
            </div>
          )}

          {/* Test Connection */}
          <div className="pt-4 border-t border-white/20">
            <button
              type="button"
              onClick={handleTest}
              disabled={!isFormValid() || isTesting}
              className="flex items-center space-x-2 px-4 py-2 border border-blue-400 text-blue-400 hover:bg-blue-400 hover:text-black transition-colors font-mono text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isTesting ? (
                <Loader size={16} className="animate-spin" />
              ) : (
                <TestTube size={16} />
              )}
              <span>{isTesting ? 'TESTING...' : 'TEST CONNECTION'}</span>
            </button>

            {/* Test Results */}
            {testResult && (
              <div className={`mt-3 p-3 border flex items-start space-x-2 ${
                testResult.success ? 'border-green-400' : 'border-red-400'
              }`}>
                {testResult.success ? (
                  <CheckCircle size={16} className="text-green-400 mt-0.5 flex-shrink-0" />
                ) : (
                  <XCircle size={16} className="text-red-400 mt-0.5 flex-shrink-0" />
                )}
                <div className="space-y-1 flex-1">
                  <div className={`font-mono text-sm ${
                    testResult.success ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {testResult.success ? 'CONNECTION SUCCESSFUL' : 'CONNECTION FAILED'}
                  </div>
                  {testResult.version && (
                    <div className="text-xs font-mono opacity-60">
                      Version: {testResult.version}
                    </div>
                  )}
                  {testResult.error && (
                    <div className="text-xs font-mono text-red-400">
                      {testResult.error}
                    </div>
                  )}
                  <div className="text-xs font-mono opacity-60">
                    Response time: {testResult.responseTime}ms
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="mt-3 p-3 border border-red-400 text-red-400 font-mono text-sm">
                {error}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-4 pt-4 border-t border-white/20">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-white text-white hover:bg-white hover:text-black transition-colors font-mono text-sm"
            >
              CANCEL
            </button>
            <button
              type="submit"
              disabled={!isFormValid() || !hasTestedSuccessfully || isLoading}
              className="px-4 py-2 border border-green-400 text-green-400 hover:bg-green-400 hover:text-black transition-colors font-mono text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'CREATING...' : 'CREATE CONNECTION'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddDatabaseConnectionModal;
import type { FC } from 'react';
import { X, GitBranch, ExternalLink, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { Repository } from '@/types/gitops';

interface RepositoryDetailsProps {
  repository: Repository;
  onClose: () => void;
}

const RepositoryDetails: FC<RepositoryDetailsProps> = ({ repository, onClose }) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'synced':
        return <CheckCircle size={20} className="text-green-400" />;
      case 'error':
        return <AlertCircle size={20} className="text-red-400" />;
      default:
        return <Clock size={20} className="text-yellow-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'synced':
        return 'text-green-400';
      case 'error':
        return 'text-red-400';
      default:
        return 'text-yellow-400';
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-black border border-white max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <GitBranch size={24} />
            <div>
              <h2 className="text-xl font-mono">{repository.name}</h2>
              <p className="text-sm font-mono opacity-60">Repository Details</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white hover:text-black transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Status Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="border border-white p-4">
              <div className="flex items-center space-x-2 mb-2">
                {getStatusIcon(repository.sync_status)}
                <span className={`font-mono text-sm ${getStatusColor(repository.sync_status)}`}>
                  {repository.sync_status.toUpperCase()}
                </span>
              </div>
              <div className="text-xs font-mono opacity-60">SYNC STATUS</div>
            </div>

            <div className="border border-white p-4">
              <div className="font-mono text-lg mb-2">
                {repository.last_sync ? formatDistanceToNow(new Date(repository.last_sync), { addSuffix: true }).toUpperCase() : 'NEVER'}
              </div>
              <div className="text-xs font-mono opacity-60">LAST SYNC</div>
            </div>

            <div className="border border-white p-4">
              <div className="font-mono text-lg mb-2">{repository.branch || 'main'}</div>
              <div className="text-xs font-mono opacity-60">BRANCH</div>
            </div>
          </div>

          {/* Repository Information */}
          <div className="space-y-4">
            <h3 className="font-mono text-sm border-b border-white pb-2">REPOSITORY INFORMATION</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-mono opacity-60 mb-1">NAME</label>
                  <div className="font-mono text-sm">{repository.name}</div>
                </div>

                <div>
                  <label className="block text-xs font-mono opacity-60 mb-1">URL</label>
                  <div className="flex items-center space-x-2">
                    <div className="font-mono text-sm break-all">{repository.url}</div>
                    <a
                      href={repository.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1 border border-blue-400 text-blue-400 hover:bg-blue-400 hover:text-black transition-colors"
                    >
                      <ExternalLink size={12} />
                    </a>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono opacity-60 mb-1">BRANCH</label>
                  <div className="font-mono text-sm">{repository.branch || 'main'}</div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-mono opacity-60 mb-1">AUTHENTICATION</label>
                  <div className="font-mono text-sm">
                    <span className={
                      repository.auth_type === 'none' 
                        ? 'text-green-400' 
                        : repository.auth_type === 'token'
                        ? 'text-yellow-400'
                        : 'text-blue-400'
                    }>
                      {repository.auth_type.toUpperCase()}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono opacity-60 mb-1">CREATED</label>
                  <div className="font-mono text-sm">{formatDate(repository.created_at)}</div>
                </div>

                <div>
                  <label className="block text-xs font-mono opacity-60 mb-1">LAST UPDATED</label>
                  <div className="font-mono text-sm">{formatDate(repository.updated_at)}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Sync History */}
          <div className="space-y-4">
            <h3 className="font-mono text-sm border-b border-white pb-2">SYNC HISTORY</h3>
            
            <div className="border border-white">
              <div className="p-4 bg-gray-900/20 border-b border-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(repository.sync_status)}
                    <span className="font-mono text-sm">
                      {repository.last_sync ? formatDate(repository.last_sync) : 'Never synced'}
                    </span>
                  </div>
                  <span className={`font-mono text-xs px-2 py-1 border ${getStatusColor(repository.sync_status)} border-current`}>
                    {repository.sync_status.toUpperCase()}
                  </span>
                </div>
              </div>
              
              {repository.sync_error && (
                <div className="p-4 border-b border-white bg-red-900/20">
                  <div className="flex items-start space-x-2">
                    <AlertCircle size={16} className="text-red-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="text-xs font-mono text-red-400 mb-1">ERROR DETAILS</div>
                      <div className="font-mono text-sm text-red-300">{repository.sync_error}</div>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="p-4">
                <div className="text-xs font-mono opacity-60">
                  {repository.sync_status === 'synced' ? 'Repository is synchronized with the remote.' : 'Repository sync status unknown.'}
                </div>
              </div>
            </div>
          </div>

          {/* Raw Data (for debugging) */}
          <div className="space-y-4">
            <details className="group">
              <summary className="font-mono text-sm border-b border-white pb-2 cursor-pointer hover:text-green-400">
                RAW DATA (DEBUG)
              </summary>
              <div className="mt-4 p-4 border border-white bg-gray-900/20">
                <pre className="font-mono text-xs overflow-x-auto whitespace-pre-wrap">
                  {JSON.stringify(repository, null, 2)}
                </pre>
              </div>
            </details>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-white flex justify-end space-x-4">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-white font-mono hover:bg-white hover:text-black transition-colors"
          >
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );
};

export default RepositoryDetails;
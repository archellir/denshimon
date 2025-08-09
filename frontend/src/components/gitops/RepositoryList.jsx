import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { 
  GitBranch, 
  Sync, 
  Trash2, 
  ExternalLink, 
  AlertCircle, 
  CheckCircle, 
  Clock,
  Eye 
} from 'lucide-react';
import useGitOpsStore from '../../stores/gitopsStore';

const RepositoryList = ({ onShowDetails }) => {
  const [deletingId, setDeletingId] = useState(null);
  const [syncingId, setSyncingId] = useState(null);
  
  const {
    getFilteredRepositories,
    deleteRepository,
    syncRepository,
    isSyncing,
  } = useGitOpsStore();

  const repositories = getFilteredRepositories();

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete repository "${name}"? This action cannot be undone.`)) {
      return;
    }

    setDeletingId(id);
    try {
      await deleteRepository(id);
    } catch (error) {
      console.error('Failed to delete repository:', error);
    } finally {
      setDeletingId(null);
    }
  };

  const handleSync = async (id) => {
    setSyncingId(id);
    try {
      await syncRepository(id);
    } catch (error) {
      console.error('Failed to sync repository:', error);
    } finally {
      setSyncingId(null);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'synced':
        return <CheckCircle size={16} className="text-green-400" />;
      case 'error':
        return <AlertCircle size={16} className="text-red-400" />;
      case 'unknown':
      default:
        return <Clock size={16} className="text-yellow-400" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'synced':
        return 'text-green-400 border-green-400';
      case 'error':
        return 'text-red-400 border-red-400';
      case 'unknown':
      default:
        return 'text-yellow-400 border-yellow-400';
    }
  };

  const formatLastSync = (lastSync) => {
    if (!lastSync) return 'NEVER';
    return formatDistanceToNow(new Date(lastSync), { addSuffix: true }).toUpperCase();
  };

  if (repositories.length === 0) {
    return (
      <div className="text-center py-12">
        <GitBranch size={48} className="mx-auto mb-4 opacity-40" />
        <h3 className="text-lg font-mono mb-2">NO REPOSITORIES FOUND</h3>
        <p className="font-mono text-sm opacity-60">
          Create your first Git repository to start deploying applications.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {repositories.map((repo) => (
        <div key={repo.id} className="border border-white bg-black">
          {/* Header */}
          <div className="p-4 border-b border-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <GitBranch size={20} className="text-white" />
                <div>
                  <h3 className="font-mono text-lg">{repo.name}</h3>
                  <p className="font-mono text-sm opacity-60">{repo.url}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <div className={`px-2 py-1 border ${getStatusColor(repo.sync_status)} font-mono text-xs`}>
                  <div className="flex items-center space-x-1">
                    {getStatusIcon(repo.sync_status)}
                    <span>{repo.sync_status.toUpperCase()}</span>
                  </div>
                </div>
                
                <button
                  onClick={() => onShowDetails(repo)}
                  className="p-2 border border-white hover:bg-white hover:text-black transition-colors"
                  title="View Details"
                >
                  <Eye size={16} />
                </button>
                
                <button
                  onClick={() => handleSync(repo.id)}
                  disabled={isSyncing || syncingId === repo.id}
                  className="p-2 border border-blue-400 text-blue-400 hover:bg-blue-400 hover:text-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Sync Repository"
                >
                  <Sync size={16} className={syncingId === repo.id ? 'animate-spin' : ''} />
                </button>
                
                <button
                  onClick={() => handleDelete(repo.id, repo.name)}
                  disabled={deletingId === repo.id}
                  className="p-2 border border-red-400 text-red-400 hover:bg-red-400 hover:text-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Delete Repository"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
            {/* Branch Info */}
            <div className="p-4 border-b md:border-b-0 md:border-r border-white">
              <div className="text-xs font-mono opacity-60 mb-1">BRANCH</div>
              <div className="font-mono text-sm">{repo.branch || 'main'}</div>
            </div>

            {/* Auth Type */}
            <div className="p-4 border-b md:border-b-0 lg:border-r border-white">
              <div className="text-xs font-mono opacity-60 mb-1">AUTH TYPE</div>
              <div className="font-mono text-sm">
                <span className={
                  repo.auth_type === 'none' 
                    ? 'text-green-400' 
                    : repo.auth_type === 'token'
                    ? 'text-yellow-400'
                    : 'text-blue-400'
                }>
                  {repo.auth_type.toUpperCase()}
                </span>
              </div>
            </div>

            {/* Last Sync */}
            <div className="p-4 border-b lg:border-b-0 lg:border-r border-white">
              <div className="text-xs font-mono opacity-60 mb-1">LAST SYNC</div>
              <div className="font-mono text-sm">{formatLastSync(repo.last_sync)}</div>
            </div>

            {/* Created */}
            <div className="p-4">
              <div className="text-xs font-mono opacity-60 mb-1">CREATED</div>
              <div className="font-mono text-sm">
                {formatDistanceToNow(new Date(repo.created_at), { addSuffix: true }).toUpperCase()}
              </div>
            </div>
          </div>

          {/* Error Message */}
          {repo.sync_error && (
            <div className="p-4 border-t border-white bg-red-900/20">
              <div className="flex items-start space-x-2">
                <AlertCircle size={16} className="text-red-400 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="text-xs font-mono text-red-400 mb-1">SYNC ERROR</div>
                  <div className="font-mono text-sm text-red-300">{repo.sync_error}</div>
                </div>
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="p-4 border-t border-white bg-gray-900/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4 text-xs font-mono opacity-60">
                <span>ID: {repo.id.substring(0, 8)}...</span>
                <span>TYPE: GIT</span>
              </div>
              
              <div className="flex items-center space-x-2">
                <a
                  href={repo.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-1 text-xs font-mono text-blue-400 hover:text-blue-300"
                >
                  <ExternalLink size={12} />
                  <span>VIEW REPO</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default RepositoryList;
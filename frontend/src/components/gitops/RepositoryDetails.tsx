import type { FC } from 'react';
import { useState } from 'react';
import { X, GitBranch, ExternalLink, Clock, CheckCircle, AlertCircle, Download, GitCommit, Activity, FileText } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { Repository, RepositoryStatus, DiffResponse } from '@/types/gitops';
import useGitOpsStore from '@/stores/gitopsStore';

interface RepositoryDetailsProps {
  repository: Repository;
  onClose: () => void;
}

const RepositoryDetails: FC<RepositoryDetailsProps> = ({ repository, onClose }) => {
  const [repositoryStatus, setRepositoryStatus] = useState<RepositoryStatus | null>(null);
  const [repositoryDiff, setRepositoryDiff] = useState<DiffResponse | null>(null);
  const [showCommitModal, setShowCommitModal] = useState(false);
  const [commitMessage, setCommitMessage] = useState('');
  const [commitPaths, setCommitPaths] = useState<string[]>(['.']);
  const [activeTab, setActiveTab] = useState<'overview' | 'status' | 'diff'>('overview');
  const [isLoading, setIsLoading] = useState(false);

  const { 
    pullRepository, 
    getRepositoryStatus, 
    commitAndPush, 
    getRepositoryDiff,
    isSyncing,
    error 
  } = useGitOpsStore();

  const handlePullRepository = async () => {
    try {
      setIsLoading(true);
      await pullRepository(repository.id);
    } catch (error) {
      console.error('Failed to pull repository:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGetStatus = async () => {
    try {
      setIsLoading(true);
      const status = await getRepositoryStatus(repository.id);
      setRepositoryStatus(status);
      setActiveTab('status');
    } catch (error) {
      console.error('Failed to get repository status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGetDiff = async () => {
    try {
      setIsLoading(true);
      const diff = await getRepositoryDiff(repository.id);
      setRepositoryDiff(diff);
      setActiveTab('diff');
    } catch (error) {
      console.error('Failed to get repository diff:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCommitAndPush = async () => {
    if (!commitMessage.trim()) return;
    
    try {
      setIsLoading(true);
      await commitAndPush(repository.id, {
        message: commitMessage,
        paths: commitPaths
      });
      setShowCommitModal(false);
      setCommitMessage('');
      setCommitPaths(['.']);
      // Refresh status if it's currently showing
      if (activeTab === 'status' && repositoryStatus) {
        await handleGetStatus();
      }
    } catch (error) {
      console.error('Failed to commit and push:', error);
    } finally {
      setIsLoading(false);
    }
  };

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

          {/* Git Operations */}
          <div className="space-y-4">
            <h3 className="font-mono text-sm border-b border-white pb-2">GIT OPERATIONS</h3>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <button
                onClick={handlePullRepository}
                disabled={isLoading || isSyncing}
                className="flex items-center justify-center space-x-2 p-3 border border-blue-400 text-blue-400 hover:bg-blue-400 hover:text-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download size={16} />
                <span className="font-mono text-sm">PULL</span>
              </button>

              <button
                onClick={handleGetStatus}
                disabled={isLoading}
                className="flex items-center justify-center space-x-2 p-3 border border-green-400 text-green-400 hover:bg-green-400 hover:text-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Activity size={16} />
                <span className="font-mono text-sm">STATUS</span>
              </button>

              <button
                onClick={handleGetDiff}
                disabled={isLoading}
                className="flex items-center justify-center space-x-2 p-3 border border-yellow-400 text-yellow-400 hover:bg-yellow-400 hover:text-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FileText size={16} />
                <span className="font-mono text-sm">DIFF</span>
              </button>

              <button
                onClick={() => setShowCommitModal(true)}
                disabled={isLoading || isSyncing}
                className="flex items-center justify-center space-x-2 p-3 border border-purple-400 text-purple-400 hover:bg-purple-400 hover:text-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <GitCommit size={16} />
                <span className="font-mono text-sm">COMMIT</span>
              </button>
            </div>

            {error && (
              <div className="p-3 border border-red-400 bg-red-900/20 text-red-400">
                <div className="flex items-start space-x-2">
                  <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                  <div className="font-mono text-sm">{error}</div>
                </div>
              </div>
            )}
          </div>

          {/* Tab Navigation */}
          <div className="space-y-4">
            <div className="flex space-x-1 border-b border-white">
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-4 py-2 font-mono text-sm transition-colors ${
                  activeTab === 'overview' 
                    ? 'bg-white text-black' 
                    : 'hover:bg-white hover:text-black'
                }`}
              >
                OVERVIEW
              </button>
              <button
                onClick={() => setActiveTab('status')}
                className={`px-4 py-2 font-mono text-sm transition-colors ${
                  activeTab === 'status' 
                    ? 'bg-white text-black' 
                    : 'hover:bg-white hover:text-black'
                }`}
              >
                STATUS
              </button>
              <button
                onClick={() => setActiveTab('diff')}
                className={`px-4 py-2 font-mono text-sm transition-colors ${
                  activeTab === 'diff' 
                    ? 'bg-white text-black' 
                    : 'hover:bg-white hover:text-black'
                }`}
              >
                DIFF
              </button>
            </div>
          </div>

          {/* Tab Content */}
          <div className="space-y-4">
            {activeTab === 'overview' && (
              <div className="space-y-6">
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
            )}

            {activeTab === 'status' && (
              <div className="space-y-4">
                {repositoryStatus ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="border border-white p-4">
                        <div className="font-mono text-lg mb-2">{repositoryStatus.branch}</div>
                        <div className="text-xs font-mono opacity-60">CURRENT BRANCH</div>
                      </div>
                      <div className="border border-white p-4">
                        <div className="font-mono text-lg mb-2">{repositoryStatus.commits.length}</div>
                        <div className="text-xs font-mono opacity-60">RECENT COMMITS</div>
                      </div>
                      <div className="border border-white p-4">
                        <div className="font-mono text-lg mb-2">{formatDistanceToNow(new Date(repositoryStatus.synced_at), { addSuffix: true }).toUpperCase()}</div>
                        <div className="text-xs font-mono opacity-60">STATUS RETRIEVED</div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-mono text-sm border-b border-white pb-2">WORKING DIRECTORY STATUS</h4>
                      <div className="border border-white p-4 bg-gray-900/20">
                        <pre className="font-mono text-sm whitespace-pre-wrap">
                          {repositoryStatus.status || 'No changes detected'}
                        </pre>
                      </div>
                    </div>

                    {repositoryStatus.commits.length > 0 && (
                      <div className="space-y-4">
                        <h4 className="font-mono text-sm border-b border-white pb-2">RECENT COMMITS</h4>
                        <div className="space-y-2">
                          {repositoryStatus.commits.map((commit) => (
                            <div key={commit.hash} className="border border-white p-4">
                              <div className="flex items-start justify-between mb-2">
                                <div className="font-mono text-sm text-green-400">
                                  {commit.hash.substring(0, 8)}
                                </div>
                                <div className="text-xs font-mono opacity-60">
                                  {formatDistanceToNow(new Date(commit.timestamp), { addSuffix: true })}
                                </div>
                              </div>
                              <div className="font-mono text-sm mb-2">{commit.message}</div>
                              <div className="text-xs font-mono opacity-60">
                                {commit.author} &lt;{commit.email}&gt;
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="font-mono text-sm opacity-60 mb-4">Click "STATUS" button to retrieve repository status</div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'diff' && (
              <div className="space-y-4">
                {repositoryDiff ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-mono text-sm">REPOSITORY DIFF</h4>
                      <div className="text-xs font-mono opacity-60">
                        {repositoryDiff.path ? `Path: ${repositoryDiff.path}` : 'Full repository'}
                      </div>
                    </div>
                    <div className="border border-white bg-gray-900/20">
                      <pre className="font-mono text-sm whitespace-pre-wrap p-4 overflow-x-auto">
                        {repositoryDiff.diff || 'No changes detected'}
                      </pre>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="font-mono text-sm opacity-60 mb-4">Click "DIFF" button to view repository changes</div>
                  </div>
                )}
              </div>
            )}
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

      {/* Commit Modal */}
      {showCommitModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-black border border-white max-w-lg w-full">
            <div className="p-6 border-b border-white flex items-center justify-between">
              <h3 className="font-mono text-lg">COMMIT AND PUSH</h3>
              <button
                onClick={() => setShowCommitModal(false)}
                className="p-1 hover:bg-white hover:text-black transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-mono opacity-60 mb-2">COMMIT MESSAGE</label>
                <input
                  type="text"
                  value={commitMessage}
                  onChange={(e) => setCommitMessage(e.target.value)}
                  placeholder="Enter commit message..."
                  className="w-full p-3 border border-white bg-black font-mono text-sm focus:outline-none focus:ring-1 focus:ring-white"
                />
              </div>

              <div>
                <label className="block text-xs font-mono opacity-60 mb-2">FILES TO COMMIT</label>
                <input
                  type="text"
                  value={commitPaths.join(', ')}
                  onChange={(e) => setCommitPaths(e.target.value.split(', ').filter(p => p.trim()))}
                  placeholder="., src/, specific-file.txt"
                  className="w-full p-3 border border-white bg-black font-mono text-sm focus:outline-none focus:ring-1 focus:ring-white"
                />
                <div className="text-xs font-mono opacity-60 mt-1">
                  Comma-separated paths. Use "." for all changes.
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-white flex justify-end space-x-4">
              <button
                onClick={() => setShowCommitModal(false)}
                className="px-6 py-2 border border-white font-mono hover:bg-white hover:text-black transition-colors"
              >
                CANCEL
              </button>
              <button
                onClick={handleCommitAndPush}
                disabled={!commitMessage.trim() || isLoading}
                className="px-6 py-2 border border-green-400 text-green-400 font-mono hover:bg-green-400 hover:text-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'COMMITTING...' : 'COMMIT & PUSH'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RepositoryDetails;
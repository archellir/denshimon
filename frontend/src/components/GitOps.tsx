import { useEffect, useState } from 'react';
import type { FC } from 'react';
import { GitBranch, Plus, Search, Filter } from 'lucide-react';
import useGitOpsStore from '@stores/gitopsStore';
import RepositoryList from '@components/gitops/RepositoryList';
import ApplicationList from '@components/gitops/ApplicationList';
import CreateRepositoryModal from '@components/gitops/CreateRepositoryModal';
import CreateApplicationModal from '@components/gitops/CreateApplicationModal';
import RepositoryDetails from '@components/gitops/RepositoryDetails';
import ApplicationDetails from '@components/gitops/ApplicationDetails';
import type { DetailsState } from '@types/components';
import type { Repository, Application } from '@types/gitops';

const GitOps: FC = () => {
  const [activeTab, setActiveTab] = useState<'repositories' | 'applications'>('repositories');
  const [showCreateRepo, setShowCreateRepo] = useState<boolean>(false);
  const [showCreateApp, setShowCreateApp] = useState<boolean>(false);
  const [showDetails, setShowDetails] = useState<DetailsState | null>(null);
  
  const {
    repositories,
    applications,
    isLoading,
    error,
    repositoryFilter,
    applicationFilter,
    sortBy,
    sortOrder,
    fetchRepositories,
    fetchApplications,
    setRepositoryFilter,
    setApplicationFilter,
    setSortBy,
    setSortOrder,
    clearGitOps,
  } = useGitOpsStore();

  useEffect(() => {
    fetchRepositories();
    fetchApplications();
    
    return () => {
      clearGitOps();
    };
  }, [fetchRepositories, fetchApplications, clearGitOps]);


  const getTabStats = () => {
    const repoStats = {
      total: repositories.length,
      synced: repositories.filter(r => r.sync_status === 'synced').length,
      errors: repositories.filter(r => r.sync_status === 'error').length,
    };
    
    const appStats = {
      total: applications.length,
      healthy: applications.filter(a => a.health_status === 'healthy').length,
      synced: applications.filter(a => a.sync_status === 'synced').length,
    };
    
    return { repoStats, appStats };
  };

  const { repoStats, appStats } = getTabStats();

  if (error) {
    return (
      <div className="min-h-screen bg-black text-white p-6">
        <div className="max-w-7xl mx-auto">
          <div className="border border-red-400 bg-red-900/20 p-6 rounded-sm">
            <h2 className="text-xl font-mono mb-2">GITOPS ERROR</h2>
            <p className="font-mono text-red-400">{error}</p>
            <button
              onClick={() => {
                clearGitOps();
                fetchRepositories();
                fetchApplications();
              }}
              className="mt-4 px-4 py-2 border border-red-400 text-red-400 hover:bg-red-400 hover:text-black transition-colors font-mono"
            >
              RETRY
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="border-b border-white">
        <div className="max-w-7xl mx-auto p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-mono flex items-center">
              <GitBranch className="mr-3" size={28} />
              GITOPS MANAGEMENT
            </h1>
            <div className="flex items-center space-x-4">
              <div className="text-sm font-mono">
                {isLoading ? (
                  <span className="text-yellow-400">LOADING...</span>
                ) : (
                  <span className="text-green-400">CONNECTED</span>
                )}
              </div>
              <button
                onClick={() => activeTab === 'repositories' ? setShowCreateRepo(true) : setShowCreateApp(true)}
                className="flex items-center space-x-2 px-4 py-2 border border-green-400 text-green-400 hover:bg-green-400 hover:text-black transition-colors font-mono"
              >
                <Plus size={16} />
                <span>CREATE {activeTab === 'repositories' ? 'REPO' : 'APP'}</span>
              </button>
            </div>
          </div>

          {/* Tab Navigation with Stats */}
          <div className="flex space-x-0 border border-white mb-6">
            <button
              onClick={() => setActiveTab('repositories')}
              className={`flex items-center space-x-2 px-6 py-4 border-r border-white font-mono transition-colors ${
                activeTab === 'repositories'
                  ? 'bg-white text-black'
                  : 'bg-black text-white hover:bg-white hover:text-black'
              }`}
            >
              <div className="text-center">
                <div className="flex items-center space-x-2">
                  <span>REPOSITORIES</span>
                  <span className="text-xs opacity-60">({repoStats.total})</span>
                </div>
                <div className="flex space-x-2 text-xs mt-1">
                  <span className="text-green-400">✓{repoStats.synced}</span>
                  {repoStats.errors > 0 && <span className="text-red-400">✗{repoStats.errors}</span>}
                </div>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('applications')}
              className={`flex items-center space-x-2 px-6 py-4 font-mono transition-colors ${
                activeTab === 'applications'
                  ? 'bg-white text-black'
                  : 'bg-black text-white hover:bg-white hover:text-black'
              }`}
            >
              <div className="text-center">
                <div className="flex items-center space-x-2">
                  <span>APPLICATIONS</span>
                  <span className="text-xs opacity-60">({appStats.total})</span>
                </div>
                <div className="flex space-x-2 text-xs mt-1">
                  <span className="text-green-400">♥{appStats.healthy}</span>
                  <span className="text-blue-400">⟲{appStats.synced}</span>
                </div>
              </div>
            </button>
          </div>

          {/* Search and Filter */}
          <div className="flex items-center space-x-4 mb-6">
            <div className="flex-1 relative">
              <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 opacity-60" />
              <input
                type="text"
                placeholder={`SEARCH ${activeTab.toUpperCase()}...`}
                value={activeTab === 'repositories' ? repositoryFilter : applicationFilter}
                onChange={(e) => 
                  activeTab === 'repositories' 
                    ? setRepositoryFilter(e.target.value) 
                    : setApplicationFilter(e.target.value)
                }
                className="w-full pl-10 pr-4 py-2 bg-black border border-white text-white font-mono placeholder-gray-400 focus:outline-none focus:border-green-400"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Filter size={16} className="opacity-60" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-black border border-white text-white font-mono px-3 py-2 focus:outline-none focus:border-green-400"
              >
                <option value="name">NAME</option>
                <option value="sync_status">SYNC STATUS</option>
                <option value="last_sync">LAST SYNC</option>
                {activeTab === 'applications' && <option value="health_status">HEALTH</option>}
              </select>
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="px-3 py-2 border border-white font-mono hover:bg-white hover:text-black transition-colors"
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto p-6">
        {activeTab === 'repositories' && (
          <RepositoryList 
            onShowDetails={(repo) => setShowDetails({ type: 'repository', data: repo })}
          />
        )}
        {activeTab === 'applications' && (
          <ApplicationList 
            onShowDetails={(app) => setShowDetails({ type: 'application', data: app })}
          />
        )}
      </div>

      {/* Modals */}
      {showCreateRepo && (
        <CreateRepositoryModal
          isOpen={showCreateRepo}
          onClose={() => setShowCreateRepo(false)}
        />
      )}
      
      {showCreateApp && (
        <CreateApplicationModal
          isOpen={showCreateApp}
          onClose={() => setShowCreateApp(false)}
          repositories={repositories}
        />
      )}

      {showDetails && showDetails.type === 'repository' && (
        <RepositoryDetails
          repository={showDetails.data as Repository}
          onClose={() => setShowDetails(null)}
        />
      )}

      {showDetails && showDetails.type === 'application' && (
        <ApplicationDetails
          application={showDetails.data as Application}
          onClose={() => setShowDetails(null)}
        />
      )}
    </div>
  );
};

export default GitOps;
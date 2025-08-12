import { useEffect, useState } from 'react';
import type { FC } from 'react';
import useGitOpsStore from '@stores/gitopsStore';
import RepositoryList from '@components/gitops/RepositoryList';
import ApplicationList from '@components/gitops/ApplicationList';
import CreateRepositoryModal from '@components/gitops/CreateRepositoryModal';
import CreateApplicationModal from '@components/gitops/CreateApplicationModal';
import RepositoryDetails from '@components/gitops/RepositoryDetails';
import ApplicationDetails from '@components/gitops/ApplicationDetails';
import type { DetailsState } from '@/types/components';
import type { Repository, Application } from '@/types/gitops';

interface GitOpsProps {
  activeSecondaryTab?: string;
}

const GitOps: FC<GitOpsProps> = ({ activeSecondaryTab }) => {
  // Set activeTab based on the secondary tab from Dashboard
  const getTabFromSecondary = (secondaryTab?: string): 'repositories' | 'applications' => {
    if (secondaryTab === 'applications') return 'applications';
    if (secondaryTab === 'repositories') return 'repositories';
    return 'applications'; // Default to applications tab
  };

  const [activeTab, setActiveTab] = useState<'repositories' | 'applications'>(getTabFromSecondary(activeSecondaryTab));

  // Update activeTab when activeSecondaryTab changes
  useEffect(() => {
    setActiveTab(getTabFromSecondary(activeSecondaryTab));
  }, [activeSecondaryTab]);
  const [showCreateRepo, setShowCreateRepo] = useState<boolean>(false);
  const [showCreateApp, setShowCreateApp] = useState<boolean>(false);
  const [showDetails, setShowDetails] = useState<DetailsState | null>(null);
  
  const {
    repositories,
    error,
    fetchRepositories,
    fetchApplications,
    clearGitOps,
  } = useGitOpsStore();

  useEffect(() => {
    fetchRepositories();
    fetchApplications();
    
    return () => {
      clearGitOps();
    };
  }, [fetchRepositories, fetchApplications, clearGitOps]);



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
    <div className="space-y-6">


      {/* Content */}
      <div>
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
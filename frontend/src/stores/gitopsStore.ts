import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { SortDirection, API_ENDPOINTS } from '@/constants';
import type { 
  GitOpsStore, 
  Repository, 
  Application, 
  CreateRepositoryRequest, 
  CreateApplicationRequest,
  GiteaAction,
  ContainerImage,
  DeploymentHistory,
  RepositoryStatus,
  CommitRequest,
  DiffResponse
} from '@/types/gitops';
import { 
  mockRepositories, 
  mockApplications, 
  mockGiteaActions, 
  mockContainerImages, 
  mockDeploymentHistory, 
  mockApiResponse, 
  MOCK_ENABLED 
} from '@mocks/index';

const useGitOpsStore = create<GitOpsStore>()(
  subscribeWithSelector((set, get) => ({
    // Repository data
    repositories: [],
    applications: [],
    giteaActions: [],
    containerImages: [],
    deploymentHistory: [],
    
    // Loading states
    isLoading: false,
    isCreating: false,
    isSyncing: false,
    isDeploying: false,
    error: null,
    
    // Filters and sorting
    repositoryFilter: '',
    applicationFilter: '',
    sortBy: 'name',
    sortOrder: SortDirection.ASC,
    
    // Actions
    setRepositories: (repositories: Repository[]) => set({ repositories }),
    setApplications: (applications: Application[]) => set({ applications }),
    setGiteaActions: (giteaActions: GiteaAction[]) => set({ giteaActions }),
    setContainerImages: (containerImages: ContainerImage[]) => set({ containerImages }),
    setDeploymentHistory: (deploymentHistory: DeploymentHistory[]) => set({ deploymentHistory }),
    
    setLoading: (isLoading: boolean) => set({ isLoading }),
    setCreating: (isCreating: boolean) => set({ isCreating }),
    setSyncing: (isSyncing: boolean) => set({ isSyncing }),
    setDeploying: (isDeploying: boolean) => set({ isDeploying }),
    setError: (error: string | null) => set({ error }),
    
    setRepositoryFilter: (filter: string) => set({ repositoryFilter: filter }),
    setApplicationFilter: (filter: string) => set({ applicationFilter: filter }),
    setSortBy: (sortBy: string) => set({ sortBy }),
    setSortOrder: (sortOrder: SortDirection) => set({ sortOrder }),
    
    // Fetch repositories
    fetchRepositories: async () => {
      set({ isLoading: true, error: null });
      
      try {
        if (MOCK_ENABLED) {
          const repositories = await mockApiResponse(mockRepositories);
          set({ 
            repositories,
            isLoading: false 
          });
          return;
        }

        const response = await fetch(API_ENDPOINTS.GITOPS.REPOSITORIES, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          },
        });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch repositories: ${response.statusText}`);
        }
        
        const data = await response.json();
        set({ 
          repositories: data.repositories || [],
          isLoading: false 
        });
      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : 'Unknown error',
          isLoading: false 
        });
      }
    },
    
    // Create repository
    createRepository: async (repositoryData: CreateRepositoryRequest) => {
      set({ isCreating: true, error: null });
      
      try {
        const response = await fetch(API_ENDPOINTS.GITOPS.REPOSITORIES, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          },
          body: JSON.stringify(repositoryData),
        });
        
        if (!response.ok) {
          throw new Error(`Failed to create repository: ${response.statusText}`);
        }
        
        const newRepository = await response.json();
        const { repositories } = get();
        set({ 
          repositories: [...repositories, newRepository],
          isCreating: false 
        });
        
        return newRepository;
      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : 'Unknown error',
          isCreating: false 
        });
        throw error;
      }
    },
    
    // Delete repository
    deleteRepository: async (repositoryId: string) => {
      try {
        const response = await fetch(API_ENDPOINTS.GITOPS.REPOSITORY(repositoryId), {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          },
        });
        
        if (!response.ok) {
          throw new Error(`Failed to delete repository: ${response.statusText}`);
        }
        
        const { repositories } = get();
        set({ 
          repositories: repositories.filter(repo => repo.id !== repositoryId)
        });
      } catch (error) {
        set({ error: error instanceof Error ? error.message : 'Unknown error' });
        throw error;
      }
    },
    
    // Sync repository
    syncRepository: async (repositoryId: string) => {
      set({ isSyncing: true, error: null });
      
      try {
        const response = await fetch(API_ENDPOINTS.GITOPS.REPOSITORY_SYNC(repositoryId), {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          },
        });
        
        if (!response.ok) {
          throw new Error(`Failed to sync repository: ${response.statusText}`);
        }
        
        // Refresh repositories to get updated sync status
        await get().fetchRepositories();
        set({ isSyncing: false });
      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : 'Unknown error',
          isSyncing: false 
        });
        throw error;
      }
    },
    
    // Fetch applications
    fetchApplications: async () => {
      try {
        if (MOCK_ENABLED) {
          const applications = await mockApiResponse(mockApplications);
          set({ applications });
          return;
        }

        const response = await fetch(API_ENDPOINTS.GITOPS.APPLICATIONS, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          },
        });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch applications: ${response.statusText}`);
        }
        
        const data = await response.json();
        set({ applications: data.applications || [] });
      } catch (error) {
        set({ error: error instanceof Error ? error.message : 'Unknown error' });
      }
    },
    
    // Create application
    createApplication: async (applicationData: CreateApplicationRequest) => {
      set({ isCreating: true, error: null });
      
      try {
        const response = await fetch(API_ENDPOINTS.GITOPS.APPLICATIONS, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          },
          body: JSON.stringify(applicationData),
        });
        
        if (!response.ok) {
          throw new Error(`Failed to create application: ${response.statusText}`);
        }
        
        const newApplication = await response.json();
        const { applications } = get();
        set({ 
          applications: [...applications, newApplication],
          isCreating: false 
        });
        
        return newApplication;
      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : 'Unknown error',
          isCreating: false 
        });
        throw error;
      }
    },
    
    // Delete application
    deleteApplication: async (applicationId: string) => {
      try {
        const response = await fetch(API_ENDPOINTS.GITOPS.APPLICATION(applicationId), {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          },
        });
        
        if (!response.ok) {
          throw new Error(`Failed to delete application: ${response.statusText}`);
        }
        
        const { applications } = get();
        set({ 
          applications: applications.filter(app => app.id !== applicationId)
        });
      } catch (error) {
        set({ error: error instanceof Error ? error.message : 'Unknown error' });
        throw error;
      }
    },
    
    // Sync application
    syncApplication: async (applicationId: string) => {
      set({ isSyncing: true, error: null });
      
      try {
        const response = await fetch(API_ENDPOINTS.GITOPS.APPLICATION_SYNC(applicationId), {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          },
        });
        
        if (!response.ok) {
          throw new Error(`Failed to sync application: ${response.statusText}`);
        }
        
        // Refresh applications to get updated sync status
        await get().fetchApplications();
        set({ isSyncing: false });
      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : 'Unknown error',
          isSyncing: false 
        });
        throw error;
      }
    },

    // Mirror sync trigger (GitHub → Gitea)
    triggerMirrorSync: async (repositoryId: string) => {
      set({ isSyncing: true, error: null });
      
      try {
        const response = await fetch(API_ENDPOINTS.GITOPS.MIRROR_SYNC(repositoryId), {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          },
        });
        
        if (!response.ok) {
          throw new Error(`Failed to trigger mirror sync: ${response.statusText}`);
        }
        
        // Refresh repositories to get updated sync status
        await get().fetchRepositories();
        set({ isSyncing: false });
      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : 'Unknown error',
          isSyncing: false 
        });
        throw error;
      }
    },

    // Pull repository latest changes
    pullRepository: async (repositoryId: string) => {
      set({ isSyncing: true, error: null });
      
      try {
        const response = await fetch(API_ENDPOINTS.GITOPS.REPOSITORY_PULL(repositoryId), {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          },
        });
        
        if (!response.ok) {
          throw new Error(`Failed to pull repository: ${response.statusText}`);
        }
        
        // Refresh repositories to get updated status
        await get().fetchRepositories();
        set({ isSyncing: false });
      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : 'Unknown error',
          isSyncing: false 
        });
        throw error;
      }
    },

    // Get repository status and commit history
    getRepositoryStatus: async (repositoryId: string): Promise<RepositoryStatus> => {
      try {
        const response = await fetch(API_ENDPOINTS.GITOPS.REPOSITORY_STATUS(repositoryId), {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          },
        });
        
        if (!response.ok) {
          throw new Error(`Failed to get repository status: ${response.statusText}`);
        }
        
        return await response.json();
      } catch (error) {
        set({ error: error instanceof Error ? error.message : 'Unknown error' });
        throw error;
      }
    },

    // Commit and push changes
    commitAndPush: async (repositoryId: string, commitData: CommitRequest) => {
      set({ isSyncing: true, error: null });
      
      try {
        const response = await fetch(API_ENDPOINTS.GITOPS.REPOSITORY_COMMIT(repositoryId), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          },
          body: JSON.stringify(commitData),
        });
        
        if (!response.ok) {
          throw new Error(`Failed to commit and push: ${response.statusText}`);
        }
        
        // Refresh repositories to get updated status
        await get().fetchRepositories();
        set({ isSyncing: false });
      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : 'Unknown error',
          isSyncing: false 
        });
        throw error;
      }
    },

    // Get repository diff
    getRepositoryDiff: async (repositoryId: string, path?: string): Promise<DiffResponse> => {
      try {
        const url = new URL(API_ENDPOINTS.GITOPS.REPOSITORY_DIFF(repositoryId), window.location.origin);
        if (path) {
          url.searchParams.set('path', path);
        }

        const response = await fetch(url.toString(), {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          },
        });
        
        if (!response.ok) {
          throw new Error(`Failed to get repository diff: ${response.statusText}`);
        }
        
        return await response.json();
      } catch (error) {
        set({ error: error instanceof Error ? error.message : 'Unknown error' });
        throw error;
      }
    },

    // Deploy application with specific image
    deployApplication: async (applicationId: string, imageId: string) => {
      set({ isDeploying: true, error: null });
      
      try {
        const response = await fetch(API_ENDPOINTS.GITOPS.APPLICATION_DEPLOY(applicationId), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          },
          body: JSON.stringify({ image_id: imageId }),
        });
        
        if (!response.ok) {
          throw new Error(`Failed to deploy application: ${response.statusText}`);
        }
        
        // Refresh applications and deployment history
        await Promise.all([
          get().fetchApplications(),
          get().fetchDeploymentHistory(applicationId)
        ]);
        set({ isDeploying: false });
      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : 'Unknown error',
          isDeploying: false 
        });
        throw error;
      }
    },

    // Rollback application to previous deployment
    rollbackApplication: async (applicationId: string, deploymentId: string) => {
      set({ isDeploying: true, error: null });
      
      try {
        const response = await fetch(API_ENDPOINTS.GITOPS.APPLICATION_ROLLBACK(applicationId), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          },
          body: JSON.stringify({ deployment_id: deploymentId }),
        });
        
        if (!response.ok) {
          throw new Error(`Failed to rollback application: ${response.statusText}`);
        }
        
        // Refresh applications and deployment history
        await Promise.all([
          get().fetchApplications(),
          get().fetchDeploymentHistory(applicationId)
        ]);
        set({ isDeploying: false });
      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : 'Unknown error',
          isDeploying: false 
        });
        throw error;
      }
    },

    // Fetch Gitea Actions
    fetchGiteaActions: async (repositoryId?: string) => {
      try {
        if (MOCK_ENABLED) {
          let actions = await mockApiResponse(mockGiteaActions);
          if (repositoryId) {
            actions = actions.filter(action => action.repository_id === repositoryId);
          }
          set({ giteaActions: actions });
          return;
        }

        const url = repositoryId 
          ? API_ENDPOINTS.GITEA.ACTIONS_BY_REPO(repositoryId)
          : API_ENDPOINTS.GITEA.ACTIONS;
          
        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          },
        });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch Gitea actions: ${response.statusText}`);
        }
        
        const data = await response.json();
        set({ giteaActions: data });
      } catch (error) {
        set({ error: error instanceof Error ? error.message : 'Unknown error' });
        throw error;
      }
    },

    // Trigger Gitea Action
    triggerGiteaAction: async (repositoryId: string, workflowName: string) => {
      try {
        const response = await fetch(API_ENDPOINTS.GITEA.TRIGGER_ACTION(repositoryId), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          },
          body: JSON.stringify({ workflow: workflowName }),
        });
        
        if (!response.ok) {
          throw new Error(`Failed to trigger Gitea action: ${response.statusText}`);
        }
        
        // Refresh actions
        await get().fetchGiteaActions(repositoryId);
      } catch (error) {
        set({ error: error instanceof Error ? error.message : 'Unknown error' });
        throw error;
      }
    },

    // Get action logs
    getActionLogs: async (actionId: string): Promise<string> => {
      try {
        const response = await fetch(API_ENDPOINTS.GITEA.ACTION_LOGS(actionId), {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          },
        });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch action logs: ${response.statusText}`);
        }
        
        return await response.text();
      } catch (error) {
        set({ error: error instanceof Error ? error.message : 'Unknown error' });
        throw error;
      }
    },

    // Fetch container images
    fetchContainerImages: async (repositoryId?: string) => {
      try {
        if (MOCK_ENABLED) {
          let images = await mockApiResponse(mockContainerImages);
          if (repositoryId) {
            images = images.filter(image => image.repository_id === repositoryId);
          }
          set({ containerImages: images });
          return;
        }

        const url = repositoryId 
          ? API_ENDPOINTS.GITEA.IMAGES_BY_REPO(repositoryId)
          : API_ENDPOINTS.GITEA.IMAGES;
          
        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          },
        });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch container images: ${response.statusText}`);
        }
        
        const data = await response.json();
        set({ containerImages: data });
      } catch (error) {
        set({ error: error instanceof Error ? error.message : 'Unknown error' });
        throw error;
      }
    },

    // Get images by repository
    getImagesByRepository: (repositoryId: string) => {
      const { containerImages } = get();
      return containerImages.filter(image => image.repository_id === repositoryId);
    },

    // Get latest image for repository
    getLatestImage: (repositoryId: string, tag: string = 'latest') => {
      const images = get().getImagesByRepository(repositoryId);
      const latestImages = images.filter(image => image.tag === tag);
      return latestImages.sort((a, b) => 
        new Date(b.pushed_at).getTime() - new Date(a.pushed_at).getTime()
      )[0] || null;
    },

    // Fetch deployment history
    fetchDeploymentHistory: async (applicationId?: string) => {
      try {
        if (MOCK_ENABLED) {
          let history = await mockApiResponse(mockDeploymentHistory);
          if (applicationId) {
            history = history.filter(deployment => deployment.application_id === applicationId);
          }
          set({ deploymentHistory: history });
          return;
        }

        const url = applicationId 
          ? API_ENDPOINTS.GITOPS.DEPLOYMENT_HISTORY_BY_APP(applicationId)
          : API_ENDPOINTS.GITOPS.DEPLOYMENT_HISTORY;
          
        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          },
        });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch deployment history: ${response.statusText}`);
        }
        
        const data = await response.json();
        set({ deploymentHistory: data });
      } catch (error) {
        set({ error: error instanceof Error ? error.message : 'Unknown error' });
        throw error;
      }
    },

    // Get deployments by application
    getDeploymentsByApplication: (applicationId: string) => {
      const { deploymentHistory } = get();
      return deploymentHistory.filter(deployment => deployment.application_id === applicationId);
    },
    
    // Get filtered and sorted repositories
    getFilteredRepositories: () => {
      const { repositories, repositoryFilter, sortBy, sortOrder } = get();
      
      let filtered = repositories;
      
      if (repositoryFilter) {
        filtered = repositories.filter(repo => 
          repo.name.toLowerCase().includes(repositoryFilter.toLowerCase()) ||
          repo.url.toLowerCase().includes(repositoryFilter.toLowerCase())
        );
      }
      
      filtered.sort((a, b) => {
        let aValue: any = (a as any)[sortBy];
        let bValue: any = (b as any)[sortBy];
        
        if (sortBy === 'last_sync') {
          aValue = new Date(aValue || 0);
          bValue = new Date(bValue || 0);
        }
        
        if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
      
      return filtered;
    },
    
    // Get filtered and sorted applications
    getFilteredApplications: () => {
      const { applications, applicationFilter, sortBy, sortOrder } = get();
      
      let filtered = applications;
      
      if (applicationFilter) {
        filtered = applications.filter(app => 
          app.name.toLowerCase().includes(applicationFilter.toLowerCase()) ||
          app.namespace.toLowerCase().includes(applicationFilter.toLowerCase())
        );
      }
      
      filtered.sort((a, b) => {
        let aValue: any = (a as any)[sortBy];
        let bValue: any = (b as any)[sortBy];
        
        if (sortBy === 'last_sync') {
          aValue = new Date(aValue || 0);
          bValue = new Date(bValue || 0);
        }
        
        if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
      
      return filtered;
    },
    
    // Clear all data
    clearGitOps: () => set({
      repositories: [],
      applications: [],
      giteaActions: [],
      containerImages: [],
      deploymentHistory: [],
      error: null,
    }),
  }))
);

export default useGitOpsStore;
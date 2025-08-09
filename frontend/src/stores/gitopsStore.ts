import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type { GitOpsStore, Repository, Application, CreateRepositoryRequest, CreateApplicationRequest } from '../types/gitops';

const useGitOpsStore = create<GitOpsStore>()(
  subscribeWithSelector((set, get) => ({
    // Repository data
    repositories: [],
    applications: [],
    
    // Loading states
    isLoading: false,
    isCreating: false,
    isSyncing: false,
    error: null,
    
    // Filters and sorting
    repositoryFilter: '',
    applicationFilter: '',
    sortBy: 'name',
    sortOrder: 'asc',
    
    // Actions
    setRepositories: (repositories: Repository[]) => set({ repositories }),
    setApplications: (applications: Application[]) => set({ applications }),
    
    setLoading: (isLoading: boolean) => set({ isLoading }),
    setCreating: (isCreating: boolean) => set({ isCreating }),
    setSyncing: (isSyncing: boolean) => set({ isSyncing }),
    setError: (error: string | null) => set({ error }),
    
    setRepositoryFilter: (filter: string) => set({ repositoryFilter: filter }),
    setApplicationFilter: (filter: string) => set({ applicationFilter: filter }),
    setSortBy: (sortBy: string) => set({ sortBy }),
    setSortOrder: (sortOrder: 'asc' | 'desc') => set({ sortOrder }),
    
    // Fetch repositories
    fetchRepositories: async () => {
      set({ isLoading: true, error: null });
      
      try {
        const response = await fetch('/api/gitops/repositories', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
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
        const response = await fetch('/api/gitops/repositories', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
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
        const response = await fetch(`/api/gitops/repositories/${repositoryId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
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
        const response = await fetch(`/api/gitops/repositories/${repositoryId}/sync`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
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
        const response = await fetch('/api/gitops/applications', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
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
        const response = await fetch('/api/gitops/applications', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
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
        const response = await fetch(`/api/gitops/applications/${applicationId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
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
        const response = await fetch(`/api/gitops/applications/${applicationId}/sync`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
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
      error: null,
    }),
  }))
);

export default useGitOpsStore;
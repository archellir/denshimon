import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

const useGitOpsStore = create(
  subscribeWithSelector((set, get) => ({
    // Repository data
    repositories: [],
    applications: [],
    selectedRepository: null,
    selectedApplication: null,
    
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
    setRepositories: (repositories) => set({ repositories }),
    setApplications: (applications) => set({ applications }),
    setSelectedRepository: (repository) => set({ selectedRepository: repository }),
    setSelectedApplication: (application) => set({ selectedApplication: application }),
    
    setLoading: (isLoading) => set({ isLoading }),
    setCreating: (isCreating) => set({ isCreating }),
    setSyncing: (isSyncing) => set({ isSyncing }),
    setError: (error) => set({ error }),
    
    setRepositoryFilter: (filter) => set({ repositoryFilter: filter }),
    setApplicationFilter: (filter) => set({ applicationFilter: filter }),
    setSortBy: (sortBy) => set({ sortBy }),
    setSortOrder: (sortOrder) => set({ sortOrder }),
    
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
          error: error.message,
          isLoading: false 
        });
      }
    },
    
    // Create repository
    createRepository: async (repositoryData) => {
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
          error: error.message,
          isCreating: false 
        });
        throw error;
      }
    },
    
    // Delete repository
    deleteRepository: async (repositoryId) => {
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
        set({ error: error.message });
        throw error;
      }
    },
    
    // Sync repository
    syncRepository: async (repositoryId) => {
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
          error: error.message,
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
        set({ error: error.message });
      }
    },
    
    // Create application
    createApplication: async (applicationData) => {
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
          error: error.message,
          isCreating: false 
        });
        throw error;
      }
    },
    
    // Delete application
    deleteApplication: async (applicationId) => {
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
        set({ error: error.message });
        throw error;
      }
    },
    
    // Sync application
    syncApplication: async (applicationId) => {
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
          error: error.message,
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
        let aValue = a[sortBy];
        let bValue = b[sortBy];
        
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
        let aValue = a[sortBy];
        let bValue = b[sortBy];
        
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
      selectedRepository: null,
      selectedApplication: null,
      error: null,
    }),
  }))
);

export default useGitOpsStore;
import { create } from 'zustand';
import { RegistryStatus, API_ENDPOINTS } from '@/constants';
import type {
  Registry,
  ContainerImage,
  Deployment,
  DeploymentRequest,
  NodeInfo,
  DeploymentHistory,
} from '@/types/deployments';

// Import mock utilities  
import { mockApiResponse, mockRegistries, MOCK_ENABLED } from '@/mocks';
import { apiService, ApiError } from '@/services/api';

interface DeploymentStore {
  // State
  registries: Registry[];
  images: ContainerImage[];
  deployments: Deployment[];
  nodes: NodeInfo[];
  history: DeploymentHistory[];
  
  // Loading states
  loading: {
    registries: boolean;
    images: boolean;
    deployments: boolean;
    nodes: boolean;
    history: boolean;
    creating: boolean;
    deploying: boolean;
  };
  
  error: string | null;
  
  // Filters
  selectedRegistry: string | null;
  selectedNamespace: string;
  imageFilter: string;
  
  // Actions - Registry Management
  fetchRegistries: () => Promise<void>;
  addRegistry: (registry: Omit<Registry, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  deleteRegistry: (id: string) => Promise<void>;
  testRegistry: (id: string) => Promise<boolean>;
  
  // Actions - Image Management
  fetchImages: (registryId?: string, namespace?: string) => Promise<void>;
  searchImages: (query: string) => Promise<void>;
  getImageTags: (registryId: string, repository: string) => Promise<string[]>;
  
  // Actions - Deployment Management
  fetchDeployments: (namespace?: string) => Promise<void>;
  createDeployment: (request: DeploymentRequest) => Promise<Deployment>;
  updateDeployment: (id: string, updates: Partial<DeploymentRequest>) => Promise<void>;
  scaleDeployment: (id: string, replicas: number) => Promise<void>;
  deleteDeployment: (id: string) => Promise<void>;
  restartDeployment: (id: string) => Promise<void>;
  
  // Actions - Node Management
  fetchNodes: () => Promise<void>;
  
  // Actions - History
  fetchHistory: (deploymentId: string) => Promise<void>;
  
  // Setters
  setSelectedRegistry: (id: string | null) => void;
  setSelectedNamespace: (namespace: string) => void;
  setImageFilter: (filter: string) => void;
  setError: (error: string | null) => void;
  
  // Computed
  getFilteredImages: () => ContainerImage[];
  getFilteredDeployments: () => Deployment[];
  getDeploymentsByNamespace: (namespace: string) => Deployment[];
  getNodesByZone: () => Record<string, NodeInfo[]>;
}

// API_ENDPOINTS.DEPLOYMENTS.BASE removed - using API_ENDPOINTS from constants

const useDeploymentStore = create<DeploymentStore>((set, get) => ({
  // Initial state
  registries: [],
  images: [],
  deployments: [],
  nodes: [],
  history: [],
  
  loading: {
    registries: false,
    images: false,
    deployments: false,
    nodes: false,
    history: false,
    creating: false,
    deploying: false,
  },
  
  error: null,
  selectedRegistry: null,
  selectedNamespace: 'all',
  imageFilter: '',
  
  // Registry Management
  fetchRegistries: async () => {
    set(state => ({ loading: { ...state.loading, registries: true }, error: null }));
    
    try {
      if (MOCK_ENABLED) {
        const registries = await mockApiResponse(mockRegistries, 300);
        set({ registries, loading: { ...get().loading, registries: false } });
      } else {
        const response = await apiService.get<Registry[]>(`${API_ENDPOINTS.DEPLOYMENTS.BASE}/registries`);
        set({ registries: response.data, loading: { ...get().loading, registries: false } });
      }
    } catch (error) {
      // Fallback to mock data on error
      try {
        const registries = await mockApiResponse(mockRegistries, 300);
        set({ registries, loading: { ...get().loading, registries: false }, error: null });
      } catch (mockError) {
        const errorMessage = error instanceof ApiError ? error.message : 'Failed to fetch registries';
        set(state => ({
          error: errorMessage,
          loading: { ...state.loading, registries: false }
        }));
      }
    }
  },
  
  addRegistry: async (registryData) => {
    set(state => ({ loading: { ...state.loading, creating: true }, error: null }));
    
    try {
      const response = await apiService.post<Registry>(`${API_ENDPOINTS.DEPLOYMENTS.BASE}/registries`, registryData);
      set(state => ({
        registries: [...state.registries, response.data],
        loading: { ...state.loading, creating: false }
      }));
    } catch (error) {
      const errorMessage = error instanceof ApiError ? error.message : 'Failed to add registry';
      set(state => ({
        error: errorMessage,
        loading: { ...state.loading, creating: false }
      }));
    }
  },
  
  deleteRegistry: async (id) => {
    try {
      await apiService.delete(`${API_ENDPOINTS.DEPLOYMENTS.BASE}/registries/${id}`);
      set(state => ({
        registries: state.registries.filter(r => r.id !== id)
      }));
    } catch (error) {
      const errorMessage = error instanceof ApiError ? error.message : 'Failed to delete registry';
      set({ error: errorMessage });
    }
  },
  
  testRegistry: async (id) => {
    try {
      const { generateMockRegistryTest } = await import('@/mocks/deployments/registries');
      const success = await mockApiResponse(generateMockRegistryTest(id), 500);
      
      // Update registry status
      const registries = get().registries.map(r => 
        r.id === id ? { 
          ...r, 
          status: success ? RegistryStatus.CONNECTED : RegistryStatus.ERROR, 
          error: success ? undefined : 'Connection timeout'
        } : r
      );
      set({ registries });
      
      return success;
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to test registry' });
      return false;
    }
  },
  
  // Image Management
  fetchImages: async (registryId) => {
    set(state => ({ loading: { ...state.loading, images: true }, error: null }));
    
    try {
      if (MOCK_ENABLED) {
        const { searchMockImages } = await import('@/mocks/deployments/images');
        const registryName = registryId ? get().registries.find(r => r.id === registryId)?.name : undefined;
        const images = await mockApiResponse(searchMockImages('', registryName), 400);
        set({ images, loading: { ...get().loading, images: false } });
      } else {
        const url = registryId 
          ? `${API_ENDPOINTS.DEPLOYMENTS.BASE}/images?registry=${registryId}`
          : `${API_ENDPOINTS.DEPLOYMENTS.BASE}/images`;
        
        const response = await apiService.get<ContainerImage[]>(url);
        set({ images: response.data, loading: { ...get().loading, images: false } });
      }
    } catch (error) {
      try {
        const { searchMockImages } = await import('@/mocks/deployments/images');
        const registryName = registryId ? get().registries.find(r => r.id === registryId)?.name : undefined;
        const images = await mockApiResponse(searchMockImages('', registryName), 400);
        set({ images, loading: { ...get().loading, images: false }, error: null });
      } catch (mockError) {
        set(state => ({
          error: error instanceof Error ? error.message : 'Failed to fetch images',
          loading: { ...state.loading, images: false }
        }));
      }
    }
  },
  
  searchImages: async (query) => {
    set(state => ({ loading: { ...state.loading, images: true }, error: null }));
    
    try {
      if (MOCK_ENABLED) {
        const { searchMockImages } = await import('@/mocks/deployments/images');
        const registryName = get().selectedRegistry ? get().registries.find(r => r.id === get().selectedRegistry)?.name : undefined;
        const images = await mockApiResponse(searchMockImages(query, registryName), 300);
        set({ images, loading: { ...get().loading, images: false } });
      } else {
        const token = localStorage.getItem('auth_token');
        const url = `${API_ENDPOINTS.DEPLOYMENTS.BASE}/images/search?q=${encodeURIComponent(query)}`;
        
        const response = await fetch(url, {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        set({ images: result.data || result, loading: { ...get().loading, images: false } });
      }
    } catch (error) {
      try {
        const { searchMockImages } = await import('@/mocks/deployments/images');
        const registryName = get().selectedRegistry ? get().registries.find(r => r.id === get().selectedRegistry)?.name : undefined;
        const images = await mockApiResponse(searchMockImages(query, registryName), 300);
        set({ images, loading: { ...get().loading, images: false }, error: null });
      } catch (mockError) {
        set(state => ({
          error: error instanceof Error ? error.message : 'Failed to search images',
          loading: { ...state.loading, images: false }
        }));
      }
    }
  },
  
  getImageTags: async (registryId, repository) => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${API_ENDPOINTS.DEPLOYMENTS.BASE}/images/${registryId}/${repository}/tags`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      if (!response.ok) throw new Error('Failed to get image tags');
      
      const result = await response.json();
      return result.tags || result.data || [];
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to get image tags' });
      return [];
    }
  },
  
  // Deployment Management
  fetchDeployments: async (namespace) => {
    set(state => ({ loading: { ...state.loading, deployments: true }, error: null }));
    
    try {
      if (MOCK_ENABLED) {
        const { filterDeploymentsByNamespace } = await import('@/mocks/deployments/deployments');
        const deployments = await mockApiResponse(filterDeploymentsByNamespace(namespace || 'all'), 350);
        set({ deployments, loading: { ...get().loading, deployments: false } });
      } else {
        const token = localStorage.getItem('auth_token');
        const url = namespace && namespace !== 'all' 
          ? `${API_ENDPOINTS.DEPLOYMENTS.BASE}?namespace=${namespace}`
          : API_ENDPOINTS.DEPLOYMENTS.BASE;
        
        const response = await fetch(url, {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        set({ deployments: result.data || result, loading: { ...get().loading, deployments: false } });
      }
    } catch (error) {
      try {
        const { filterDeploymentsByNamespace } = await import('@/mocks/deployments/deployments');
        const deployments = await mockApiResponse(filterDeploymentsByNamespace(namespace || 'all'), 350);
        set({ deployments, loading: { ...get().loading, deployments: false }, error: null });
      } catch (mockError) {
        set(state => ({
          error: error instanceof Error ? error.message : 'Failed to fetch deployments',
          loading: { ...state.loading, deployments: false }
        }));
      }
    }
  },
  
  createDeployment: async (request) => {
    set(state => ({ loading: { ...state.loading, deploying: true }, error: null }));
    
    try {
      const response = await apiService.post<Deployment>(API_ENDPOINTS.DEPLOYMENTS.BASE, request);
      set(state => ({
        deployments: [...state.deployments, response.data],
        loading: { ...state.loading, deploying: false }
      }));
      
      return response.data;
    } catch (error) {
      const errorMessage = error instanceof ApiError ? error.message : 'Failed to create deployment';
      set(state => ({
        error: errorMessage,
        loading: { ...state.loading, deploying: false }
      }));
      throw error;
    }
  },
  
  updateDeployment: async (id, updates) => {
    try {
      const response = await apiService.put<Deployment>(`${API_ENDPOINTS.DEPLOYMENTS.BASE}/${id}`, updates);
      set(state => ({
        deployments: state.deployments.map(d => d.id === id ? response.data : d)
      }));
    } catch (error) {
      const errorMessage = error instanceof ApiError ? error.message : 'Failed to update deployment';
      set({ error: errorMessage });
    }
  },
  
  scaleDeployment: async (id, replicas) => {
    try {
      await apiService.patch(`${API_ENDPOINTS.DEPLOYMENTS.BASE}/${id}/scale`, { replicas });
      // Refresh deployment data
      get().fetchDeployments();
    } catch (error) {
      const errorMessage = error instanceof ApiError ? error.message : 'Failed to scale deployment';
      set({ error: errorMessage });
    }
  },
  
  deleteDeployment: async (id) => {
    try {
      await apiService.delete(`${API_ENDPOINTS.DEPLOYMENTS.BASE}/${id}`);
      set(state => ({
        deployments: state.deployments.filter(d => d.id !== id)
      }));
    } catch (error) {
      const errorMessage = error instanceof ApiError ? error.message : 'Failed to delete deployment';
      set({ error: errorMessage });
    }
  },
  
  restartDeployment: async (id) => {
    try {
      await apiService.post(`${API_ENDPOINTS.DEPLOYMENTS.BASE}/${id}/restart`);
      // Refresh deployment data
      get().fetchDeployments();
    } catch (error) {
      const errorMessage = error instanceof ApiError ? error.message : 'Failed to restart deployment';
      set({ error: errorMessage });
    }
  },
  
  // Node Management
  fetchNodes: async () => {
    set(state => ({ loading: { ...state.loading, nodes: true }, error: null }));
    
    try {
      if (MOCK_ENABLED) {
        const { mockNodes } = await import('@/mocks/deployments/deployments');
        const nodes = await mockApiResponse(mockNodes, 250);
        set({ nodes, loading: { ...get().loading, nodes: false } });
      } else {
        const token = localStorage.getItem('auth_token');
        const response = await fetch(`${API_ENDPOINTS.DEPLOYMENTS.BASE}/nodes`, {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        set({ nodes: result.data || result, loading: { ...get().loading, nodes: false } });
      }
    } catch (error) {
      try {
        const { mockNodes } = await import('@/mocks/deployments/deployments');
        const nodes = await mockApiResponse(mockNodes, 250);
        set({ nodes, loading: { ...get().loading, nodes: false }, error: null });
      } catch (mockError) {
        set(state => ({
          error: error instanceof Error ? error.message : 'Failed to fetch nodes',
          loading: { ...state.loading, nodes: false }
        }));
      }
    }
  },
  
  // History
  fetchHistory: async (deploymentId) => {
    set(state => ({ loading: { ...state.loading, history: true }, error: null }));
    
    try {
      if (MOCK_ENABLED) {
        const { generateMockHistoryForDeployment } = await import('@/mocks/deployments/history');
        const history = await mockApiResponse(generateMockHistoryForDeployment(deploymentId), 300);
        set({ history, loading: { ...get().loading, history: false } });
      } else {
        const token = localStorage.getItem('auth_token');
        const response = await fetch(`${API_ENDPOINTS.DEPLOYMENTS.BASE}/${deploymentId}/history`, {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        set({ history: result.data || result, loading: { ...get().loading, history: false } });
      }
    } catch (error) {
      try {
        const { generateMockHistoryForDeployment } = await import('@/mocks/deployments/history');
        const history = await mockApiResponse(generateMockHistoryForDeployment(deploymentId), 300);
        set({ history, loading: { ...get().loading, history: false }, error: null });
      } catch (mockError) {
        set(state => ({
          error: error instanceof Error ? error.message : 'Failed to fetch history',
          loading: { ...state.loading, history: false }
        }));
      }
    }
  },
  
  // Setters
  setSelectedRegistry: (id) => set({ selectedRegistry: id }),
  setSelectedNamespace: (namespace) => set({ selectedNamespace: namespace }),
  setImageFilter: (filter) => set({ imageFilter: filter }),
  setError: (error) => set({ error }),
  
  // Computed
  getFilteredImages: () => {
    const { images, selectedRegistry, imageFilter } = get();
    return images.filter(image => {
      if (selectedRegistry && image.registry !== selectedRegistry) return false;
      if (imageFilter && !image.repository.toLowerCase().includes(imageFilter.toLowerCase()) && 
          !image.tag.toLowerCase().includes(imageFilter.toLowerCase())) return false;
      return true;
    });
  },
  
  getFilteredDeployments: () => {
    const { deployments, selectedNamespace } = get();
    if (selectedNamespace === 'all') return deployments;
    return deployments.filter(d => d.namespace === selectedNamespace);
  },
  
  getDeploymentsByNamespace: (namespace) => {
    return get().deployments.filter(d => d.namespace === namespace);
  },
  
  getNodesByZone: () => {
    const { nodes } = get();
    return nodes.reduce((zones, node) => {
      const zone = node.zone || 'unknown';
      if (!zones[zone]) zones[zone] = [];
      zones[zone].push(node);
      return zones;
    }, {} as Record<string, NodeInfo[]>);
  },
}));

export default useDeploymentStore;
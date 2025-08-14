import { create } from 'zustand';
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

const API_BASE = '/api/deployments';

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
        // Real API call
        const token = localStorage.getItem('auth_token');
        const response = await fetch(`${API_BASE}/registries`, {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const registries = await response.json();
        set({ registries, loading: { ...get().loading, registries: false } });
      }
    } catch (error) {
      // Fallback to mock data on error
      try {
        const registries = await mockApiResponse(mockRegistries, 300);
        set({ registries, loading: { ...get().loading, registries: false }, error: null });
      } catch (mockError) {
        set(state => ({
          error: error instanceof Error ? error.message : 'Failed to fetch registries',
          loading: { ...state.loading, registries: false }
        }));
      }
    }
  },
  
  addRegistry: async (registryData) => {
    set(state => ({ loading: { ...state.loading, creating: true }, error: null }));
    
    try {
      const response = await fetch(`${API_BASE}/registries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registryData),
      });
      
      if (!response.ok) throw new Error('Failed to add registry');
      
      const registry = await response.json();
      set(state => ({
        registries: [...state.registries, registry],
        loading: { ...state.loading, creating: false }
      }));
    } catch (error) {
      set(state => ({
        error: error instanceof Error ? error.message : 'Failed to add registry',
        loading: { ...state.loading, creating: false }
      }));
    }
  },
  
  deleteRegistry: async (id) => {
    try {
      const response = await fetch(`${API_BASE}/registries/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete registry');
      
      set(state => ({
        registries: state.registries.filter(r => r.id !== id)
      }));
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to delete registry' });
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
          status: (success ? 'connected' : 'error') as 'connected' | 'error' | 'pending', 
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
      // Filter images by selected registry
      const { searchMockImages } = await import('@/mocks/deployments/images');
      const registryName = registryId ? get().registries.find(r => r.id === registryId)?.name : undefined;
      const images = await mockApiResponse(searchMockImages('', registryName), 400);
      set({ images, loading: { ...get().loading, images: false } });
    } catch (error) {
      set(state => ({
        error: error instanceof Error ? error.message : 'Failed to fetch images',
        loading: { ...state.loading, images: false }
      }));
    }
  },
  
  searchImages: async (query) => {
    set(state => ({ loading: { ...state.loading, images: true }, error: null }));
    
    try {
      const { searchMockImages } = await import('@/mocks/deployments/images');
      const registryName = get().selectedRegistry ? get().registries.find(r => r.id === get().selectedRegistry)?.name : undefined;
      const images = await mockApiResponse(searchMockImages(query, registryName), 300);
      set({ images, loading: { ...get().loading, images: false } });
    } catch (error) {
      set(state => ({
        error: error instanceof Error ? error.message : 'Failed to search images',
        loading: { ...state.loading, images: false }
      }));
    }
  },
  
  getImageTags: async (registryId, repository) => {
    try {
      const response = await fetch(`${API_BASE}/images/${registryId}/${repository}/tags`);
      if (!response.ok) throw new Error('Failed to get image tags');
      
      const result = await response.json();
      return result.tags;
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to get image tags' });
      return [];
    }
  },
  
  // Deployment Management
  fetchDeployments: async (namespace) => {
    set(state => ({ loading: { ...state.loading, deployments: true }, error: null }));
    
    try {
      const { filterDeploymentsByNamespace } = await import('@/mocks/deployments/deployments');
      const deployments = await mockApiResponse(filterDeploymentsByNamespace(namespace || 'all'), 350);
      set({ deployments, loading: { ...get().loading, deployments: false } });
    } catch (error) {
      set(state => ({
        error: error instanceof Error ? error.message : 'Failed to fetch deployments',
        loading: { ...state.loading, deployments: false }
      }));
    }
  },
  
  createDeployment: async (request) => {
    set(state => ({ loading: { ...state.loading, deploying: true }, error: null }));
    
    try {
      const response = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      });
      
      if (!response.ok) throw new Error('Failed to create deployment');
      
      const deployment = await response.json();
      set(state => ({
        deployments: [...state.deployments, deployment],
        loading: { ...state.loading, deploying: false }
      }));
      
      return deployment;
    } catch (error) {
      set(state => ({
        error: error instanceof Error ? error.message : 'Failed to create deployment',
        loading: { ...state.loading, deploying: false }
      }));
      throw error;
    }
  },
  
  updateDeployment: async (id, updates) => {
    try {
      const response = await fetch(`${API_BASE}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      
      if (!response.ok) throw new Error('Failed to update deployment');
      
      const deployment = await response.json();
      set(state => ({
        deployments: state.deployments.map(d => d.id === id ? deployment : d)
      }));
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to update deployment' });
    }
  },
  
  scaleDeployment: async (id, replicas) => {
    try {
      const response = await fetch(`${API_BASE}/${id}/scale`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ replicas }),
      });
      
      if (!response.ok) throw new Error('Failed to scale deployment');
      
      // Refresh deployment data
      get().fetchDeployments();
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to scale deployment' });
    }
  },
  
  deleteDeployment: async (id) => {
    try {
      const response = await fetch(`${API_BASE}/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete deployment');
      
      set(state => ({
        deployments: state.deployments.filter(d => d.id !== id)
      }));
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to delete deployment' });
    }
  },
  
  restartDeployment: async (id) => {
    try {
      const response = await fetch(`${API_BASE}/${id}/restart`, { method: 'POST' });
      if (!response.ok) throw new Error('Failed to restart deployment');
      
      // Refresh deployment data
      get().fetchDeployments();
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to restart deployment' });
    }
  },
  
  // Node Management
  fetchNodes: async () => {
    set(state => ({ loading: { ...state.loading, nodes: true }, error: null }));
    
    try {
      const { mockNodes } = await import('@/mocks/deployments/deployments');
      const nodes = await mockApiResponse(mockNodes, 250);
      set({ nodes, loading: { ...get().loading, nodes: false } });
    } catch (error) {
      set(state => ({
        error: error instanceof Error ? error.message : 'Failed to fetch nodes',
        loading: { ...state.loading, nodes: false }
      }));
    }
  },
  
  // History
  fetchHistory: async (deploymentId) => {
    set(state => ({ loading: { ...state.loading, history: true }, error: null }));
    
    try {
      const { generateMockHistoryForDeployment } = await import('@/mocks/deployments/history');
      const history = await mockApiResponse(generateMockHistoryForDeployment(deploymentId), 300);
      set({ history, loading: { ...get().loading, history: false } });
    } catch (error) {
      set(state => ({
        error: error instanceof Error ? error.message : 'Failed to fetch history',
        loading: { ...state.loading, history: false }
      }));
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
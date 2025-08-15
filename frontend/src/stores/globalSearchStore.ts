import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { PrimaryTab, DeploymentsTab } from '@constants';

export interface SearchResult {
  id: string;
  type: 'pod' | 'node' | 'service' | 'namespace' | 'deployment' | 'endpoint' | 'registry' | 'image';
  name: string;
  namespace?: string;
  description?: string;
  location: {
    primaryTab: string;
    secondaryTab?: string;
  };
  matchedFields: string[];
  relevanceScore: number;
}

interface GlobalSearchState {
  isOpen: boolean;
  query: string;
  results: SearchResult[];
  isSearching: boolean;
  recentSearches: string[];
}

interface GlobalSearchActions {
  openSearch: () => void;
  closeSearch: () => void;
  setQuery: (query: string) => void;
  search: (query: string) => Promise<void>;
  selectResult: (result: SearchResult) => void;
  addRecentSearch: (query: string) => void;
  clearRecentSearches: () => void;
}

type GlobalSearchStore = GlobalSearchState & GlobalSearchActions;

const useGlobalSearchStore = create<GlobalSearchStore>()(
  subscribeWithSelector((set, get) => ({
    // State
    isOpen: false,
    query: '',
    results: [],
    isSearching: false,
    recentSearches: [],

    // Actions
    openSearch: () => set({ isOpen: true }),
    
    closeSearch: () => set({ 
      isOpen: false, 
      query: '', 
      results: [] 
    }),

    setQuery: (query: string) => set({ query }),

    search: async (query: string) => {
      if (!query.trim()) {
        set({ results: [] });
        return;
      }

      set({ isSearching: true });

      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 200));

      const results = await searchAllResources(query);
      
      set({ 
        results: results.sort((a, b) => b.relevanceScore - a.relevanceScore),
        isSearching: false 
      });
    },

    selectResult: (result: SearchResult) => {
      const { addRecentSearch, closeSearch } = get();
      addRecentSearch(result.name);
      closeSearch();
      
      // This will be handled by the Dashboard component
      // to navigate to the correct tab and filter
      window.dispatchEvent(new CustomEvent('globalSearchNavigate', {
        detail: result
      }));
    },

    addRecentSearch: (query: string) => {
      set(state => {
        const trimmedQuery = query.trim();
        if (!trimmedQuery) return state;
        
        const newRecent = [
          trimmedQuery,
          ...state.recentSearches.filter(q => q !== trimmedQuery)
        ].slice(0, 10); // Keep only last 10

        return { recentSearches: newRecent };
      });
    },

    clearRecentSearches: () => set({ recentSearches: [] }),
  }))
);

// Mock search function - in real app this would call APIs
async function searchAllResources(query: string): Promise<SearchResult[]> {
  const lowerQuery = query.toLowerCase();
  const results: SearchResult[] = [];

  // Import master data for consistency
  const { 
    MASTER_PODS, 
    MASTER_NODES, 
    MASTER_SERVICES, 
    MASTER_NAMESPACES, 
    MASTER_DEPLOYMENTS, 
    MASTER_ENDPOINTS,
    MASTER_REGISTRIES,
    MASTER_IMAGES
  } = await import('@mocks/masterData');

  // Convert master data to search format
  const mockResources = {
    pods: MASTER_PODS.map(pod => ({ name: pod.name, namespace: pod.namespace })),
    nodes: MASTER_NODES.map(name => ({ name })),
    services: MASTER_SERVICES.map(service => ({ name: service.name, namespace: service.namespace })),
    namespaces: MASTER_NAMESPACES.map(name => ({ name })),
    deployments: MASTER_DEPLOYMENTS.map(deployment => ({ name: deployment.name, namespace: deployment.namespace })),
    endpoints: MASTER_ENDPOINTS.map(endpoint => ({ name: endpoint.name, service: endpoint.service })),
    registries: MASTER_REGISTRIES.map(registry => ({ name: registry.name, type: registry.type, url: registry.url })),
    images: MASTER_IMAGES.map(image => ({ repository: image.repository, tag: image.tag, registry: image.registry })),
  };

  // Search pods
  mockResources.pods.forEach(pod => {
    const relevance = calculateRelevance(lowerQuery, pod.name, pod.namespace);
    if (relevance > 0) {
      results.push({
        id: `pod-${pod.name}`,
        type: 'pod',
        name: pod.name,
        namespace: pod.namespace,
        description: `Pod in ${pod.namespace} namespace`,
        location: {
          primaryTab: PrimaryTab.WORKLOADS,
          secondaryTab: 'pods'
        },
        matchedFields: getMatchedFields(lowerQuery, pod.name, pod.namespace),
        relevanceScore: relevance
      });
    }
  });

  // Search nodes
  mockResources.nodes.forEach(node => {
    const relevance = calculateRelevance(lowerQuery, node.name);
    if (relevance > 0) {
      results.push({
        id: `node-${node.name}`,
        type: 'node',
        name: node.name,
        description: 'Kubernetes node',
        location: {
          primaryTab: PrimaryTab.INFRASTRUCTURE,
          secondaryTab: 'nodes'
        },
        matchedFields: getMatchedFields(lowerQuery, node.name),
        relevanceScore: relevance
      });
    }
  });

  // Search services
  mockResources.services.forEach(service => {
    const relevance = calculateRelevance(lowerQuery, service.name, service.namespace);
    if (relevance > 0) {
      results.push({
        id: `service-${service.name}`,
        type: 'service',
        name: service.name,
        namespace: service.namespace,
        description: `Service in ${service.namespace} namespace`,
        location: {
          primaryTab: PrimaryTab.WORKLOADS,
          secondaryTab: 'services'
        },
        matchedFields: getMatchedFields(lowerQuery, service.name, service.namespace),
        relevanceScore: relevance
      });
    }
  });

  // Search namespaces
  mockResources.namespaces.forEach(ns => {
    const relevance = calculateRelevance(lowerQuery, ns.name);
    if (relevance > 0) {
      results.push({
        id: `namespace-${ns.name}`,
        type: 'namespace',
        name: ns.name,
        description: 'Kubernetes namespace',
        location: {
          primaryTab: PrimaryTab.WORKLOADS,
          secondaryTab: 'namespaces'
        },
        matchedFields: getMatchedFields(lowerQuery, ns.name),
        relevanceScore: relevance
      });
    }
  });

  // Search deployments
  mockResources.deployments.forEach(deployment => {
    const relevance = calculateRelevance(lowerQuery, deployment.name, deployment.namespace);
    if (relevance > 0) {
      results.push({
        id: `deployment-${deployment.name}`,
        type: 'deployment',
        name: deployment.name,
        namespace: deployment.namespace,
        description: `Deployment in ${deployment.namespace} namespace`,
        location: {
          primaryTab: PrimaryTab.DEPLOYMENTS,
          secondaryTab: DeploymentsTab.DEPLOYMENTS
        },
        matchedFields: getMatchedFields(lowerQuery, deployment.name, deployment.namespace),
        relevanceScore: relevance
      });
    }
  });

  // Search registries
  mockResources.registries.forEach(registry => {
    const relevance = calculateRelevance(lowerQuery, registry.name, registry.type, registry.url);
    if (relevance > 0) {
      results.push({
        id: `registry-${registry.name.replace(/\s+/g, '-').toLowerCase()}`,
        type: 'registry',
        name: registry.name,
        description: `${registry.type} registry at ${registry.url}`,
        location: {
          primaryTab: PrimaryTab.DEPLOYMENTS,
          secondaryTab: 'registries'
        },
        matchedFields: getMatchedFields(lowerQuery, registry.name, registry.type, registry.url),
        relevanceScore: relevance
      });
    }
  });

  // Search images
  mockResources.images.forEach(image => {
    const fullName = `${image.repository}:${image.tag}`;
    const relevance = calculateRelevance(lowerQuery, image.repository, image.tag, fullName);
    if (relevance > 0) {
      results.push({
        id: `image-${image.repository.replace('/', '-')}-${image.tag}`,
        type: 'image',
        name: fullName,
        description: `Container image from ${image.registry}`,
        location: {
          primaryTab: PrimaryTab.DEPLOYMENTS,
          secondaryTab: 'images'
        },
        matchedFields: getMatchedFields(lowerQuery, image.repository, image.tag, fullName),
        relevanceScore: relevance
      });
    }
  });

  // Search endpoints
  mockResources.endpoints.forEach(endpoint => {
    const relevance = calculateRelevance(lowerQuery, endpoint.name, endpoint.service);
    if (relevance > 0) {
      results.push({
        id: `endpoint-${endpoint.name}`,
        type: 'endpoint',
        name: endpoint.name,
        description: `API endpoint for ${endpoint.service}`,
        location: {
          primaryTab: PrimaryTab.MESH,
          secondaryTab: 'endpoints'
        },
        matchedFields: getMatchedFields(lowerQuery, endpoint.name, endpoint.service),
        relevanceScore: relevance
      });
    }
  });

  return results;
}

function calculateRelevance(query: string, ...fields: (string | undefined)[]): number {
  let score = 0;
  
  for (const field of fields) {
    if (!field) continue;
    
    const lowerField = field.toLowerCase();
    
    // Exact match gets highest score
    if (lowerField === query) {
      score += 100;
    }
    // Starts with query gets high score
    else if (lowerField.startsWith(query)) {
      score += 80;
    }
    // Contains query gets medium score
    else if (lowerField.includes(query)) {
      score += 50;
    }
    // Fuzzy match gets low score
    else if (fuzzyMatch(query, lowerField)) {
      score += 20;
    }
  }
  
  return score;
}

function getMatchedFields(query: string, ...fields: (string | undefined)[]): string[] {
  const matched: string[] = [];
  
  for (const field of fields) {
    if (field && field.toLowerCase().includes(query)) {
      matched.push(field);
    }
  }
  
  return matched;
}

function fuzzyMatch(query: string, text: string): boolean {
  const queryChars = query.split('');
  let textIndex = 0;
  
  for (const char of queryChars) {
    const foundIndex = text.indexOf(char, textIndex);
    if (foundIndex === -1) return false;
    textIndex = foundIndex + 1;
  }
  
  return true;
}

export default useGlobalSearchStore;
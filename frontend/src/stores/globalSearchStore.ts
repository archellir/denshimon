import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

export interface SearchResult {
  id: string;
  type: 'pod' | 'node' | 'service' | 'namespace' | 'deployment' | 'endpoint';
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

  // Mock data for different resource types
  const mockResources = {
    pods: [
      { name: 'nginx-deployment-7d46c7c4d-abc123', namespace: 'default' },
      { name: 'api-server-deployment-5f7b8c9d-def456', namespace: 'kube-system' },
      { name: 'redis-cache-6a8b9c0d-ghi789', namespace: 'production' },
      { name: 'postgres-database-1a2b3c4d-jkl012', namespace: 'production' },
      { name: 'frontend-app-8e9f0a1b-mno345', namespace: 'default' },
    ],
    nodes: [
      { name: 'master-node-1' },
      { name: 'worker-node-1' },
      { name: 'worker-node-2' },
      { name: 'gpu-node-1' },
    ],
    services: [
      { name: 'nginx-service', namespace: 'default' },
      { name: 'api-gateway', namespace: 'production' },
      { name: 'redis-service', namespace: 'production' },
      { name: 'postgres-service', namespace: 'production' },
      { name: 'frontend-service', namespace: 'default' },
    ],
    namespaces: [
      { name: 'default' },
      { name: 'kube-system' },
      { name: 'production' },
      { name: 'staging' },
      { name: 'monitoring' },
    ],
    deployments: [
      { name: 'nginx-deployment', namespace: 'default' },
      { name: 'api-server-deployment', namespace: 'production' },
      { name: 'frontend-deployment', namespace: 'default' },
    ],
    endpoints: [
      { name: '/api/v1/users', service: 'api-gateway' },
      { name: '/api/v1/auth', service: 'api-gateway' },
      { name: '/health', service: 'nginx-service' },
      { name: '/metrics', service: 'api-gateway' },
    ],
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
          primaryTab: 'workloads',
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
          primaryTab: 'infrastructure',
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
          primaryTab: 'services',
          secondaryTab: 'mesh'
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
          primaryTab: 'infrastructure',
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
          primaryTab: 'workloads',
          secondaryTab: 'deployments'
        },
        matchedFields: getMatchedFields(lowerQuery, deployment.name, deployment.namespace),
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
          primaryTab: 'services',
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
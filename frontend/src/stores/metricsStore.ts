import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type { MetricsStore, ClusterMetrics, NodeMetrics, PodMetrics, NamespaceMetrics, MetricsHistory } from '@/types/metrics';
import { 
  mockClusterMetrics, 
  mockNodes, 
  mockPods, 
  mockNamespaces, 
  generateMockMetricsHistory,
  mockApiResponse,
  MOCK_ENABLED 
} from '@mocks/index';
import { API_ENDPOINTS } from '@constants';
import { apiService, ApiError } from '@services/api';

const useMetricsStore = create<MetricsStore>()(
  subscribeWithSelector((set, get) => ({
    // Cluster metrics
    clusterMetrics: null,
    nodeMetrics: [],
    podMetrics: [],
    namespaceMetrics: [],
    metricsHistory: null,
    
    // Loading states
    isLoading: false,
    isLoadingHistory: false,
    error: null,
    
    // Refresh interval
    refreshInterval: 30000, // 30 seconds
    autoRefresh: true,
    
    // Actions
    setClusterMetrics: (metrics: ClusterMetrics) => set({ clusterMetrics: metrics }),
    setNodeMetrics: (metrics: NodeMetrics[]) => set({ nodeMetrics: metrics }),
    setPodMetrics: (metrics: PodMetrics[]) => set({ podMetrics: metrics }),
    setNamespaceMetrics: (metrics: NamespaceMetrics[]) => set({ namespaceMetrics: metrics }),
    setMetricsHistory: (history: MetricsHistory) => set({ metricsHistory: history }),
    
    setLoading: (isLoading: boolean) => set({ isLoading }),
    setLoadingHistory: (isLoadingHistory: boolean) => set({ isLoadingHistory }),
    setError: (error: string | null) => set({ error }),
    
    setRefreshInterval: (interval: number) => set({ refreshInterval: interval }),
    setAutoRefresh: (autoRefresh: boolean) => set({ autoRefresh }),
    
    // Fetch cluster metrics
    fetchClusterMetrics: async () => {
      const { isLoading } = get();
      if (isLoading) return;
      
      set({ isLoading: true, error: null });
      
      try {
        if (MOCK_ENABLED) {
          const metrics = await mockApiResponse(mockClusterMetrics);
          set({ 
            clusterMetrics: metrics,
            isLoading: false 
          });
          return;
        }

        const response = await apiService.get<ClusterMetrics>(API_ENDPOINTS.METRICS.CLUSTER);
        set({ 
          clusterMetrics: response.data,
          isLoading: false 
        });
      } catch (error) {
        const errorMessage = error instanceof ApiError ? error.message : 'Unknown error';
        set({ 
          error: errorMessage,
          isLoading: false 
        });
      }
    },
    
    // Fetch node metrics
    fetchNodeMetrics: async (nodeName: string = '') => {
      try {
        if (MOCK_ENABLED) {
          if (nodeName) {
            // Single node metric
            const node = mockNodes.find(n => n.name === nodeName);
            if (node) {
              const { nodeMetrics } = get();
              const updatedMetrics = nodeMetrics.map(n => 
                n.name === nodeName ? node : n
              );
              set({ nodeMetrics: updatedMetrics });
            }
          } else {
            // All nodes
            const nodes = await mockApiResponse(mockNodes);
            set({ nodeMetrics: nodes });
          }
          return;
        }

        const url = nodeName 
          ? `${API_ENDPOINTS.METRICS.NODES}?node=${nodeName}`
          : API_ENDPOINTS.METRICS.NODES;
          
        const response = await apiService.get<any>(url);
        
        if (nodeName) {
          // Single node metric
          const { nodeMetrics } = get();
          const updatedMetrics = nodeMetrics.map(node => 
            node.name === nodeName ? response.data : node
          );
          set({ nodeMetrics: updatedMetrics });
        } else {
          // All nodes
          set({ nodeMetrics: response.data.nodes || response.data || [] });
        }
      } catch (error) {
        const errorMessage = error instanceof ApiError ? error.message : 'Unknown error';
        set({ error: errorMessage });
      }
    },
    
    // Fetch pod metrics
    fetchPodMetrics: async (namespace: string = '', podName: string = '') => {
      try {
        if (MOCK_ENABLED) {
          let filteredPods = mockPods;
          
          if (namespace) {
            filteredPods = filteredPods.filter(pod => pod.namespace === namespace);
          }
          
          if (podName) {
            const pod = filteredPods.find(p => p.name === podName);
            if (pod) {
              set({ podMetrics: [pod] });
            }
          } else {
            const pods = await mockApiResponse(filteredPods);
            set({ podMetrics: pods });
          }
          return;
        }

        let url = API_ENDPOINTS.METRICS.PODS;
        const params = new URLSearchParams();
        
        if (namespace) params.append('namespace', namespace);
        if (podName) params.append('pod', podName);
        
        if (params.toString()) {
          url += `?${params.toString()}`;
        }
        
        const response = await apiService.get<any>(url);
        
        if (podName) {
          // Single pod metric
          set({ podMetrics: [response.data] });
        } else {
          // Multiple pods or summary
          set({ podMetrics: response.data.pods || response.data || [] });
        }
      } catch (error) {
        const errorMessage = error instanceof ApiError ? error.message : 'Unknown error';
        set({ error: errorMessage });
      }
    },
    
    // Fetch namespace metrics
    fetchNamespaceMetrics: async () => {
      try {
        if (MOCK_ENABLED) {
          const namespaces = await mockApiResponse(mockNamespaces);
          set({ namespaceMetrics: namespaces });
          return;
        }

        const response = await apiService.get<any>(API_ENDPOINTS.METRICS.NAMESPACES);
        set({ namespaceMetrics: response.data.namespaces || response.data || [] });
      } catch (error) {
        const errorMessage = error instanceof ApiError ? error.message : 'Unknown error';
        set({ error: errorMessage });
      }
    },
    
    // Fetch metrics history for charts
    fetchMetricsHistory: async (duration: string = '1h') => {
      const { isLoadingHistory } = get();
      if (isLoadingHistory) return;
      
      set({ isLoadingHistory: true });
      
      try {
        if (MOCK_ENABLED) {
          const history = await mockApiResponse(generateMockMetricsHistory(duration));
          set({ 
            metricsHistory: history,
            isLoadingHistory: false 
          });
          return;
        }

        const response = await apiService.get<MetricsHistory>(`/api/metrics/history?duration=${duration}`);
        set({ 
          metricsHistory: response.data,
          isLoadingHistory: false 
        });
      } catch (error) {
        const errorMessage = error instanceof ApiError ? error.message : 'Unknown error';
        set({ 
          error: errorMessage,
          isLoadingHistory: false 
        });
      }
    },
    
    // Fetch all metrics
    fetchAllMetrics: async () => {
      const { fetchClusterMetrics, fetchNodeMetrics, fetchNamespaceMetrics } = get();
      await Promise.all([
        fetchClusterMetrics(),
        fetchNodeMetrics(),
        fetchNamespaceMetrics()
      ]);
    },
    
    // Clear all data
    clearMetrics: () => set({
      clusterMetrics: null,
      nodeMetrics: [],
      podMetrics: [],
      namespaceMetrics: [],
      metricsHistory: null,
      error: null,
    }),
  }))
);

export default useMetricsStore;
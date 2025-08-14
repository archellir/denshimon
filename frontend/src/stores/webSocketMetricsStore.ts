import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type { MetricsStore, ClusterMetrics, NodeMetrics, PodMetrics, NamespaceMetrics, MetricsHistory } from '@/types/metrics';
import { API_ENDPOINTS, WebSocketEventType } from '@/constants';
import { 
  mockClusterMetrics, 
  mockNodes, 
  mockPods, 
  mockNamespaces, 
  generateMockMetricsHistory,
  mockApiResponse,
  MOCK_ENABLED 
} from '@mocks/index';

import { getWebSocketInstance } from '@services/websocket';

interface WebSocketMetricsStore extends MetricsStore {
  // WebSocket connection state
  isConnected: boolean;
  connectionError: string | null;
  
  // WebSocket actions
  initializeWebSocketMetrics: () => void;
  cleanupWebSocketMetrics: () => void;
}

const useWebSocketMetricsStore = create<WebSocketMetricsStore>()(
  subscribeWithSelector((set, get) => {
    let metricsSubscriptionId: string | null = null;
    let connectionSubscriptionId: string | null = null;

    return {
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
      
      // WebSocket connection state
      isConnected: false,
      connectionError: null,
      
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

      // Initialize WebSocket subscriptions
      initializeWebSocketMetrics: () => {
        try {
          const ws = getWebSocketInstance();
          if (!ws) {
            return;
          }

          // Subscribe to metrics updates
          metricsSubscriptionId = ws.subscribe(WebSocketEventType.METRICS, (data) => {
            set({ 
              clusterMetrics: data.cluster,
              nodeMetrics: data.nodes || [],
              podMetrics: data.pods || [],
              namespaceMetrics: data.namespaces || [],
              error: null
            });
          });

          // Subscribe to connection state
          connectionSubscriptionId = ws.subscribe(WebSocketEventType.CONNECTION, (connectionState) => {
            set({ 
              isConnected: connectionState.state === 'connected',
              connectionError: connectionState.state === 'error' ? 'Connection error' : null
            });
          });

        } catch (error) {
          set({ connectionError: 'Failed to initialize WebSocket connection' });
        }
      },

      // Cleanup WebSocket subscriptions
      cleanupWebSocketMetrics: () => {
        try {
          const ws = getWebSocketInstance();
          if (ws) {
            if (metricsSubscriptionId) {
              ws.unsubscribe(metricsSubscriptionId);
              metricsSubscriptionId = null;
            }
            if (connectionSubscriptionId) {
              ws.unsubscribe(connectionSubscriptionId);
              connectionSubscriptionId = null;
            }
          }
        } catch (error) {
        }
      },
      
      // Fetch cluster metrics (fallback for initial load)
      fetchClusterMetrics: async () => {
        const { isLoading } = get();
        if (isLoading) return;
        
        set({ isLoading: true, error: null });
        
        try {
          if (MOCK_ENABLED) {
            const mockData = await mockApiResponse(mockClusterMetrics);
            set({ clusterMetrics: mockData });
          } else {
            // Real API call
            const token = localStorage.getItem('auth_token');
            const response = await fetch(API_ENDPOINTS.METRICS.CLUSTER, {
              headers: token ? { 'Authorization': `Bearer ${token}` } : {}
            });
            
            if (!response.ok) {
              throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            set({ clusterMetrics: data });
          }
        } catch (error) {
          // Fallback to mock data on error
          try {
            const mockData = await mockApiResponse(mockClusterMetrics);
            set({ clusterMetrics: mockData, error: null });
          } catch (mockError) {
            set({ error: 'Failed to fetch cluster metrics' });
          }
        } finally {
          set({ isLoading: false });
        }
      },
      
      // Fetch node metrics
      fetchNodeMetrics: async () => {
        try {
          if (MOCK_ENABLED) {
            const mockData = await mockApiResponse(mockNodes);
            set({ nodeMetrics: mockData });
          } else {
            // Real API call
            const token = localStorage.getItem('auth_token');
            const response = await fetch(API_ENDPOINTS.METRICS.NODES, {
              headers: token ? { 'Authorization': `Bearer ${token}` } : {}
            });
            
            if (!response.ok) {
              throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            set({ nodeMetrics: data.nodes || [] });
          }
        } catch (error) {
          // Fallback to mock data on error
          try {
            const mockData = await mockApiResponse(mockNodes);
            set({ nodeMetrics: mockData, error: null });
          } catch (mockError) {
            set({ error: 'Failed to fetch node metrics' });
          }
        }
      },
      
      // Fetch pod metrics
      fetchPodMetrics: async () => {
        try {
          if (MOCK_ENABLED) {
            const mockData = await mockApiResponse(mockPods);
            set({ podMetrics: mockData });
          } else {
            // Real API call
            const token = localStorage.getItem('auth_token');
            const response = await fetch(API_ENDPOINTS.METRICS.PODS, {
              headers: token ? { 'Authorization': `Bearer ${token}` } : {}
            });
            
            if (!response.ok) {
              throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            set({ podMetrics: data.namespaces || [] });
          }
        } catch (error) {
          // Fallback to mock data on error
          try {
            const mockData = await mockApiResponse(mockPods);
            set({ podMetrics: mockData, error: null });
          } catch (mockError) {
            set({ error: 'Failed to fetch pod metrics' });
          }
        }
      },
      
      // Fetch namespace metrics  
      fetchNamespaceMetrics: async () => {
        try {
          if (MOCK_ENABLED) {
            const mockData = await mockApiResponse(mockNamespaces);
            set({ namespaceMetrics: mockData });
          } else {
            // Real API call
            const token = localStorage.getItem('auth_token');
            const response = await fetch(API_ENDPOINTS.METRICS.NAMESPACES, {
              headers: token ? { 'Authorization': `Bearer ${token}` } : {}
            });
            
            if (!response.ok) {
              throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            set({ namespaceMetrics: data.namespaces || [] });
          }
        } catch (error) {
          // Fallback to mock data on error
          try {
            const mockData = await mockApiResponse(mockNamespaces);
            set({ namespaceMetrics: mockData, error: null });
          } catch (mockError) {
            set({ error: 'Failed to fetch namespace metrics' });
          }
        }
      },
      
      // Fetch all metrics
      fetchAllMetrics: async () => {
        const store = get();
        await Promise.all([
          store.fetchClusterMetrics(),
          store.fetchNodeMetrics(),
          store.fetchPodMetrics(),
          store.fetchNamespaceMetrics(),
        ]);
      },
      
      // Fetch metrics history
      fetchMetricsHistory: async (timeRange?: string) => {
        const duration = timeRange || '1h';
        set({ isLoadingHistory: true });
        
        try {
          if (MOCK_ENABLED) {
            const mockData = await mockApiResponse(generateMockMetricsHistory(duration));
            set({ metricsHistory: mockData });
          } else {
            // Real API call
            const token = localStorage.getItem('auth_token');
            const response = await fetch(`${API_ENDPOINTS.METRICS.HISTORY}?duration=${duration}`, {
              headers: token ? { 'Authorization': `Bearer ${token}` } : {}
            });
            
            if (!response.ok) {
              throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            set({ metricsHistory: data });
          }
        } catch (error) {
          // Fallback to mock data on error
          try {
            const mockData = await mockApiResponse(generateMockMetricsHistory(timeRange));
            set({ metricsHistory: mockData, error: null });
          } catch (mockError) {
            set({ error: 'Failed to fetch metrics history' });
          }
        } finally {
          set({ isLoadingHistory: false });
        }
      },
      
      // Clear all metrics
      clearMetrics: () => {
        set({
          clusterMetrics: null,
          nodeMetrics: [],
          podMetrics: [],
          namespaceMetrics: [],
          metricsHistory: null,
          error: null
        });
      },
    };
  })
);

export default useWebSocketMetricsStore;
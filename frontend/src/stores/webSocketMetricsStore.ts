import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type { MetricsStore, ClusterMetrics, NodeMetrics, PodMetrics, NamespaceMetrics, MetricsHistory } from '@types/metrics';
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
            console.error('WebSocket instance not available');
            return;
          }

          // Subscribe to metrics updates
          metricsSubscriptionId = ws.subscribe('metrics', (data) => {
            set({ 
              clusterMetrics: data.cluster,
              nodeMetrics: data.nodes || [],
              podMetrics: data.pods || [],
              namespaceMetrics: data.namespaces || [],
              error: null
            });
          });

          // Subscribe to connection state
          connectionSubscriptionId = ws.subscribe('connection', (connectionState) => {
            set({ 
              isConnected: connectionState.state === 'connected',
              connectionError: connectionState.state === 'error' ? 'Connection error' : null
            });
          });

          console.log('WebSocket metrics subscriptions initialized');
        } catch (error) {
          console.error('Failed to initialize WebSocket metrics:', error);
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
          console.log('WebSocket metrics subscriptions cleaned up');
        } catch (error) {
          console.error('Error cleaning up WebSocket metrics:', error);
        }
      },
      
      // Fetch cluster metrics (fallback for initial load)
      fetchClusterMetrics: async () => {
        const { isLoading } = get();
        if (isLoading) return;
        
        set({ isLoading: true, error: null });
        
        try {
          console.log('[FETCH DEBUG] fetchClusterMetrics - MOCK_ENABLED:', MOCK_ENABLED);
          if (MOCK_ENABLED) {
            console.log('[FETCH DEBUG] Using mock data for cluster metrics');
            const mockData = await mockApiResponse(mockClusterMetrics());
            set({ clusterMetrics: mockData });
          } else {
            console.log('[FETCH DEBUG] Making real API call for cluster metrics');
            // Real API call
            const token = localStorage.getItem('auth_token');
            const response = await fetch('/api/metrics/cluster', {
              headers: token ? { 'Authorization': `Bearer ${token}` } : {}
            });
            
            if (!response.ok) {
              throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            set({ clusterMetrics: data });
          }
        } catch (error) {
          console.warn('API call failed, falling back to mock data:', error);
          // Fallback to mock data on error
          try {
            const mockData = await mockApiResponse(mockClusterMetrics());
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
            const mockData = await mockApiResponse(mockNodes());
            set({ nodeMetrics: mockData });
          } else {
            // Real API call
            const token = localStorage.getItem('auth_token');
            const response = await fetch('/api/metrics/nodes', {
              headers: token ? { 'Authorization': `Bearer ${token}` } : {}
            });
            
            if (!response.ok) {
              throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            set({ nodeMetrics: data.nodes || [] });
          }
        } catch (error) {
          console.warn('API call failed, falling back to mock data:', error);
          // Fallback to mock data on error
          try {
            const mockData = await mockApiResponse(mockNodes());
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
            const mockData = await mockApiResponse(mockPods());
            set({ podMetrics: mockData });
          } else {
            // Real API call
            const token = localStorage.getItem('auth_token');
            const response = await fetch('/api/metrics/pods', {
              headers: token ? { 'Authorization': `Bearer ${token}` } : {}
            });
            
            if (!response.ok) {
              throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            set({ podMetrics: data.namespaces || [] });
          }
        } catch (error) {
          console.warn('API call failed, falling back to mock data:', error);
          // Fallback to mock data on error
          try {
            const mockData = await mockApiResponse(mockPods());
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
            const mockData = await mockApiResponse(mockNamespaces());
            set({ namespaceMetrics: mockData });
          } else {
            // Real API call
            const token = localStorage.getItem('auth_token');
            const response = await fetch('/api/metrics/namespaces', {
              headers: token ? { 'Authorization': `Bearer ${token}` } : {}
            });
            
            if (!response.ok) {
              throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            set({ namespaceMetrics: data.namespaces || [] });
          }
        } catch (error) {
          console.warn('API call failed, falling back to mock data:', error);
          // Fallback to mock data on error
          try {
            const mockData = await mockApiResponse(mockNamespaces());
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
      fetchMetricsHistory: async (timeRange: string) => {
        set({ isLoadingHistory: true });
        
        try {
          if (MOCK_ENABLED) {
            const mockData = await mockApiResponse(generateMockMetricsHistory(timeRange));
            set({ metricsHistory: mockData });
          } else {
            // Real API call
            const token = localStorage.getItem('auth_token');
            const response = await fetch(`/api/metrics/history?duration=${timeRange}`, {
              headers: token ? { 'Authorization': `Bearer ${token}` } : {}
            });
            
            if (!response.ok) {
              throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            set({ metricsHistory: data });
          }
        } catch (error) {
          console.warn('API call failed, falling back to mock data:', error);
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
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

const useMetricsStore = create(
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
    setClusterMetrics: (metrics) => set({ clusterMetrics: metrics }),
    setNodeMetrics: (metrics) => set({ nodeMetrics: metrics }),
    setPodMetrics: (metrics) => set({ podMetrics: metrics }),
    setNamespaceMetrics: (metrics) => set({ namespaceMetrics: metrics }),
    setMetricsHistory: (history) => set({ metricsHistory: history }),
    
    setLoading: (isLoading) => set({ isLoading }),
    setLoadingHistory: (isLoadingHistory) => set({ isLoadingHistory }),
    setError: (error) => set({ error }),
    
    setRefreshInterval: (interval) => set({ refreshInterval: interval }),
    setAutoRefresh: (autoRefresh) => set({ autoRefresh }),
    
    // Fetch cluster metrics
    fetchClusterMetrics: async () => {
      const { isLoading } = get();
      if (isLoading) return;
      
      set({ isLoading: true, error: null });
      
      try {
        const response = await fetch('/api/metrics/cluster', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch cluster metrics: ${response.statusText}`);
        }
        
        const metrics = await response.json();
        set({ 
          clusterMetrics: metrics,
          isLoading: false 
        });
      } catch (error) {
        set({ 
          error: error.message,
          isLoading: false 
        });
      }
    },
    
    // Fetch node metrics
    fetchNodeMetrics: async (nodeName = '') => {
      try {
        const url = nodeName 
          ? `/api/metrics/nodes?node=${nodeName}`
          : '/api/metrics/nodes';
          
        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch node metrics: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (nodeName) {
          // Single node metric
          const { nodeMetrics } = get();
          const updatedMetrics = nodeMetrics.map(node => 
            node.name === nodeName ? data : node
          );
          set({ nodeMetrics: updatedMetrics });
        } else {
          // All nodes
          set({ nodeMetrics: data.nodes || [] });
        }
      } catch (error) {
        set({ error: error.message });
      }
    },
    
    // Fetch pod metrics
    fetchPodMetrics: async (namespace = '', podName = '') => {
      try {
        let url = '/api/metrics/pods';
        const params = new URLSearchParams();
        
        if (namespace) params.append('namespace', namespace);
        if (podName) params.append('pod', podName);
        
        if (params.toString()) {
          url += `?${params.toString()}`;
        }
        
        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch pod metrics: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (podName) {
          // Single pod metric
          set({ podMetrics: [data] });
        } else {
          // Multiple pods or summary
          set({ podMetrics: data.pods || [] });
        }
      } catch (error) {
        set({ error: error.message });
      }
    },
    
    // Fetch namespace metrics
    fetchNamespaceMetrics: async () => {
      try {
        const response = await fetch('/api/metrics/namespaces', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch namespace metrics: ${response.statusText}`);
        }
        
        const data = await response.json();
        set({ namespaceMetrics: data.namespaces || [] });
      } catch (error) {
        set({ error: error.message });
      }
    },
    
    // Fetch metrics history for charts
    fetchMetricsHistory: async (duration = '1h') => {
      const { isLoadingHistory } = get();
      if (isLoadingHistory) return;
      
      set({ isLoadingHistory: true });
      
      try {
        const response = await fetch(`/api/metrics/history?duration=${duration}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch metrics history: ${response.statusText}`);
        }
        
        const history = await response.json();
        set({ 
          metricsHistory: history,
          isLoadingHistory: false 
        });
      } catch (error) {
        set({ 
          error: error.message,
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
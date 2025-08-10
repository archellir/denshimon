import type { ClusterMetrics, MetricsHistory } from '../../types/metrics';

export const mockClusterMetrics: ClusterMetrics = {
  total_nodes: 3,
  ready_nodes: 3,
  total_pods: 10,
  running_pods: 8,
  pending_pods: 1,
  failed_pods: 1,
  total_namespaces: 5,
  cpu_usage: {
    used: 4080, // Total CPU usage in millicores
    total: 10000, // Total CPU capacity in millicores
    available: 5920,
    usage_percent: 40.8,
    usage: 4.08, // In cores
    limit: 10.0
  },
  memory_usage: {
    used: 6409142272, // ~6GB
    total: 21474836480, // ~20GB
    available: 15065694208,
    usage_percent: 29.9,
    usage: 6409142272,
    limit: 21474836480
  },
  storage_usage: {
    used: 120259084288, // ~112GB
    total: 268435456000, // ~250GB
    available: 148176371712,
    usage_percent: 44.8,
    usage: 120259084288,
    limit: 268435456000
  },
  last_updated: new Date().toISOString()
};

// Generate historical metrics for charts
export const generateMockMetricsHistory = (duration: string = '1h'): MetricsHistory => {
  const now = Date.now();
  const intervals = duration === '15m' ? 15 : duration === '1h' ? 60 : duration === '6h' ? 360 : 1440; // minutes
  const points = 60; // Number of data points
  const intervalMs = (intervals * 60 * 1000) / points;

  const generateTimeSeries = (baseValue: number, variance: number = 10) => {
    return Array.from({ length: points }, (_, i) => {
      const timestamp = new Date(now - (points - 1 - i) * intervalMs).toISOString();
      // Add some realistic variance with occasional spikes
      const randomVariance = (Math.random() - 0.5) * variance;
      const spike = Math.random() < 0.05 ? Math.random() * 20 : 0; // 5% chance of spike
      const value = Math.max(0, Math.min(100, baseValue + randomVariance + spike));
      
      return {
        timestamp,
        value: Number(value.toFixed(1))
      };
    });
  };

  return {
    cpu: generateTimeSeries(40.8, 8), // Base CPU usage with 8% variance
    memory: generateTimeSeries(29.9, 6), // Base memory usage with 6% variance
    pods: generateTimeSeries(10, 2).map(point => ({ 
      ...point, 
      value: Math.max(8, Math.min(12, Math.round(point.value))) 
    })), // Pod count between 8-12
    nodes: generateTimeSeries(3, 0).map(point => ({ 
      ...point, 
      value: 3 
    })) // Stable node count
  };
};

export const mockMetricsHistory = generateMockMetricsHistory();
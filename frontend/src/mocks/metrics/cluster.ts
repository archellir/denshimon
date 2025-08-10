import type { ClusterMetrics, MetricsHistory } from '@types/metrics';

export const mockClusterMetrics: ClusterMetrics = {
  total_nodes: 3,
  ready_nodes: 3,
  total_pods: 10,
  running_pods: 8,
  pending_pods: 1,
  failed_pods: 1,
  total_namespaces: 5,
  cpu_usage: {
    usage: 7.25, // In cores
    used: 7250, // Total CPU usage in millicores
    total: 12000, // Total CPU capacity in millicores  
    available: 4750,
    usage_percent: 60.4, // High CPU usage to show red/yellow warning
    unit: 'millicores'
  },
  memory_usage: {
    usage: 17179869184, // ~16GB used
    used: 17179869184, // ~16GB used
    total: 21474836480, // ~20GB total
    available: 4294967296, // ~4GB available
    usage_percent: 80.0, // High memory usage
    unit: 'bytes'
  },
  storage_usage: {
    usage: 85899345920, // ~80GB used
    used: 85899345920, // ~80GB used  
    total: 268435456000, // ~250GB total
    available: 182536110080, // ~170GB available
    usage_percent: 32.0, // Moderate storage usage
    unit: 'bytes'
  },
  healthy_pods: 8,
  unhealthy_pods: 2,
  last_updated: new Date().toISOString()
};

// Generate historical metrics for charts
export const generateMockMetricsHistory = (duration: string = '1h'): MetricsHistory => {
  const now = Date.now();
  const intervals = duration === '15m' ? 15 : duration === '1h' ? 60 : duration === '6h' ? 360 : 1440; // minutes
  const points = Math.min(60, intervals); // Adjust points based on duration
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
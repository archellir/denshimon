import type { ClusterMetrics, MetricsHistory } from '@/types/metrics';

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

// Cache for consistent mock data across re-renders
const mockDataCache = new Map<string, MetricsHistory>();

// Generate historical metrics for charts with timeframe-specific patterns
export const generateMockMetricsHistory = (duration: string = '1h'): MetricsHistory => {
  // Return cached data if available to prevent re-rendering
  if (mockDataCache.has(duration)) {
    return mockDataCache.get(duration)!;
  }

  const now = Date.now();
  const intervals = duration === '15m' ? 15 : duration === '1h' ? 60 : duration === '6h' ? 360 : 1440; // minutes
  const points = Math.min(60, intervals); // Adjust points based on duration
  const intervalMs = (intervals * 60 * 1000) / points;

  const generateTimeSeries = (metricType: 'cpu' | 'memory' | 'storage' | 'pods' | 'nodes', baseValue: number, variance: number = 10, pattern?: 'spike' | 'gradual' | 'business' | 'daily') => {
    return Array.from({ length: points }, (_, i) => {
      const timestamp = new Date(now - (points - 1 - i) * intervalMs).toISOString();
      const progress = i / (points - 1); // 0 to 1
      
      let value = baseValue;
      
      // Apply timeframe-specific patterns with metric-specific behavior
      switch (pattern) {
        case 'spike': // 15m - recent spike pattern
          switch (metricType) {
            case 'cpu':
              value = baseValue + Math.sin(progress * Math.PI * 3) * 20 + (Math.random() - 0.5) * variance;
              if (progress > 0.7) value += 25; // CPU spike
              break;
            case 'memory':
              value = baseValue + Math.sin(progress * Math.PI * 2) * 10 + (Math.random() - 0.5) * variance;
              if (progress > 0.8) value += 15; // Memory leak pattern
              break;
            case 'storage':
              value = baseValue + Math.sin(progress * Math.PI * 1.5) * 5 + (Math.random() - 0.5) * variance;
              if (progress > 0.9) value += 8; // Storage fill up
              break;
            case 'pods':
              value = baseValue + Math.sin(progress * Math.PI * 4) * 2 + (Math.random() - 0.5) * variance;
              if (progress > 0.6) value += 3; // Pod scaling event
              break;
            case 'nodes':
              value = baseValue; // Nodes rarely change in 15m
              break;
          }
          break;

        case 'gradual': // 1h - gradual increase
          switch (metricType) {
            case 'cpu':
              value = baseValue + progress * 20 + Math.sin(progress * Math.PI * 2) * 12 + (Math.random() - 0.5) * variance;
              break;
            case 'memory':
              value = baseValue + progress * 25 + Math.sin(progress * Math.PI * 1.5) * 8 + (Math.random() - 0.5) * variance;
              break;
            case 'storage':
              value = baseValue + progress * 12 + Math.sin(progress * Math.PI * 1.8) * 6 + (Math.random() - 0.5) * variance;
              break;
            case 'pods':
              value = baseValue + progress * 4 + Math.sin(progress * Math.PI * 3) * 2 + (Math.random() - 0.5) * variance;
              break;
            case 'nodes':
              value = baseValue + (progress > 0.8 ? 1 : 0); // Node added near end
              break;
          }
          break;

        case 'business': // 6h - business hours pattern
          const hourOfDay = (progress * 6 + new Date().getHours() - 6) % 24;
          const isBusinessHours = hourOfDay >= 9 && hourOfDay <= 17;
          
          switch (metricType) {
            case 'cpu':
              const cpuMultiplier = isBusinessHours ? 1.4 : 0.6;
              value = baseValue * cpuMultiplier + Math.sin(progress * Math.PI * 2) * 15 + (Math.random() - 0.5) * variance;
              break;
            case 'memory':
              const memMultiplier = isBusinessHours ? 1.3 : 0.7;
              value = baseValue * memMultiplier + Math.sin(progress * Math.PI * 2) * 12 + (Math.random() - 0.5) * variance;
              break;
            case 'storage':
              const storageMultiplier = isBusinessHours ? 1.1 : 0.9;
              value = baseValue * storageMultiplier + Math.sin(progress * Math.PI * 2) * 8 + (Math.random() - 0.5) * variance;
              break;
            case 'pods':
              const podMultiplier = isBusinessHours ? 1.2 : 0.8;
              value = baseValue * podMultiplier + Math.sin(progress * Math.PI * 2) * 3 + (Math.random() - 0.5) * variance;
              break;
            case 'nodes':
              value = baseValue + (isBusinessHours && progress > 0.3 && progress < 0.7 ? 1 : 0);
              break;
          }
          break;

        case 'daily': // 24h - full daily cycle
          switch (metricType) {
            case 'cpu':
              value = baseValue + Math.sin(progress * Math.PI * 2) * 25 + Math.cos(progress * Math.PI * 4) * 10 + (Math.random() - 0.5) * variance;
              // Peak hours effect
              const cpuPeakHour = (progress * 24) % 24;
              if (cpuPeakHour >= 9 && cpuPeakHour <= 11) value += 15; // Morning peak
              if (cpuPeakHour >= 14 && cpuPeakHour <= 16) value += 10; // Afternoon peak
              break;
            case 'memory':
              value = baseValue + Math.sin(progress * Math.PI * 2) * 20 + Math.cos(progress * Math.PI * 3) * 8 + (Math.random() - 0.5) * variance;
              // Memory accumulates during business hours
              const memHour = (progress * 24) % 24;
              if (memHour >= 8 && memHour <= 18) value += (memHour - 8) * 2;
              break;
            case 'storage':
              value = baseValue + Math.sin(progress * Math.PI * 2) * 15 + Math.cos(progress * Math.PI * 2.5) * 6 + (Math.random() - 0.5) * variance;
              // Storage grows slowly throughout the day
              const storageHour = (progress * 24) % 24;
              if (storageHour >= 6 && storageHour <= 22) value += (storageHour - 6) * 0.5;
              break;
            case 'pods':
              value = baseValue + Math.sin(progress * Math.PI * 2) * 4 + Math.cos(progress * Math.PI * 6) * 2 + (Math.random() - 0.5) * variance;
              // Auto-scaling events
              const podHour = (progress * 24) % 24;
              if (podHour >= 8 && podHour <= 19) value += 3; // More pods during day
              break;
            case 'nodes':
              // Nodes change less frequently, maybe maintenance windows
              const nodeHour = (progress * 24) % 24;
              if (nodeHour >= 2 && nodeHour <= 4) value = Math.max(2, baseValue - 1); // Maintenance window
              else value = baseValue;
              break;
          }
          break;

        default:
          value = baseValue + (Math.random() - 0.5) * variance;
      }
      
      // Apply metric-specific constraints
      if (metricType === 'pods' || metricType === 'nodes') {
        value = Math.max(metricType === 'nodes' ? 1 : 0, Math.round(value));
      }
      
      return {
        timestamp,
        value: metricType === 'cpu' || metricType === 'memory' || metricType === 'storage'
          ? Math.max(0, Math.min(100, Number(value.toFixed(1))))
          : Math.max(0, Number(value.toFixed(0)))
      };
    });
  };

  // Pattern selection based on timeframe
  const pattern = duration === '15m' ? 'spike' : duration === '1h' ? 'gradual' : duration === '6h' ? 'business' : 'daily';

  const metricsHistory = {
    cpu: generateTimeSeries('cpu', 45.5, 8, pattern),
    memory: generateTimeSeries('memory', 32.1, 6, pattern),
    storage: generateTimeSeries('storage', 28.5, 4, pattern),
    pods: generateTimeSeries('pods', 10, 2, pattern).map(point => ({ 
      ...point, 
      value: Math.max(8, Math.min(15, Math.round(point.value))) 
    })),
    nodes: generateTimeSeries('nodes', 3, 0, pattern).map(point => ({ 
      ...point, 
      value: Math.max(2, Math.min(5, Math.round(point.value))) 
    }))
  };

  // Cache the generated data
  mockDataCache.set(duration, metricsHistory);
  
  return metricsHistory;
};

export const mockMetricsHistory = generateMockMetricsHistory();
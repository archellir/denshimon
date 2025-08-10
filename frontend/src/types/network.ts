export interface NetworkMetricPoint {
  timestamp: string;
  value: number; // bytes/second
}

export interface NetworkTrafficData {
  ingress: NetworkMetricPoint[];
  egress: NetworkMetricPoint[];
  total: NetworkMetricPoint[];
}

export interface ProtocolBreakdown {
  protocol: string;
  bytes: number;
  percentage: number;
  color: string;
}

export interface TopTalker {
  podName: string;
  namespace: string;
  ingressBytes: number;
  egressBytes: number;
  totalBytes: number;
  connections: number;
  rank: number;
}

export interface NetworkMetrics {
  trafficData: NetworkTrafficData;
  protocolBreakdown: ProtocolBreakdown[];
  topTalkers: TopTalker[];
  totalBandwidth: {
    ingress: number;
    egress: number;
    peak: number;
    average: number;
  };
  connectionCount: {
    active: number;
    established: number;
    timeWait: number;
  };
  lastUpdated: string;
}

export interface NetworkStore {
  // Data
  networkMetrics: NetworkMetrics | null;
  networkHistory: NetworkTrafficData | null;
  
  // Loading states
  isLoading: boolean;
  isLoadingHistory: boolean;
  error: string | null;
  
  // Setters
  setNetworkMetrics: (metrics: NetworkMetrics) => void;
  setNetworkHistory: (history: NetworkTrafficData) => void;
  setLoading: (isLoading: boolean) => void;
  setLoadingHistory: (isLoadingHistory: boolean) => void;
  setError: (error: string | null) => void;
  
  // Actions
  fetchNetworkMetrics: () => Promise<void>;
  fetchNetworkHistory: (duration?: string) => Promise<void>;
  clearNetworkData: () => void;
}
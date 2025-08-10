export interface ResourceUsage {
  usage: number;
  used: number;
  total: number;
  available: number;
  usage_percent: number;
  unit: string;
}

export interface ClusterMetrics {
  total_nodes: number;
  ready_nodes: number;
  total_pods: number;
  running_pods: number;
  pending_pods: number;
  failed_pods: number;
  total_namespaces: number;
  cpu_usage: ResourceUsage;
  memory_usage: ResourceUsage;
  storage_usage: ResourceUsage;
  healthy_pods: number;
  unhealthy_pods: number;
  last_updated: string;
}

export interface NodeMetrics {
  name: string;
  status: string;
  cpu_usage: ResourceUsage;
  memory_usage: ResourceUsage;
  storage_usage: ResourceUsage;
  pod_count: number;
  allocatable_cpu: string;
  allocatable_memory: string;
  last_updated: string;
}

export interface PodMetrics {
  name: string;
  namespace: string;
  node: string;
  status: string;
  cpu_usage: ResourceUsage;
  memory_usage: ResourceUsage;
  restart_count: number;
  age: string;
  last_updated: string;
}

export interface NamespaceMetrics {
  name: string;
  pod_count: number;
  cpu_usage: ResourceUsage;
  memory_usage: ResourceUsage;
  last_updated: string;
}

export interface MetricPoint {
  timestamp: string;
  value: number;
}

export interface MetricsHistory {
  cpu: MetricPoint[];
  memory: MetricPoint[];
  pods: MetricPoint[];
  nodes: MetricPoint[];
}

export interface MetricsStore {
  // Data
  clusterMetrics: ClusterMetrics | null;
  nodeMetrics: NodeMetrics[];
  podMetrics: PodMetrics[];
  namespaceMetrics: NamespaceMetrics[];
  metricsHistory: MetricsHistory | null;
  
  // Loading states
  isLoading: boolean;
  isLoadingHistory: boolean;
  error: string | null;
  
  // Refresh settings
  refreshInterval: number;
  autoRefresh: boolean;
  
  // Setters
  setClusterMetrics: (metrics: ClusterMetrics) => void;
  setNodeMetrics: (metrics: NodeMetrics[]) => void;
  setPodMetrics: (metrics: PodMetrics[]) => void;
  setNamespaceMetrics: (metrics: NamespaceMetrics[]) => void;
  setMetricsHistory: (history: MetricsHistory) => void;
  setLoading: (isLoading: boolean) => void;
  setLoadingHistory: (isLoadingHistory: boolean) => void;
  setError: (error: string | null) => void;
  setRefreshInterval: (interval: number) => void;
  setAutoRefresh: (autoRefresh: boolean) => void;
  
  // Actions
  fetchClusterMetrics: () => Promise<void>;
  fetchNodeMetrics: (nodeName?: string) => Promise<void>;
  fetchPodMetrics: (namespace?: string, podName?: string) => Promise<void>;
  fetchNamespaceMetrics: () => Promise<void>;
  fetchMetricsHistory: (duration?: string) => Promise<void>;
  fetchAllMetrics: () => Promise<void>;
  clearMetrics: () => void;
}
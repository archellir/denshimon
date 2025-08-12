export interface TerminalLine {
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  source: string;
  message: string;
  metadata?: Record<string, any>;
}

export interface PodResourceUsage {
  name: string;
  namespace: string;
  cpu: number;
  memory: number;
  cpuTrend: 'up' | 'down' | 'stable';
  memoryTrend: 'up' | 'down' | 'stable';
  status: string;
  lastUpdate: string;
}

export interface DeploymentProgress {
  name: string;
  namespace: string;
  replicas: {
    desired: number;
    current: number;
    ready: number;
    updated: number;
    available: number;
  };
  strategy: string;
  progress: number;
  status: 'pending' | 'progressing' | 'complete' | 'failed';
  message: string;
  startTime: string;
  estimatedCompletion?: string;
}

export interface LiveTerminalData {
  logs: TerminalLine[];
  topPods: PodResourceUsage[];
  deployments: DeploymentProgress[];
  stats: {
    logsPerSecond: number;
    activeStreams: number;
    errorRate: number;
    warningRate: number;
  };
  lastUpdate: string;
}

export interface TerminalFilter {
  level?: ('info' | 'warn' | 'error' | 'debug')[];
  source?: string;
  search?: string;
  maxLines?: number;
}
export interface PodLifecycleEvent {
  timestamp: string;
  podName: string;
  namespace: string;
  eventType: 'created' | 'started' | 'terminated' | 'failed' | 'scheduled' | 'pulled' | 'killing';
  reason: string;
  message: string;
  node?: string;
  phase: 'Pending' | 'Running' | 'Succeeded' | 'Failed' | 'Unknown';
}

export interface PodChurnMetrics {
  timestamp: string;
  created: number;
  terminated: number;
  failed: number;
  netChange: number; // created - terminated
}

export interface ContainerRestartPattern {
  podName: string;
  namespace: string;
  containerName: string;
  restartCount: number;
  lastRestartTime: string;
  restartReasons: {
    reason: string;
    count: number;
    lastOccurrence: string;
  }[];
  crashLoopBackOff: boolean;
  averageUptime: number; // seconds
}

export interface PodSchedulingMetrics {
  timestamp: string;
  pendingPods: number;
  schedulingDelay: number; // average seconds from creation to scheduling
  schedulingFailures: number;
  nodeResourceConstraints: number;
  imagePackFailures: number;
}

export interface PodFailureAnalysis {
  reason: string;
  count: number;
  percentage: number;
  recentOccurrences: string[];
  affectedNamespaces: string[];
  trend: 'increasing' | 'stable' | 'decreasing';
  color: string;
}

export interface ImagePullMetrics {
  imageName: string;
  pullCount: number;
  averagePullTime: number; // seconds
  failureRate: number; // percentage
  lastPullTime: string;
  size: number; // bytes
  registry: string;
}

export interface PodLifecycleMetrics {
  churnData: PodChurnMetrics[];
  restartPatterns: ContainerRestartPattern[];
  schedulingMetrics: PodSchedulingMetrics[];
  failureAnalysis: PodFailureAnalysis[];
  imagePullMetrics: ImagePullMetrics[];
  totalEvents: number;
  averagePodLifespan: number; // seconds
  crashLoopPods: number;
  pendingPods: number;
  evictedPods: number;
  lastUpdated: string;
}

export interface LifecycleTimelineEvent {
  timestamp: string;
  eventType: 'creation_spike' | 'mass_termination' | 'deployment' | 'node_failure' | 'scaling_event';
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  affectedPods: number;
  duration?: number; // seconds
}

export interface PodLifecycleStore {
  // Data
  lifecycleMetrics: PodLifecycleMetrics | null;
  lifecycleEvents: PodLifecycleEvent[];
  timelineEvents: LifecycleTimelineEvent[];
  
  // Loading states
  isLoading: boolean;
  isLoadingHistory: boolean;
  error: string | null;
  
  // Setters
  setLifecycleMetrics: (metrics: PodLifecycleMetrics) => void;
  setLifecycleEvents: (events: PodLifecycleEvent[]) => void;
  setTimelineEvents: (events: LifecycleTimelineEvent[]) => void;
  setLoading: (isLoading: boolean) => void;
  setLoadingHistory: (isLoadingHistory: boolean) => void;
  setError: (error: string | null) => void;
  
  // Actions
  fetchLifecycleMetrics: (duration?: string) => Promise<void>;
  fetchLifecycleEvents: (duration?: string) => Promise<void>;
  fetchTimelineEvents: (duration?: string) => Promise<void>;
  clearLifecycleData: () => void;
}
import type { 
  PodLifecycleMetrics, 
  PodChurnMetrics, 
  ContainerRestartPattern, 
  PodSchedulingMetrics, 
  PodFailureAnalysis, 
  ImagePullMetrics,
  PodLifecycleEvent,
  LifecycleTimelineEvent
} from '@/types/podLifecycle';

// Cache for consistent pod lifecycle data
const lifecycleDataCache = new Map<string, PodLifecycleMetrics>();

// Realistic pod and container names
const podNames = [
  'nginx-deployment-7c79c4bf97',
  'api-gateway-5d9f8c8b4d',
  'redis-master',
  'postgres-primary',
  'elasticsearch-data',
  'kafka-broker',
  'prometheus-server-6b7f9c8d5e',
  'grafana-5c8d7b9f4e',
  'ingress-nginx-controller',
  'cert-manager-webhook'
];

const containerNames = ['nginx', 'api', 'redis', 'postgres', 'elasticsearch', 'kafka', 'prometheus', 'grafana', 'controller', 'webhook'];

const namespaces = ['production', 'staging', 'development', 'monitoring', 'ingress-nginx', 'kube-system'];

const failureReasons = [
  'ImagePullBackOff', 'CrashLoopBackOff', 'OOMKilled', 'Error', 
  'NodeLost', 'Evicted', 'DeadlineExceeded', 'ResourceQuota'
];

const restartReasons = [
  'OOMKilled', 'Error', 'Completed', 'ContainerCannotRun', 'DeadlineExceeded'
];

// Generate pod churn data (creation/termination rates)
const generateChurnData = (duration: string): PodChurnMetrics[] => {
  const now = Date.now();
  const intervals = duration === '15m' ? 15 : duration === '1h' ? 60 : duration === '6h' ? 360 : 1440;
  const points = Math.min(60, intervals);
  const intervalMs = (intervals * 60 * 1000) / points;

  return Array.from({ length: points }, (_, i) => {
    const timestamp = new Date(now - (points - 1 - i) * intervalMs).toISOString();
    const progress = i / (points - 1);

    // Realistic churn patterns based on timeframe
    let baseCreated = 2;
    let baseTerminated = 1.8;
    let variance = 1.5;

    switch (duration) {
      case '15m': // Recent deployment spike
        if (progress > 0.6) {
          baseCreated += 8; // Deployment event
          baseTerminated += 2; // Rolling update
        }
        break;
      case '1h': // Gradual scaling
        baseCreated += progress * 3;
        baseTerminated += progress * 2.5;
        break;
      case '6h': // Business hours pattern
        const hour = (progress * 6 + new Date().getHours() - 6) % 24;
        if (hour >= 9 && hour <= 17) {
          baseCreated *= 1.8;
          baseTerminated *= 1.6;
        }
        break;
      case '24h': // Daily cycle with peak hours
        const dailyHour = (progress * 24) % 24;
        if (dailyHour >= 9 && dailyHour <= 11) {
          baseCreated *= 2.2; // Morning deployment window
        }
        if (dailyHour >= 2 && dailyHour <= 4) {
          baseTerminated *= 1.8; // Maintenance window
        }
        break;
    }

    const created = Math.max(0, Math.round(baseCreated + (Math.random() - 0.5) * variance));
    const terminated = Math.max(0, Math.round(baseTerminated + (Math.random() - 0.5) * variance));
    const failed = Math.max(0, Math.round(Math.random() * 2));

    return {
      timestamp,
      created,
      terminated,
      failed,
      netChange: created - terminated
    };
  });
};

// Generate container restart patterns
const generateRestartPatterns = (): ContainerRestartPattern[] => {
  return Array.from({ length: 12 }, (_, i) => {
    const podName = `${podNames[i % podNames.length]}-${Math.random().toString(36).substr(2, 5)}`;
    const containerName = containerNames[i % containerNames.length];
    const restartCount = Math.floor(Math.pow(2, Math.random() * 6)); // Exponential distribution
    const crashLoopBackOff = restartCount > 10;

    const restartReasonsCounts = restartReasons.map(reason => ({
      reason,
      count: Math.floor(Math.random() * (restartCount / restartReasons.length + 1)),
      lastOccurrence: new Date(Date.now() - Math.random() * 86400000).toISOString() // Last 24h
    })).filter(r => r.count > 0);

    return {
      podName,
      namespace: namespaces[Math.floor(Math.random() * namespaces.length)],
      containerName,
      restartCount,
      lastRestartTime: new Date(Date.now() - Math.random() * 3600000).toISOString(), // Last hour
      restartReasons: restartReasonsCounts,
      crashLoopBackOff,
      averageUptime: crashLoopBackOff ? 
        Math.random() * 300 : // 5 minutes if crashing
        Math.random() * 86400 + 3600 // 1-25 hours if healthy
    };
  }).sort((a, b) => b.restartCount - a.restartCount);
};

// Generate pod scheduling metrics
const generateSchedulingMetrics = (duration: string): PodSchedulingMetrics[] => {
  const now = Date.now();
  const intervals = duration === '15m' ? 15 : duration === '1h' ? 60 : duration === '6h' ? 360 : 1440;
  const points = Math.min(30, intervals / 2); // Less frequent than churn data
  const intervalMs = (intervals * 60 * 1000) / points;

  return Array.from({ length: points }, (_, i) => {
    const timestamp = new Date(now - (points - 1 - i) * intervalMs).toISOString();
    const progress = i / (points - 1);

    let basePending = 3;
    let baseDelay = 15; // seconds
    let baseFailures = 0.5;

    // Add scheduling pressure during peak times
    if (duration === '6h' || duration === '24h') {
      const hour = (progress * (duration === '6h' ? 6 : 24)) % 24;
      if (hour >= 9 && hour <= 11) {
        basePending *= 2;
        baseDelay *= 1.8;
        baseFailures *= 2.5;
      }
    }

    return {
      timestamp,
      pendingPods: Math.max(0, Math.round(basePending + (Math.random() - 0.5) * 2)),
      schedulingDelay: Math.max(1, baseDelay + (Math.random() - 0.5) * 10),
      schedulingFailures: Math.max(0, Math.round(baseFailures + Math.random())),
      nodeResourceConstraints: Math.max(0, Math.round(Math.random() * 2)),
      imagePackFailures: Math.max(0, Math.round(Math.random() * 1.5))
    };
  });
};

// Generate failure analysis
const generateFailureAnalysis = (): PodFailureAnalysis[] => {
  return failureReasons.map((reason, i) => {
    const count = Math.floor(Math.random() * 20 + 1);
    const trend = ['increasing', 'stable', 'decreasing'][Math.floor(Math.random() * 3)] as 'increasing' | 'stable' | 'decreasing';
    const colors = ['#FF4444', '#FF8800', '#FFAA00', '#FFCC00', '#FFDD00', '#88FF00', '#44FF44', '#00FFAA'];
    
    return {
      reason,
      count,
      percentage: count / failureReasons.reduce((sum, _) => sum + Math.floor(Math.random() * 20 + 1), 0) * 100,
      recentOccurrences: Array.from({ length: Math.min(5, count) }, () => 
        new Date(Date.now() - Math.random() * 86400000).toISOString()
      ),
      affectedNamespaces: namespaces.slice(0, Math.floor(Math.random() * 3) + 1),
      trend,
      color: colors[i % colors.length]
    };
  }).sort((a, b) => b.count - a.count);
};

// Generate image pull metrics
const generateImagePullMetrics = (): ImagePullMetrics[] => {
  const images = [
    'nginx:1.21', 'redis:7-alpine', 'postgres:14', 
    'elasticsearch:8.8.0', 'grafana/grafana:latest',
    'prom/prometheus:v2.40.0', 'traefik:v2.9',
    'ghcr.io/my-org/api:v1.2.3'
  ];

  const registries = ['docker.io', 'gcr.io', 'ghcr.io', 'quay.io'];

  return images.map((imageName, _i) => ({
    imageName,
    pullCount: Math.floor(Math.random() * 100 + 10),
    averagePullTime: Math.random() * 120 + 15, // 15-135 seconds
    failureRate: Math.random() * 15, // 0-15% failure rate
    lastPullTime: new Date(Date.now() - Math.random() * 3600000).toISOString(),
    size: Math.floor(Math.random() * 500 + 50) * 1024 * 1024, // 50-550 MB
    registry: registries[Math.floor(Math.random() * registries.length)]
  })).sort((a, b) => b.pullCount - a.pullCount);
};

// Generate lifecycle events
const generateLifecycleEvents = (duration: string): PodLifecycleEvent[] => {
  const now = Date.now();
  const eventCount = duration === '15m' ? 20 : duration === '1h' ? 50 : duration === '6h' ? 200 : 500;
  
  return Array.from({ length: eventCount }, (_, _i) => {
    const timestamp = new Date(now - Math.random() * (duration === '15m' ? 900000 : 
      duration === '1h' ? 3600000 : duration === '6h' ? 21600000 : 86400000)).toISOString();
    
    const eventTypes = ['created', 'started', 'terminated', 'failed', 'scheduled', 'pulled', 'killing'] as const;
    const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
    const phases = ['Pending', 'Running', 'Succeeded', 'Failed', 'Unknown'] as const;
    
    return {
      timestamp,
      podName: `${podNames[Math.floor(Math.random() * podNames.length)]}-${Math.random().toString(36).substr(2, 5)}`,
      namespace: namespaces[Math.floor(Math.random() * namespaces.length)],
      eventType,
      reason: eventType === 'failed' ? 
        failureReasons[Math.floor(Math.random() * failureReasons.length)] : 
        'Normal',
      message: `Pod ${eventType} successfully`,
      node: Math.random() > 0.3 ? `node-${Math.floor(Math.random() * 3) + 1}` : undefined,
      phase: phases[Math.floor(Math.random() * phases.length)]
    };
  }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
};

// Generate timeline events (major incidents)
const generateTimelineEvents = (duration: string): LifecycleTimelineEvent[] => {
  const eventTypes = [
    'creation_spike', 'mass_termination', 'deployment', 
    'node_failure', 'scaling_event'
  ] as const;
  
  const eventCount = duration === '15m' ? 1 : duration === '1h' ? 3 : duration === '6h' ? 8 : 15;
  const now = Date.now();
  
  return Array.from({ length: eventCount }, (_, _i) => {
    const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
    const severities = ['low', 'medium', 'high', 'critical'] as const;
    
    return {
      timestamp: new Date(now - Math.random() * (duration === '15m' ? 900000 : 
        duration === '1h' ? 3600000 : duration === '6h' ? 21600000 : 86400000)).toISOString(),
      eventType,
      description: getEventDescription(eventType),
      severity: severities[Math.floor(Math.random() * severities.length)],
      affectedPods: Math.floor(Math.random() * 50 + 5),
      duration: Math.floor(Math.random() * 1800 + 60) // 1-30 minutes
    };
  }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
};

const getEventDescription = (eventType: string): string => {
  const descriptions = {
    creation_spike: 'High pod creation rate detected - possible deployment',
    mass_termination: 'Multiple pods terminated simultaneously',
    deployment: 'Rolling deployment detected with pod replacements',
    node_failure: 'Node failure caused pod rescheduling',
    scaling_event: 'Horizontal pod autoscaler triggered scaling'
  };
  return descriptions[eventType as keyof typeof descriptions] || 'Unknown event';
};

// Main generator function
export const generatePodLifecycleMetrics = (duration: string = '1h'): PodLifecycleMetrics => {
  // Return cached data if available
  if (lifecycleDataCache.has(duration)) {
    return lifecycleDataCache.get(duration)!;
  }

  const churnData = generateChurnData(duration);
  const restartPatterns = generateRestartPatterns();
  const schedulingMetrics = generateSchedulingMetrics(duration);
  const failureAnalysis = generateFailureAnalysis();
  const imagePullMetrics = generateImagePullMetrics();

  const totalEvents = churnData.reduce((sum, point) => sum + point.created + point.terminated + point.failed, 0);
  const crashLoopPods = restartPatterns.filter(p => p.crashLoopBackOff).length;
  const currentPending = schedulingMetrics[schedulingMetrics.length - 1]?.pendingPods || 0;

  const metrics: PodLifecycleMetrics = {
    churnData,
    restartPatterns,
    schedulingMetrics,
    failureAnalysis,
    imagePullMetrics,
    totalEvents,
    averagePodLifespan: 86400 + Math.random() * 172800, // 1-3 days average
    crashLoopPods,
    pendingPods: currentPending,
    evictedPods: Math.floor(Math.random() * 5),
    lastUpdated: new Date().toISOString()
  };

  // Cache the data
  lifecycleDataCache.set(duration, metrics);
  
  return metrics;
};

// Export individual generators for use in components
export const generatePodChurnData = generateChurnData;
export const generateContainerRestartPatterns = generateRestartPatterns;
export const generatePodSchedulingMetrics = generateSchedulingMetrics;
export const generatePodFailureAnalysis = generateFailureAnalysis;
export const generatePodImagePullMetrics = generateImagePullMetrics;
export const generatePodLifecycleEvents = generateLifecycleEvents;
export const generateLifecycleTimelineEvents = generateTimelineEvents;

// Default exports for immediate use
export const mockPodLifecycleMetrics = generatePodLifecycleMetrics();
export const mockLifecycleEvents = generateLifecycleEvents('1h');
export const mockTimelineEvents = generateTimelineEvents('1h');
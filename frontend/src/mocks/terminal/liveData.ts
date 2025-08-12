import { LiveTerminalData, TerminalLine, PodResourceUsage, DeploymentProgress } from '@/types/liveTerminal';

const LOG_SOURCES = [
  'api-server', 'controller-manager', 'scheduler', 'kubelet',
  'etcd', 'kube-proxy', 'coredns', 'ingress-controller',
  'app-frontend', 'app-backend', 'app-worker', 'app-cache'
];

const LOG_MESSAGES = {
  info: [
    'Successfully synced pod status',
    'Deployment scaled to desired replicas',
    'Service endpoints updated',
    'ConfigMap mounted in pod',
    'Health check passed',
    'Connection established to database',
    'Cache warmed successfully',
    'Request processed in {ms}ms'
  ],
  warn: [
    'Pod restart threshold approaching',
    'Memory usage above 80%',
    'Slow query detected: {ms}ms',
    'Certificate expiring in {days} days',
    'Rate limit approaching: {percent}%',
    'Disk usage high on node',
    'Network latency detected'
  ],
  error: [
    'Failed to pull image',
    'Connection refused to service',
    'Pod evicted due to resource pressure',
    'Authentication failed',
    'Database connection timeout',
    'Service unavailable',
    'Invalid configuration detected'
  ],
  debug: [
    'Entering reconciliation loop',
    'Checking resource quotas',
    'Evaluating pod affinity rules',
    'Computing resource requests',
    'Updating internal cache',
    'Processing event queue'
  ]
};

const NAMESPACES = ['default', 'kube-system', 'production', 'staging', 'monitoring', 'logging'];

let liveDataInterval: NodeJS.Timeout | null = null;
let currentData: LiveTerminalData | null = null;
let updateCallbacks: ((data: LiveTerminalData) => void)[] = [];

const generateTerminalLine = (): TerminalLine => {
  const level = Math.random() < 0.6 ? 'info' : 
                Math.random() < 0.8 ? 'debug' :
                Math.random() < 0.95 ? 'warn' : 'error';
  
  const messages = LOG_MESSAGES[level];
  let message = messages[Math.floor(Math.random() * messages.length)];
  
  // Replace placeholders
  message = message.replace('{ms}', Math.floor(Math.random() * 500 + 50).toString());
  message = message.replace('{days}', Math.floor(Math.random() * 30 + 1).toString());
  message = message.replace('{percent}', Math.floor(Math.random() * 20 + 80).toString());
  
  return {
    timestamp: new Date().toISOString(),
    level,
    source: LOG_SOURCES[Math.floor(Math.random() * LOG_SOURCES.length)],
    message,
    metadata: Math.random() > 0.7 ? {
      pod: `pod-${Math.random().toString(36).substr(2, 9)}`,
      namespace: NAMESPACES[Math.floor(Math.random() * NAMESPACES.length)],
      node: `node-${Math.floor(Math.random() * 5 + 1)}`
    } : undefined
  };
};

const generatePodResourceUsage = (existing?: PodResourceUsage): PodResourceUsage => {
  if (existing) {
    // Update existing pod
    const cpuDelta = (Math.random() - 0.5) * 10;
    const memoryDelta = (Math.random() - 0.5) * 50;
    const newCpu = Math.max(5, Math.min(95, existing.cpu + cpuDelta));
    const newMemory = Math.max(100, Math.min(4000, existing.memory + memoryDelta));
    
    return {
      ...existing,
      cpu: newCpu,
      memory: newMemory,
      cpuTrend: Math.abs(newCpu - existing.cpu) < 2 ? 'stable' : 
                newCpu > existing.cpu ? 'up' : 'down',
      memoryTrend: Math.abs(newMemory - existing.memory) < 20 ? 'stable' :
                   newMemory > existing.memory ? 'up' : 'down',
      lastUpdate: new Date().toISOString()
    };
  }
  
  // Generate new pod
  const statuses = ['Running', 'Pending', 'Failed', 'Succeeded'];
  return {
    name: `${['web', 'api', 'worker', 'cache', 'db'][Math.floor(Math.random() * 5)]}-${Math.random().toString(36).substr(2, 5)}`,
    namespace: NAMESPACES[Math.floor(Math.random() * NAMESPACES.length)],
    cpu: Math.floor(Math.random() * 80 + 10),
    memory: Math.floor(Math.random() * 3000 + 500),
    cpuTrend: 'stable',
    memoryTrend: 'stable',
    status: statuses[Math.floor(Math.random() * statuses.length)],
    lastUpdate: new Date().toISOString()
  };
};

const generateDeploymentProgress = (existing?: DeploymentProgress): DeploymentProgress => {
  if (existing && existing.status === 'progressing') {
    // Update existing deployment
    const progress = Math.min(100, existing.progress + Math.random() * 15 + 5);
    const updated = Math.min(existing.replicas.desired, 
                            Math.floor(progress / 100 * existing.replicas.desired));
    
    return {
      ...existing,
      replicas: {
        ...existing.replicas,
        current: updated,
        ready: Math.max(0, updated - Math.floor(Math.random() * 2)),
        updated,
        available: Math.max(0, updated - Math.floor(Math.random() * 2))
      },
      progress,
      status: progress >= 100 ? 'complete' : 'progressing',
      message: progress >= 100 ? 'Deployment completed successfully' :
               `Rolling update in progress: ${updated}/${existing.replicas.desired} pods updated`
    };
  }
  
  // Generate new deployment
  const desired = Math.floor(Math.random() * 10 + 3);
  const progress = Math.floor(Math.random() * 100);
  const updated = Math.floor(progress / 100 * desired);
  
  return {
    name: `${['frontend', 'backend', 'api', 'service', 'worker'][Math.floor(Math.random() * 5)]}-deployment`,
    namespace: NAMESPACES[Math.floor(Math.random() * NAMESPACES.length)],
    replicas: {
      desired,
      current: updated,
      ready: Math.max(0, updated - 1),
      updated,
      available: Math.max(0, updated - 1)
    },
    strategy: Math.random() > 0.3 ? 'RollingUpdate' : 'Recreate',
    progress,
    status: progress >= 100 ? 'complete' : 
           Math.random() > 0.9 ? 'failed' : 'progressing',
    message: progress >= 100 ? 'Deployment completed' : 
            `Updating replicas: ${updated}/${desired}`,
    startTime: new Date(Date.now() - Math.random() * 600000).toISOString(),
    estimatedCompletion: progress < 100 ? 
      new Date(Date.now() + (100 - progress) * 3000).toISOString() : undefined
  };
};

const initializeLiveData = (): LiveTerminalData => {
  const logs: TerminalLine[] = [];
  for (let i = 0; i < 50; i++) {
    logs.push(generateTerminalLine());
  }
  
  const topPods: PodResourceUsage[] = [];
  for (let i = 0; i < 10; i++) {
    topPods.push(generatePodResourceUsage());
  }
  topPods.sort((a, b) => (b.cpu + b.memory/100) - (a.cpu + a.memory/100));
  
  const deployments: DeploymentProgress[] = [];
  for (let i = 0; i < 5; i++) {
    deployments.push(generateDeploymentProgress());
  }
  
  return {
    logs,
    topPods,
    deployments,
    stats: {
      logsPerSecond: Math.random() * 10 + 5,
      activeStreams: Math.floor(Math.random() * 20 + 10),
      errorRate: Math.random() * 5,
      warningRate: Math.random() * 10 + 5
    },
    lastUpdate: new Date().toISOString()
  };
};

export const startLiveTerminalUpdates = (callback: (data: LiveTerminalData) => void) => {
  if (!currentData) {
    currentData = initializeLiveData();
  }
  
  updateCallbacks.push(callback);
  callback(currentData);
  
  if (!liveDataInterval) {
    liveDataInterval = setInterval(() => {
      if (!currentData) return;
      
      // Add new logs
      const newLogs = [...currentData.logs];
      const logsToAdd = Math.floor(Math.random() * 3 + 1);
      for (let i = 0; i < logsToAdd; i++) {
        newLogs.unshift(generateTerminalLine());
      }
      // Keep only last 100 logs
      while (newLogs.length > 100) {
        newLogs.pop();
      }
      
      // Update top pods
      const topPods = currentData.topPods.map(pod => 
        generatePodResourceUsage(pod)
      );
      // Occasionally add/remove pods
      if (Math.random() > 0.9) {
        if (Math.random() > 0.5 && topPods.length < 15) {
          topPods.push(generatePodResourceUsage());
        } else if (topPods.length > 5) {
          topPods.splice(Math.floor(Math.random() * topPods.length), 1);
        }
      }
      topPods.sort((a, b) => (b.cpu + b.memory/100) - (a.cpu + a.memory/100));
      
      // Update deployments
      const deployments = currentData.deployments.map(dep =>
        generateDeploymentProgress(dep)
      );
      // Occasionally add new deployment
      if (Math.random() > 0.95 && deployments.length < 8) {
        deployments.push(generateDeploymentProgress());
      }
      // Remove completed deployments after some time
      const filteredDeployments = deployments.filter(d => 
        d.status !== 'complete' || Math.random() > 0.3
      );
      
      // Calculate stats
      const errorCount = newLogs.filter(l => l.level === 'error').length;
      const warnCount = newLogs.filter(l => l.level === 'warn').length;
      
      currentData = {
        logs: newLogs,
        topPods: topPods.slice(0, 10),
        deployments: filteredDeployments,
        stats: {
          logsPerSecond: logsToAdd * 2, // Updates every 500ms
          activeStreams: Math.floor(Math.random() * 5 + 15),
          errorRate: (errorCount / newLogs.length) * 100,
          warningRate: (warnCount / newLogs.length) * 100
        },
        lastUpdate: new Date().toISOString()
      };
      
      updateCallbacks.forEach(cb => cb(currentData!));
    }, 500); // Update every 500ms for real-time feel
  }
  
  return () => {
    updateCallbacks = updateCallbacks.filter(cb => cb !== callback);
    if (updateCallbacks.length === 0 && liveDataInterval) {
      clearInterval(liveDataInterval);
      liveDataInterval = null;
    }
  };
};

export const stopLiveTerminalUpdates = () => {
  if (liveDataInterval) {
    clearInterval(liveDataInterval);
    liveDataInterval = null;
  }
  updateCallbacks = [];
  currentData = null;
};
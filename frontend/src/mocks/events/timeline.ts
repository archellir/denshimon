import { TimelineEvent, EventGroup, EventTimelineData, EventCategory } from '@/types/eventTimeline';
import { Status } from '@/constants';

const EVENT_TEMPLATES = {
  node: {
    critical: [
      { title: 'Node Failed', description: 'Node {node} became unresponsive and was marked as NotReady' },
      { title: 'Node Disk Pressure', description: 'Node {node} reported critical disk pressure, pods being evicted' },
      { title: 'Node Memory Exhausted', description: 'Node {node} out of memory, OOM killer activated' },
    ],
    warning: [
      { title: 'Node CPU High', description: 'Node {node} CPU usage above 90% for extended period' },
      { title: 'Node Network Issues', description: 'Node {node} experiencing packet loss and high latency' },
      { title: 'Node Certificate Expiring', description: 'Node {node} certificate expires in {days} days' },
    ],
    info: [
      { title: 'Node Joined', description: 'New node {node} joined the cluster' },
      { title: 'Node Updated', description: 'Node {node} Kubernetes version updated to {version}' },
      { title: 'Node Cordoned', description: 'Node {node} cordoned for maintenance' },
    ],
    success: [
      { title: 'Node Recovered', description: 'Node {node} recovered and marked as Ready' },
      { title: 'Node Upgrade Complete', description: 'Node {node} successfully upgraded' },
    ],
  },
  pod: {
    critical: [
      { title: 'Pod CrashLoop', description: 'Pod {pod} in CrashLoopBackOff, {restarts} restarts' },
      { title: 'Pod Evicted', description: 'Pod {pod} evicted due to resource pressure' },
      { title: 'Image Pull Failed', description: 'Pod {pod} failed to pull image: {error}' },
    ],
    warning: [
      { title: 'Pod Restarted', description: 'Pod {pod} restarted unexpectedly' },
      { title: 'Pod Pending', description: 'Pod {pod} pending for {duration} minutes' },
      { title: 'Liveness Probe Failed', description: 'Pod {pod} liveness probe failing' },
    ],
    info: [
      { title: 'Pod Scheduled', description: 'Pod {pod} scheduled on node {node}' },
      { title: 'Pod Started', description: 'Pod {pod} containers started successfully' },
      { title: 'Pod Scaling', description: 'Deployment {deployment} scaled to {replicas} replicas' },
    ],
    success: [
      { title: 'Pod Ready', description: 'Pod {pod} ready and serving traffic' },
      { title: 'Pod Recovered', description: 'Pod {pod} recovered from previous failure' },
    ],
  },
  service: {
    critical: [
      { title: 'Service Down', description: 'Service {service} has no available endpoints' },
      { title: 'Load Balancer Failed', description: 'Service {service} load balancer provisioning failed' },
    ],
    warning: [
      { title: 'Service Degraded', description: 'Service {service} operating with reduced capacity' },
      { title: 'Endpoints Unhealthy', description: 'Service {service} has {unhealthy} unhealthy endpoints' },
    ],
    info: [
      { title: 'Service Created', description: 'New service {service} created in namespace {namespace}' },
      { title: 'Service Updated', description: 'Service {service} configuration updated' },
    ],
    success: [
      { title: 'Service Restored', description: 'Service {service} fully operational' },
    ],
  },
  config: {
    warning: [
      { title: 'ConfigMap Updated', description: 'ConfigMap {name} modified, pods may need restart' },
      { title: 'Secret Rotated', description: 'Secret {name} rotated in namespace {namespace}' },
    ],
    info: [
      { title: 'ConfigMap Created', description: 'New ConfigMap {name} created' },
      { title: 'RBAC Policy Updated', description: 'Role {role} permissions modified' },
    ],
  },
  security: {
    critical: [
      { title: 'Security Breach Detected', description: 'Unauthorized access attempt from {source}' },
      { title: 'Certificate Expired', description: 'TLS certificate for {service} has expired' },
    ],
    warning: [
      { title: 'Suspicious Activity', description: 'Unusual API access pattern detected from {source}' },
      { title: 'Policy Violation', description: 'Pod {pod} violates security policy: {policy}' },
    ],
    info: [
      { title: 'Security Scan Complete', description: 'Vulnerability scan completed, {issues} issues found' },
      { title: 'Certificate Renewed', description: 'TLS certificate for {service} successfully renewed' },
    ],
  },
  network: {
    critical: [
      { title: 'Network Partition', description: 'Network split detected between zones' },
      { title: 'Ingress Down', description: 'Ingress controller {name} is not responding' },
    ],
    warning: [
      { title: 'High Latency', description: 'Network latency to {service} exceeds threshold' },
      { title: 'DNS Issues', description: 'DNS resolution failures detected in cluster' },
    ],
    info: [
      { title: 'Network Policy Applied', description: 'New network policy {name} applied' },
      { title: 'Ingress Updated', description: 'Ingress {name} rules modified' },
    ],
  },
  storage: {
    critical: [
      { title: 'Volume Full', description: 'PersistentVolume {pv} is at 100% capacity' },
      { title: 'Storage Failure', description: 'Storage backend {backend} is unavailable' },
    ],
    warning: [
      { title: 'Volume Near Capacity', description: 'PersistentVolume {pv} at {percent}% capacity' },
      { title: 'Slow IO', description: 'Storage performance degraded on {node}' },
    ],
    info: [
      { title: 'Volume Created', description: 'New PersistentVolume {pv} provisioned' },
      { title: 'Snapshot Created', description: 'Volume snapshot {snapshot} created successfully' },
    ],
  },
};

const generateEventId = () => `evt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

const fillTemplate = (template: string): string => {
  return template
    .replace('{node}', `node-${Math.floor(Math.random() * 5 + 1)}`)
    .replace('{pod}', `app-${Math.random().toString(36).substr(2, 5)}`)
    .replace('{service}', `svc-${['api', 'web', 'db', 'cache'][Math.floor(Math.random() * 4)]}`)
    .replace('{deployment}', `deploy-${['frontend', 'backend', 'worker'][Math.floor(Math.random() * 3)]}`)
    .replace('{namespace}', ['default', 'production', 'staging'][Math.floor(Math.random() * 3)])
    .replace('{version}', `v1.${Math.floor(Math.random() * 20 + 10)}.0`)
    .replace('{replicas}', Math.floor(Math.random() * 10 + 1).toString())
    .replace('{restarts}', Math.floor(Math.random() * 20 + 5).toString())
    .replace('{duration}', Math.floor(Math.random() * 30 + 5).toString())
    .replace('{days}', Math.floor(Math.random() * 30 + 1).toString())
    .replace('{error}', ['ImagePullBackOff', 'ErrImagePull', 'InvalidImageName'][Math.floor(Math.random() * 3)])
    .replace('{unhealthy}', Math.floor(Math.random() * 5 + 1).toString())
    .replace('{name}', `resource-${Math.random().toString(36).substr(2, 5)}`)
    .replace('{role}', ['admin', 'developer', 'viewer'][Math.floor(Math.random() * 3)])
    .replace('{source}', `10.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`)
    .replace('{policy}', ['NetworkPolicy', 'PodSecurityPolicy', 'ResourceQuota'][Math.floor(Math.random() * 3)])
    .replace('{issues}', Math.floor(Math.random() * 20).toString())
    .replace('{pv}', `pv-${Math.random().toString(36).substr(2, 5)}`)
    .replace('{percent}', Math.floor(Math.random() * 20 + 75).toString())
    .replace('{backend}', ['ceph', 'nfs', 'ebs'][Math.floor(Math.random() * 3)])
    .replace('{snapshot}', `snap-${Date.now()}`);
};

const generateEvent = (hoursAgo: number): TimelineEvent => {
  const categories = Object.keys(EVENT_TEMPLATES) as EventCategory[];
  const category = categories[Math.floor(Math.random() * categories.length)];
  const categoryTemplates = EVENT_TEMPLATES[category];
  
  const severities = Object.keys(categoryTemplates) as Status[];
  const severity = severities[Math.floor(Math.random() * severities.length)];
  const templates = categoryTemplates[severity as keyof typeof categoryTemplates];
  
  if (!templates || templates.length === 0) {
    // Fallback event
    return {
      id: generateEventId(),
      timestamp: new Date(Date.now() - hoursAgo * 3600000 - Math.random() * 3600000).toISOString(),
      category: EventCategory.POD,
      severity: Status.INFO,
      title: 'Generic Event',
      description: 'A generic cluster event occurred',
      source: {
        type: 'system',
        name: 'kubernetes',
      },
    };
  }
  
  const template = templates[Math.floor(Math.random() * templates.length)];
  const timestamp = new Date(Date.now() - hoursAgo * 3600000 - Math.random() * 3600000);
  
  const event: TimelineEvent = {
    id: generateEventId(),
    timestamp: timestamp.toISOString(),
    category,
    severity,
    title: fillTemplate(template.title),
    description: fillTemplate(template.description),
    source: {
      type: category,
      name: `${category}-controller`,
      namespace: category === 'node' ? undefined : ['default', 'kube-system', 'production'][Math.floor(Math.random() * 3)],
    },
  };
  
  // Add impact for critical events
  if (severity === 'critical') {
    const total = Math.floor(Math.random() * 20 + 10);
    event.impact = {
      affected: Math.floor(Math.random() * total * 0.7 + 1),
      total,
      unit: category === 'node' ? 'pods' : category === 'service' ? 'endpoints' : 'resources',
    };
  }
  
  // Add duration for ongoing issues
  if (severity === 'critical' || severity === 'warning') {
    if (Math.random() > 0.3) {
      event.duration = Math.floor(Math.random() * 3600000); // up to 1 hour
      event.resolved = Math.random() > 0.4;
    }
  }
  
  return event;
};

export const generateEventTimelineData = (hours: number = 24): EventTimelineData => {
  const events: TimelineEvent[] = [];
  const eventsPerHour = 3 + Math.floor(Math.random() * 5);
  
  // Generate events for each hour
  for (let h = 0; h < hours; h++) {
    const hourEventCount = Math.floor(Math.random() * eventsPerHour + 1);
    for (let e = 0; e < hourEventCount; e++) {
      events.push(generateEvent(h));
    }
  }
  
  // Sort events by timestamp (newest first)
  events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  
  // Group events by hour
  const groups: EventGroup[] = [];
  const groupMap = new Map<string, TimelineEvent[]>();
  
  events.forEach(event => {
    const hour = new Date(event.timestamp).toISOString().slice(0, 13) + ':00:00.000Z';
    if (!groupMap.has(hour)) {
      groupMap.set(hour, []);
    }
    groupMap.get(hour)!.push(event);
  });
  
  groupMap.forEach((groupEvents, hour) => {
    const summary = {
      critical: groupEvents.filter(e => e.severity === 'critical').length,
      warning: groupEvents.filter(e => e.severity === 'warning').length,
      info: groupEvents.filter(e => e.severity === 'info').length,
      success: groupEvents.filter(e => e.severity === 'success').length,
    };
    
    groups.push({
      hour,
      events: groupEvents,
      summary,
    });
  });
  
  // Sort groups by hour (newest first)
  groups.sort((a, b) => new Date(b.hour).getTime() - new Date(a.hour).getTime());
  
  // Calculate statistics
  const bySeverity: Partial<Record<Status, number>> = {
    [Status.CRITICAL]: events.filter(e => e.severity === Status.CRITICAL).length,
    [Status.WARNING]: events.filter(e => e.severity === Status.WARNING).length,
    [Status.INFO]: events.filter(e => e.severity === Status.INFO).length,
    [Status.SUCCESS]: events.filter(e => e.severity === Status.SUCCESS).length,
  };
  
  const byCategory: Record<EventCategory, number> = {
    node: events.filter(e => e.category === 'node').length,
    pod: events.filter(e => e.category === 'pod').length,
    service: events.filter(e => e.category === 'service').length,
    config: events.filter(e => e.category === 'config').length,
    security: events.filter(e => e.category === 'security').length,
    network: events.filter(e => e.category === 'network').length,
    storage: events.filter(e => e.category === 'storage').length,
  };
  
  // Calculate trend (compare last 6 hours to previous 6 hours)
  const recentCount = events.filter(e => 
    new Date(e.timestamp).getTime() > Date.now() - 6 * 3600000
  ).length;
  const previousCount = events.filter(e => {
    const time = new Date(e.timestamp).getTime();
    return time > Date.now() - 12 * 3600000 && time <= Date.now() - 6 * 3600000;
  }).length;
  
  const recentTrend = recentCount > previousCount * 1.2 ? 'increasing' :
                      recentCount < previousCount * 0.8 ? 'decreasing' : 'stable';
  
  // Calculate average resolution time
  const resolvedEvents = events.filter(e => e.resolved && e.duration);
  const averageResolutionTime = resolvedEvents.length > 0
    ? Math.floor(resolvedEvents.reduce((sum, e) => sum + (e.duration || 0), 0) / resolvedEvents.length / 60000)
    : 0;
  
  return {
    events,
    groups,
    statistics: {
      total: events.length,
      bySeverity,
      byCategory,
      recentTrend,
      averageResolutionTime,
      unresolvedCritical: events.filter(e => e.severity === Status.CRITICAL && !e.resolved).length,
    },
    filters: {
      categories: Object.keys(EVENT_TEMPLATES) as EventCategory[],
      severities: [Status.CRITICAL, Status.WARNING, Status.INFO, Status.SUCCESS],
      timeRange: `${hours}h`,
    },
  };
};
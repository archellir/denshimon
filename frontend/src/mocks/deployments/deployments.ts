import type { Deployment, NodeInfo } from '@/types/deployments';
import { MASTER_APPLICATIONS, MASTER_NODES, MASTER_PODS } from '../masterData';

// Convert master data to Deployment type
export const mockDeployments: Deployment[] = MASTER_APPLICATIONS.map(app => {
  const appPods = MASTER_PODS.filter(pod => app.pods.includes(pod.name));
  const availableReplicas = appPods.filter(() => Math.random() > 0.1).length; // 90% availability
  const readyReplicas = Math.min(availableReplicas, Math.floor(availableReplicas * 0.9));
  
  // Determine status based on replica availability
  let status: Deployment['status'] = 'running';
  if (availableReplicas === 0) status = 'failed';
  else if (availableReplicas < app.replicas) status = 'pending';
  else if (Math.random() > 0.95) status = 'updating';

  // Generate image name based on app
  const getImageForApp = (appName: string): string => {
    if (appName.includes('nginx')) return 'nginx:latest';
    if (appName.includes('api-server')) return 'denshimon/api-server:v1.2.3';
    if (appName.includes('redis')) return 'redis:7-alpine';
    if (appName.includes('postgres')) return 'postgres:15';
    if (appName.includes('frontend')) return 'denshimon/frontend:v2.1.0';
    if (appName.includes('grafana')) return 'grafana/grafana:latest';
    if (appName.includes('prometheus')) return 'prom/prometheus:latest';
    return 'nginx:latest';
  };

  // Calculate node distribution
  const nodeDistribution: Record<string, number> = {};
  appPods.forEach(pod => {
    nodeDistribution[pod.node] = (nodeDistribution[pod.node] || 0) + 1;
  });

  return {
    id: `deployment-${app.name}`,
    name: app.name,
    namespace: app.namespace,
    image: getImageForApp(app.name),
    registryId: app.name.includes('denshimon') ? 'gitea-registry' : 'dockerhub-registry',
    replicas: app.replicas,
    availableReplicas,
    readyReplicas,
    status,
    strategy: {
      type: 'RollingUpdate',
      maxSurge: 1,
      maxUnavailable: 0,
      nodeSpread: true,
      zoneSpread: false,
    },
    nodeDistribution,
    createdAt: new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
    pods: appPods.map(pod => ({
      name: pod.name,
      phase: Math.random() > 0.1 ? 'Running' : (Math.random() > 0.5 ? 'Pending' : 'Failed'),
      ready: Math.random() > 0.1,
      restarts: Math.floor(Math.random() * 3),
      nodeName: pod.node,
      createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      ip: `10.244.${Math.floor(Math.random() * 10)}.${Math.floor(Math.random() * 254) + 1}`,
      labels: {
        app: app.name.split('-')[0],
        version: 'v1.0.0',
      },
    })),
  };
});

// Mock node information
export const mockNodes: NodeInfo[] = MASTER_NODES.map(nodeName => ({
  name: nodeName,
  ready: Math.random() > 0.05, // 95% uptime
  roles: nodeName.includes('control') ? ['control-plane'] : ['worker'],
  version: 'v1.28.2',
  os: 'linux',
  arch: 'amd64',
  zone: nodeName.includes('gpu') ? 'gpu-zone-1' : 'standard-zone-1',
  region: 'us-west-2',
  allocatableResources: {
    cpu: nodeName === 'gpu-node-1' ? '16' : '8',
    memory: nodeName === 'gpu-node-1' ? '64Gi' : '32Gi',
    storage: '100Gi',
  },
  capacity: {
    cpu: nodeName === 'gpu-node-1' ? '16' : '8', 
    memory: nodeName === 'gpu-node-1' ? '64Gi' : '32Gi',
    storage: '100Gi',
  },
  labels: {
    'kubernetes.io/os': 'linux',
    'kubernetes.io/arch': 'amd64',
    'node-role.kubernetes.io/worker': nodeName.includes('worker') ? '' : undefined,
    'node-role.kubernetes.io/control-plane': nodeName.includes('control') ? '' : undefined,
    'node.kubernetes.io/gpu': nodeName.includes('gpu') ? 'nvidia' : undefined,
  },
  createdAt: new Date(Date.now() - Math.random() * 180 * 24 * 60 * 60 * 1000).toISOString(),
}));

// Filter deployments by namespace
export const filterDeploymentsByNamespace = (namespace: string): Deployment[] => {
  if (namespace === 'all') return mockDeployments;
  return mockDeployments.filter(deployment => deployment.namespace === namespace);
};
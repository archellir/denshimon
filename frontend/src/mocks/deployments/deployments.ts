import type { Deployment, NodeInfo } from '@/types/deployments';
import { MASTER_NODES } from '../masterData';
import unifiedMockData from '../unifiedMockData';

// Use unified mock data for consistent deployments
export const mockDeployments: Deployment[] = unifiedMockData.getDeployments();

// Mock node information for single VPS (keep existing logic)
export const mockNodes: NodeInfo[] = MASTER_NODES.map(nodeName => ({
  name: nodeName,
  ready: true, // VPS is running
  roles: ['master', 'worker'], // Single node runs both roles
  version: 'v1.28.2',
  os: 'linux',
  arch: 'amd64',
  zone: 'default',
  region: 'us-west-2',
  allocatable: {
    cpu: '8', // 8 vCPUs on VPS
    memory: '16Gi', // 16GB RAM
    storage: '200Gi', // 200GB disk
  },
  allocatableResources: {
    cpu: '8',
    memory: '16Gi',
    storage: '200Gi',
  },
  capacity: {
    cpu: '8', 
    memory: '16Gi',
    storage: '200Gi',
  },
  podCount: 18, // Current pods running
  labels: {
    'kubernetes.io/os': 'linux',
    'kubernetes.io/arch': 'amd64',
    'node-role.kubernetes.io/master': '',
    'node-role.kubernetes.io/worker': '',
    'kubernetes.io/hostname': 'vps-main',
  } as Record<string, string>,
  createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(), // 15 days uptime
}));

// Filter deployments by namespace using unified data
export const filterDeploymentsByNamespace = (namespace: string): Deployment[] => {
  return unifiedMockData.getDeploymentsByNamespace(namespace);
};
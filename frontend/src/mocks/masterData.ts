/**
 * Master Data Set - Consistent mock data across entire application
 * This ensures all components use the same resource names for search functionality
 */

import { RegistryType, RegistryStatus } from '@constants';
import type { 
  Application, 
  Pod, 
  Service
} from '@/types/mockData';
import type { 
  Registry, 
  ContainerImage
} from '@/types/deployments';

// Core infrastructure data
export const MASTER_NAMESPACES = [
  'default',
  'kube-system', 
  'monitoring',
  'production',
  'staging',
  'denshimon'
] as const;

export const MASTER_NODES = [
  'cluster-main' // Single node running K3s/MicroK8s
] as const;

// Application definitions
export const MASTER_APPLICATIONS: readonly Application[] = [
  {
    name: 'nginx-deployment',
    namespace: 'default',
    replicas: 3,
    pods: ['nginx-deployment-7d9f8c6b5a-abc12', 'nginx-deployment-7d9f8c6b5a-def34', 'nginx-deployment-7d9f8c6b5a-ghi56']
  },
  {
    name: 'api-server-deployment', 
    namespace: 'production',
    replicas: 2,
    pods: ['api-server-deployment-5f7b8c9d-def456', 'api-server-deployment-5f7b8c9d-xyz789']
  },
  {
    name: 'redis-cache',
    namespace: 'production', 
    replicas: 1,
    pods: ['redis-cache-6a8b9c0d-ghi789']
  },
  {
    name: 'postgres-database',
    namespace: 'production',
    replicas: 1, 
    pods: ['postgres-database-1a2b3c4d-jkl012']
  },
  {
    name: 'frontend-app',
    namespace: 'default',
    replicas: 2,
    pods: ['frontend-app-8e9f0a1b-mno345', 'frontend-app-8e9f0a1b-pqr678']
  },
  {
    name: 'grafana',
    namespace: 'monitoring',
    replicas: 1,
    pods: ['grafana-84c9d4cf6b-k8s9x']
  },
  {
    name: 'prometheus-server',
    namespace: 'monitoring', 
    replicas: 1,
    pods: ['prometheus-server-5f8b9c7d6f-xm2n4']
  }
] as const;

// All pods in the system
export const MASTER_PODS: readonly Pod[] = [
  // System pods (K3s/MicroK8s single node)
  { name: 'k3s-server', namespace: 'kube-system', node: 'cluster-main', app: 'k3s-server' },
  { name: 'traefik-7d9f8c6b5a', namespace: 'kube-system', node: 'cluster-main', app: 'traefik' },
  { name: 'local-path-provisioner-5f8b9c7d6f', namespace: 'kube-system', node: 'cluster-main', app: 'local-path-provisioner' },
  { name: 'metrics-server-84c9d4cf6b', namespace: 'kube-system', node: 'cluster-main', app: 'metrics-server' },
  { name: 'coredns-5d78c9869d-xm2n4', namespace: 'kube-system', node: 'cluster-main', app: 'coredns' },

  // Monitoring stack
  { name: 'prometheus-server-5f8b9c7d6f-xm2n4', namespace: 'monitoring', node: 'cluster-main', app: 'prometheus' },
  { name: 'grafana-84c9d4cf6b-k8s9x', namespace: 'monitoring', node: 'cluster-main', app: 'grafana' },

  // Application pods - nginx
  { name: 'nginx-deployment-7d9f8c6b5a-abc12', namespace: 'default', node: 'cluster-main', app: 'nginx' },
  { name: 'nginx-deployment-7d9f8c6b5a-def34', namespace: 'default', node: 'cluster-main', app: 'nginx' },
  { name: 'nginx-deployment-7d9f8c6b5a-ghi56', namespace: 'default', node: 'cluster-main', app: 'nginx' },

  // Application pods - API server
  { name: 'api-server-deployment-5f7b8c9d-def456', namespace: 'production', node: 'cluster-main', app: 'api-server' },
  { name: 'api-server-deployment-5f7b8c9d-xyz789', namespace: 'production', node: 'cluster-main', app: 'api-server' },

  // Database pods
  { name: 'redis-cache-6a8b9c0d-ghi789', namespace: 'production', node: 'cluster-main', app: 'redis' },
  { name: 'postgres-database-1a2b3c4d-jkl012', namespace: 'production', node: 'cluster-main', app: 'postgres' },

  // Frontend pods
  { name: 'frontend-app-8e9f0a1b-mno345', namespace: 'default', node: 'cluster-main', app: 'frontend' },
  { name: 'frontend-app-8e9f0a1b-pqr678', namespace: 'default', node: 'cluster-main', app: 'frontend' },

  // Problem pods
  { name: 'failing-app-deployment-7d9f8c6b5a-k8s9x', namespace: 'production', node: 'cluster-main', app: 'failing-app' },
  { name: 'pending-pod-xyz789', namespace: 'staging', node: 'cluster-main', app: 'pending-app' },
] as const;

// Services
export const MASTER_SERVICES: readonly Service[] = [
  { 
    name: 'kubernetes', 
    namespace: 'default', 
    type: 'ClusterIP',
    serviceType: 'backend', 
    ports: [{ port: 443, targetPort: 6443, protocol: 'TCP' }],
    selector: { component: 'apiserver', provider: 'kubernetes' },
    clusterIP: '10.43.0.1'
  },
  { 
    name: 'kube-dns', 
    namespace: 'kube-system', 
    type: 'ClusterIP',
    serviceType: 'backend', 
    ports: [
      { port: 53, targetPort: 53, protocol: 'UDP' },
      { port: 53, targetPort: 53, protocol: 'TCP' }
    ],
    selector: { 'k8s-app': 'kube-dns' },
    clusterIP: '10.43.0.10'
  },
  { 
    name: 'nginx-service', 
    namespace: 'default', 
    type: 'LoadBalancer',
    serviceType: 'gateway', 
    ports: [{ port: 80, targetPort: 80, protocol: 'TCP' }],
    selector: { app: 'nginx' }
  },
  { 
    name: 'api-gateway', 
    namespace: 'production', 
    type: 'ClusterIP',
    serviceType: 'backend', 
    ports: [{ port: 8080, targetPort: 8080, protocol: 'TCP' }],
    selector: { app: 'api-server' },
    clusterIP: '10.43.1.5'
  },
  { 
    name: 'redis-service', 
    namespace: 'production', 
    type: 'ClusterIP',
    serviceType: 'cache', 
    ports: [{ port: 6379, targetPort: 6379, protocol: 'TCP' }],
    selector: { app: 'redis' },
    clusterIP: '10.43.1.10'
  },
  { 
    name: 'postgres-service', 
    namespace: 'production', 
    type: 'ClusterIP',
    serviceType: 'database', 
    ports: [{ port: 5432, targetPort: 5432, protocol: 'TCP' }],
    selector: { app: 'postgres' },
    clusterIP: '10.43.1.15'
  },
  { 
    name: 'frontend-service', 
    namespace: 'default', 
    type: 'NodePort',
    serviceType: 'frontend', 
    ports: [{ port: 80, targetPort: 3000, protocol: 'TCP' }],
    selector: { app: 'frontend' }
  },
  { 
    name: 'grafana-service', 
    namespace: 'monitoring', 
    type: 'ClusterIP',
    serviceType: 'frontend', 
    ports: [{ port: 3000, targetPort: 3000, protocol: 'TCP' }],
    selector: { app: 'grafana' },
    clusterIP: '10.43.2.5'
  },
  { 
    name: 'prometheus-service', 
    namespace: 'monitoring', 
    type: 'ClusterIP',
    serviceType: 'backend', 
    ports: [{ port: 9090, targetPort: 9090, protocol: 'TCP' }],
    selector: { app: 'prometheus' },
    clusterIP: '10.43.2.10'
  },
] as const;

// Deployments
export const MASTER_DEPLOYMENTS = [
  { name: 'nginx-deployment', namespace: 'default' },
  { name: 'api-server-deployment', namespace: 'production' },
  { name: 'frontend-deployment', namespace: 'default' },
  { name: 'redis-deployment', namespace: 'production' },
  { name: 'postgres-deployment', namespace: 'production' },
  { name: 'grafana-deployment', namespace: 'monitoring' },
  { name: 'prometheus-deployment', namespace: 'monitoring' },
] as const;

// API endpoints
export const MASTER_ENDPOINTS = [
  { name: '/api/v1/users', service: 'api-gateway', namespace: 'production' },
  { name: '/api/v1/auth', service: 'api-gateway', namespace: 'production' },
  { name: '/api/v1/metrics', service: 'api-gateway', namespace: 'production' },
  { name: '/health', service: 'nginx-service', namespace: 'default' },
  { name: '/metrics', service: 'prometheus-service', namespace: 'monitoring' },
  { name: '/dashboard', service: 'grafana-service', namespace: 'monitoring' },
] as const;

// Container Registries
export const MASTER_REGISTRIES: readonly Registry[] = [
  {
    id: '550e8400-e29b-41d4-a716-446655440001',
    name: 'Docker Hub',
    type: RegistryType.DOCKERHUB,
    status: RegistryStatus.CONNECTED,
    config: {
      url: 'https://index.docker.io/v1/',
    },
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-15T10:30:00Z'
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440002',
    name: 'Company Gitea',
    type: RegistryType.GITEA, 
    status: RegistryStatus.CONNECTED,
    config: {
      url: 'https://git.company.com',
      username: 'admin',
      token: 'gitea_token_123',
    },
    createdAt: '2024-01-02T08:00:00Z',
    updatedAt: '2024-01-15T10:25:00Z'
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440003',
    name: 'Private Registry',
    type: RegistryType.GENERIC,
    status: RegistryStatus.ERROR,
    config: {
      url: 'https://registry.company.com',
      username: 'registry_user',
      password: 'registry_pass',
    },
    error: 'Private company registry - authentication issues',
    createdAt: '2024-01-03T12:00:00Z',
    updatedAt: '2024-01-15T09:45:00Z'
  }
] as const;

// Container Images
export const MASTER_IMAGES: readonly ContainerImage[] = [
  {
    registry: 'dockerhub-registry',
    repository: 'nginx',
    tag: 'latest',
    platform: 'linux/amd64',
    size: 142857420,
    created: '2024-01-15T10:30:00Z',
    digest: 'sha256:abc123def456',
    fullName: 'nginx:latest'
  },
  {
    registry: 'dockerhub-registry', 
    repository: 'nginx',
    tag: '1.25',
    platform: 'linux/amd64',
    size: 138947621,
    created: '2024-01-10T08:15:00Z',
    digest: 'sha256:def456ghi789',
    fullName: 'nginx:1.25'
  },
  {
    registry: 'dockerhub-registry',
    repository: 'postgres',
    tag: '15',
    platform: 'linux/amd64',
    size: 387694812,
    created: '2024-01-12T14:20:00Z',
    digest: 'sha256:ghi789jkl012',
    fullName: 'postgres:15'
  },
  {
    registry: 'dockerhub-registry',
    repository: 'redis',
    tag: '7-alpine',
    platform: 'linux/amd64',
    size: 32547896,
    created: '2024-01-08T16:45:00Z',
    digest: 'sha256:jkl012mno345',
    fullName: 'redis:7-alpine'
  },
  {
    registry: 'gitea-registry',
    repository: 'denshimon/api-server',
    tag: 'v1.2.3',
    platform: 'linux/amd64',
    size: 156842973,
    created: '2024-01-18T12:00:00Z',
    digest: 'sha256:mno345pqr678',
    fullName: 'denshimon/api-server:v1.2.3'
  },
  {
    registry: 'gitea-registry',
    repository: 'denshimon/frontend',
    tag: 'v2.1.0',
    platform: 'linux/amd64',
    size: 89357241,
    created: '2024-01-20T09:30:00Z',
    digest: 'sha256:pqr678stu901',
    fullName: 'denshimon/frontend:v2.1.0'
  }
] as const;

// Deployment History
export const MASTER_DEPLOYMENT_HISTORY = [
  {
    id: 'hist-001',
    deploymentId: 'nginx-deployment',
    action: 'create' as const,
    timestamp: '2024-01-20T10:00:00Z',
    user: 'admin',
    success: true,
    image: 'nginx:latest',
    replicas: 3
  },
  {
    id: 'hist-002', 
    deploymentId: 'nginx-deployment',
    action: 'scale' as const,
    timestamp: '2024-01-20T14:30:00Z',
    user: 'devops',
    success: true,
    oldReplicas: 3,
    newReplicas: 5
  },
  {
    id: 'hist-003',
    deploymentId: 'api-server-deployment',
    action: 'update' as const,
    timestamp: '2024-01-21T08:15:00Z',
    user: 'developer',
    success: false,
    oldImage: 'denshimon/api-server:v1.2.2',
    newImage: 'denshimon/api-server:v1.2.3',
    error: 'ImagePullBackOff: authentication required'
  },
  {
    id: 'hist-004',
    deploymentId: 'frontend-deployment',
    action: 'restart' as const,
    timestamp: '2024-01-21T16:45:00Z',
    user: 'admin',
    success: true
  }
] as const;

// Repositories (for GitOps)
export const MASTER_REPOSITORIES = [
  { name: 'nginx-config', url: 'https://git.company.com/k8s/nginx-config', branch: 'main' },
  { name: 'api-server-config', url: 'https://git.company.com/k8s/api-config', branch: 'production' },
  { name: 'frontend-config', url: 'https://git.company.com/k8s/frontend-config', branch: 'main' },
  { name: 'monitoring-stack', url: 'https://git.company.com/k8s/monitoring', branch: 'main' },
] as const;

// Helper functions to get related data
export const getMasterPodsByNamespace = (namespace: string) => 
  MASTER_PODS.filter(pod => pod.namespace === namespace);

export const getMasterPodsByNode = (node: string) => 
  MASTER_PODS.filter(pod => pod.node === node);

export const getMasterServicesByNamespace = (namespace: string) =>
  MASTER_SERVICES.filter(service => service.namespace === namespace);

export const getMasterPodsByApp = (app: string) =>
  MASTER_PODS.filter(pod => pod.app === app);

// Export types for type safety
export type MasterNamespace = typeof MASTER_NAMESPACES[number];
export type MasterNode = typeof MASTER_NODES[number];
export type MasterPod = typeof MASTER_PODS[number];
export type MasterService = typeof MASTER_SERVICES[number];
export type MasterDeployment = typeof MASTER_DEPLOYMENTS[number];
export type MasterEndpoint = typeof MASTER_ENDPOINTS[number];
export type MasterRepository = typeof MASTER_REPOSITORIES[number];
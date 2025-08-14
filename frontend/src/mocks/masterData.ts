/**
 * Master Data Set - Consistent mock data across entire application
 * This ensures all components use the same resource names for search functionality
 */

import { RegistryType, RegistryStatus, DeploymentStatus, DeploymentStrategy } from '@/constants';

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
  'vps-main' // Single VPS node running K3s/MicroK8s
] as const;

// Application definitions
export const MASTER_APPLICATIONS = [
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
export const MASTER_PODS = [
  // System pods (K3s/MicroK8s single node)
  { name: 'k3s-server', namespace: 'kube-system', node: 'vps-main', app: 'k3s-server' },
  { name: 'traefik-7d9f8c6b5a', namespace: 'kube-system', node: 'vps-main', app: 'traefik' },
  { name: 'local-path-provisioner-5f8b9c7d6f', namespace: 'kube-system', node: 'vps-main', app: 'local-path-provisioner' },
  { name: 'metrics-server-84c9d4cf6b', namespace: 'kube-system', node: 'vps-main', app: 'metrics-server' },
  { name: 'coredns-5d78c9869d-xm2n4', namespace: 'kube-system', node: 'vps-main', app: 'coredns' },

  // Monitoring stack
  { name: 'prometheus-server-5f8b9c7d6f-xm2n4', namespace: 'monitoring', node: 'vps-main', app: 'prometheus' },
  { name: 'grafana-84c9d4cf6b-k8s9x', namespace: 'monitoring', node: 'vps-main', app: 'grafana' },

  // Application pods - nginx
  { name: 'nginx-deployment-7d9f8c6b5a-abc12', namespace: 'default', node: 'vps-main', app: 'nginx' },
  { name: 'nginx-deployment-7d9f8c6b5a-def34', namespace: 'default', node: 'vps-main', app: 'nginx' },
  { name: 'nginx-deployment-7d9f8c6b5a-ghi56', namespace: 'default', node: 'vps-main', app: 'nginx' },

  // Application pods - API server
  { name: 'api-server-deployment-5f7b8c9d-def456', namespace: 'production', node: 'vps-main', app: 'api-server' },
  { name: 'api-server-deployment-5f7b8c9d-xyz789', namespace: 'production', node: 'vps-main', app: 'api-server' },

  // Database pods
  { name: 'redis-cache-6a8b9c0d-ghi789', namespace: 'production', node: 'vps-main', app: 'redis' },
  { name: 'postgres-database-1a2b3c4d-jkl012', namespace: 'production', node: 'vps-main', app: 'postgres' },

  // Frontend pods
  { name: 'frontend-app-8e9f0a1b-mno345', namespace: 'default', node: 'vps-main', app: 'frontend' },
  { name: 'frontend-app-8e9f0a1b-pqr678', namespace: 'default', node: 'vps-main', app: 'frontend' },

  // Problem pods
  { name: 'failing-app-deployment-7d9f8c6b5a-k8s9x', namespace: 'production', node: 'vps-main', app: 'failing-app' },
  { name: 'pending-pod-xyz789', namespace: 'staging', node: 'vps-main', app: 'pending-app' },
] as const;

// Services
export const MASTER_SERVICES = [
  { name: 'kubernetes', namespace: 'default', type: 'ClusterIP', serviceType: 'gateway' },
  { name: 'kube-dns', namespace: 'kube-system', type: 'ClusterIP', serviceType: 'backend' },
  { name: 'nginx-service', namespace: 'default', type: 'LoadBalancer', serviceType: 'frontend' },
  { name: 'api-gateway', namespace: 'production', type: 'ClusterIP', serviceType: 'gateway' },
  { name: 'redis-service', namespace: 'production', type: 'ClusterIP', serviceType: 'cache' },
  { name: 'postgres-service', namespace: 'production', type: 'ClusterIP', serviceType: 'database' },
  { name: 'frontend-service', namespace: 'default', type: 'NodePort', serviceType: 'frontend' },
  { name: 'grafana-service', namespace: 'monitoring', type: 'ClusterIP', serviceType: 'frontend' },
  { name: 'prometheus-service', namespace: 'monitoring', type: 'ClusterIP', serviceType: 'backend' },
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
export const MASTER_REGISTRIES = [
  {
    id: 'dockerhub-registry',
    name: 'Docker Hub',
    type: RegistryType.DOCKERHUB,
    status: RegistryStatus.CONNECTED,
    url: 'https://index.docker.io/v1/',
    namespace: undefined
  },
  {
    id: 'gitea-registry',
    name: 'Company Gitea',
    type: RegistryType.GITEA, 
    status: RegistryStatus.CONNECTED,
    url: 'https://git.company.com',
    namespace: 'denshimon'
  },
  {
    id: 'private-registry',
    name: 'Private Registry',
    type: RegistryType.GENERIC,
    status: RegistryStatus.ERROR,
    url: 'https://registry.company.com',
    namespace: undefined,
    error: 'Authentication failed'
  }
] as const;

// Container Images
export const MASTER_IMAGES = [
  {
    registry: 'dockerhub-registry',
    repository: 'nginx',
    tag: 'latest',
    platform: 'linux/amd64',
    size: 142857420,
    created: '2024-01-15T10:30:00Z',
    digest: 'sha256:abc123def456'
  },
  {
    registry: 'dockerhub-registry', 
    repository: 'nginx',
    tag: '1.25',
    platform: 'linux/amd64',
    size: 138947621,
    created: '2024-01-10T08:15:00Z',
    digest: 'sha256:def456ghi789'
  },
  {
    registry: 'dockerhub-registry',
    repository: 'postgres',
    tag: '15',
    platform: 'linux/amd64',
    size: 387694812,
    created: '2024-01-12T14:20:00Z',
    digest: 'sha256:ghi789jkl012'
  },
  {
    registry: 'dockerhub-registry',
    repository: 'redis',
    tag: '7-alpine',
    platform: 'linux/amd64',
    size: 32547896,
    created: '2024-01-08T16:45:00Z',
    digest: 'sha256:jkl012mno345'
  },
  {
    registry: 'gitea-registry',
    repository: 'denshimon/api-server',
    tag: 'v1.2.3',
    platform: 'linux/amd64',
    size: 156842973,
    created: '2024-01-18T12:00:00Z',
    digest: 'sha256:mno345pqr678'
  },
  {
    registry: 'gitea-registry',
    repository: 'denshimon/frontend',
    tag: 'v2.1.0',
    platform: 'linux/amd64',
    size: 89357241,
    created: '2024-01-20T09:30:00Z',
    digest: 'sha256:pqr678stu901'
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
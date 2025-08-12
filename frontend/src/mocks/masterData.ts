/**
 * Master Data Set - Consistent mock data across entire application
 * This ensures all components use the same resource names for search functionality
 */

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
  'control-plane',
  'worker-node-1', 
  'worker-node-2',
  'gpu-node-1'
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
  // System pods
  { name: 'kube-apiserver-control-plane', namespace: 'kube-system', node: 'control-plane', app: 'kube-apiserver' },
  { name: 'kube-controller-manager-control-plane', namespace: 'kube-system', node: 'control-plane', app: 'kube-controller-manager' },
  { name: 'kube-scheduler-control-plane', namespace: 'kube-system', node: 'control-plane', app: 'kube-scheduler' },
  { name: 'etcd-control-plane', namespace: 'kube-system', node: 'control-plane', app: 'etcd' },
  { name: 'coredns-5d78c9869d-xm2n4', namespace: 'kube-system', node: 'worker-node-1', app: 'coredns' },
  { name: 'coredns-5d78c9869d-yz5p7', namespace: 'kube-system', node: 'worker-node-2', app: 'coredns' },

  // Monitoring stack
  { name: 'prometheus-server-5f8b9c7d6f-xm2n4', namespace: 'monitoring', node: 'worker-node-1', app: 'prometheus' },
  { name: 'grafana-84c9d4cf6b-k8s9x', namespace: 'monitoring', node: 'worker-node-2', app: 'grafana' },

  // Application pods - nginx
  { name: 'nginx-deployment-7d9f8c6b5a-abc12', namespace: 'default', node: 'worker-node-1', app: 'nginx' },
  { name: 'nginx-deployment-7d9f8c6b5a-def34', namespace: 'default', node: 'worker-node-2', app: 'nginx' },
  { name: 'nginx-deployment-7d9f8c6b5a-ghi56', namespace: 'default', node: 'worker-node-1', app: 'nginx' },

  // Application pods - API server
  { name: 'api-server-deployment-5f7b8c9d-def456', namespace: 'production', node: 'worker-node-1', app: 'api-server' },
  { name: 'api-server-deployment-5f7b8c9d-xyz789', namespace: 'production', node: 'worker-node-2', app: 'api-server' },

  // Database pods
  { name: 'redis-cache-6a8b9c0d-ghi789', namespace: 'production', node: 'worker-node-1', app: 'redis' },
  { name: 'postgres-database-1a2b3c4d-jkl012', namespace: 'production', node: 'worker-node-2', app: 'postgres' },

  // Frontend pods
  { name: 'frontend-app-8e9f0a1b-mno345', namespace: 'default', node: 'worker-node-1', app: 'frontend' },
  { name: 'frontend-app-8e9f0a1b-pqr678', namespace: 'default', node: 'worker-node-2', app: 'frontend' },

  // Problem pods
  { name: 'failing-app-deployment-7d9f8c6b5a-k8s9x', namespace: 'production', node: 'worker-node-2', app: 'failing-app' },
  { name: 'pending-pod-xyz789', namespace: 'staging', node: 'worker-node-2', app: 'pending-app' },
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
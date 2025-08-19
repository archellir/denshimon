/**
 * Type-safe mock data generator
 * Generates all mock data structures conforming to defined TypeScript types and Zod schemas
 */

import { 
  RegistryType, 
  RegistryStatus, 
  DeploymentStatus, 
  PodStatus, 
  Status,
  LogLevel 
} from '@constants';
import type { 
  Application,
  Pod, 
  Service, 
  Registry,
  ContainerImage,
  Deployment,
  DatabaseConnection,
  LogEntry,
  ServiceHealth,
  Certificate,
  BackupJob,
  DeploymentHistory,
  MasterNamespace,
  MasterNode
} from '@types/mockData';

// ==================== CORE INFRASTRUCTURE ====================

export const TYPED_NAMESPACES: readonly MasterNamespace[] = [
  'default',
  'kube-system',
  'monitoring', 
  'production',
  'staging',
  'denshimon'
] as const;

export const TYPED_NODES: readonly MasterNode[] = [
  'cluster-main'
] as const;

// ==================== APPLICATIONS ====================

export const TYPED_APPLICATIONS: readonly Application[] = [
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

// ==================== PODS ====================

export const TYPED_PODS: readonly Pod[] = [
  // System pods
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

// ==================== SERVICES ====================

export const TYPED_SERVICES: readonly Service[] = [
  {
    name: 'kubernetes',
    namespace: 'default',
    type: 'ClusterIP',
    ports: [{ port: 443, targetPort: 6443, protocol: 'TCP' }],
    selector: { component: 'apiserver', provider: 'kubernetes' },
    clusterIP: '10.43.0.1'
  },
  {
    name: 'kube-dns',
    namespace: 'kube-system',
    type: 'ClusterIP',
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
    ports: [{ port: 80, targetPort: 80, protocol: 'TCP' }],
    selector: { app: 'nginx' }
  },
  {
    name: 'api-gateway',
    namespace: 'production',
    type: 'ClusterIP',
    ports: [{ port: 8080, targetPort: 8080, protocol: 'TCP' }],
    selector: { app: 'api-server' },
    clusterIP: '10.43.1.5'
  },
  {
    name: 'redis-service',
    namespace: 'production',
    type: 'ClusterIP',
    ports: [{ port: 6379, targetPort: 6379, protocol: 'TCP' }],
    selector: { app: 'redis' },
    clusterIP: '10.43.1.10'
  },
  {
    name: 'postgres-service',
    namespace: 'production',
    type: 'ClusterIP',
    ports: [{ port: 5432, targetPort: 5432, protocol: 'TCP' }],
    selector: { app: 'postgres' },
    clusterIP: '10.43.1.15'
  },
  {
    name: 'frontend-service',
    namespace: 'default',
    type: 'NodePort',
    ports: [{ port: 80, targetPort: 3000, protocol: 'TCP' }],
    selector: { app: 'frontend' }
  },
  {
    name: 'grafana-service',
    namespace: 'monitoring',
    type: 'ClusterIP',
    ports: [{ port: 3000, targetPort: 3000, protocol: 'TCP' }],
    selector: { app: 'grafana' },
    clusterIP: '10.43.2.5'
  },
  {
    name: 'prometheus-service',
    namespace: 'monitoring',
    type: 'ClusterIP',
    ports: [{ port: 9090, targetPort: 9090, protocol: 'TCP' }],
    selector: { app: 'prometheus' },
    clusterIP: '10.43.2.10'
  },
] as const;

// ==================== REGISTRIES ====================

export const TYPED_REGISTRIES: readonly Registry[] = [
  {
    id: '550e8400-e29b-41d4-a716-446655440001',
    name: 'Docker Hub',
    type: RegistryType.DOCKERHUB,
    status: RegistryStatus.CONNECTED,
    url: 'https://index.docker.io/v1/',
    lastTested: '2024-01-15T10:30:00Z',
    created: '2024-01-01T00:00:00Z',
    description: 'Official Docker Hub registry',
    isDefault: true
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440002',
    name: 'Company Gitea',
    type: RegistryType.GITEA,
    status: RegistryStatus.CONNECTED,
    url: 'https://git.company.com',
    username: 'admin',
    token: 'gitea_token_123',
    lastTested: '2024-01-15T10:25:00Z',
    created: '2024-01-02T08:00:00Z',
    description: 'Internal Gitea container registry',
    isDefault: false
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440003',
    name: 'Private Registry',
    type: RegistryType.GENERIC,
    status: RegistryStatus.ERROR,
    url: 'https://registry.company.com',
    username: 'registry_user',
    password: 'registry_pass',
    lastTested: '2024-01-15T09:45:00Z',
    created: '2024-01-03T12:00:00Z',
    description: 'Private company registry - authentication issues',
    isDefault: false
  }
] as const;

// ==================== CONTAINER IMAGES ====================

export const TYPED_IMAGES: readonly ContainerImage[] = [
  {
    id: 'nginx-latest',
    name: 'nginx',
    description: 'Official NGINX web server',
    tags: [
      {
        name: 'latest',
        digest: 'sha256:abc123def456',
        size: 142857420,
        created: '2024-01-15T10:30:00Z',
        os: 'linux',
        architecture: 'amd64'
      },
      {
        name: '1.25',
        digest: 'sha256:def456ghi789',
        size: 138947621,
        created: '2024-01-10T08:15:00Z',
        os: 'linux',
        architecture: 'amd64'
      }
    ],
    registry: 'Docker Hub',
    pulls: 5000000,
    stars: 15000,
    lastUpdated: '2024-01-15T10:30:00Z',
    official: true,
    verified: true,
    size: 142857420
  },
  {
    id: 'postgres-15',
    name: 'postgres',
    description: 'PostgreSQL database server',
    tags: [
      {
        name: '15',
        digest: 'sha256:ghi789jkl012',
        size: 387694812,
        created: '2024-01-12T14:20:00Z',
        os: 'linux',
        architecture: 'amd64'
      }
    ],
    registry: 'Docker Hub',
    pulls: 2000000,
    stars: 8500,
    lastUpdated: '2024-01-12T14:20:00Z',
    official: true,
    verified: true,
    size: 387694812
  },
  {
    id: 'redis-7-alpine',
    name: 'redis',
    description: 'Redis in-memory data structure store',
    tags: [
      {
        name: '7-alpine',
        digest: 'sha256:jkl012mno345',
        size: 32547896,
        created: '2024-01-08T16:45:00Z',
        os: 'linux',
        architecture: 'amd64'
      }
    ],
    registry: 'Docker Hub',
    pulls: 3000000,
    stars: 12000,
    lastUpdated: '2024-01-08T16:45:00Z',
    official: true,
    verified: true,
    size: 32547896
  }
] as const;

// ==================== DEPLOYMENTS ====================

export const TYPED_DEPLOYMENTS: readonly Deployment[] = [
  {
    id: '650e8400-e29b-41d4-a716-446655440001',
    name: 'nginx-deployment',
    namespace: 'default',
    image: 'nginx',
    tag: 'latest',
    replicas: 3,
    status: DeploymentStatus.RUNNING,
    strategy: 'RollingUpdate',
    created: '2024-01-01T10:00:00Z',
    updated: '2024-01-15T14:30:00Z',
    labels: {
      app: 'nginx',
      version: '1.0.0',
      environment: 'production'
    },
    ports: [
      { port: 80, targetPort: 80, protocol: 'TCP' }
    ],
    resources: {
      requests: { cpu: '100m', memory: '128Mi' },
      limits: { cpu: '500m', memory: '512Mi' }
    },
    readyReplicas: 3,
    availableReplicas: 3,
    health: Status.HEALTHY
  },
  {
    id: '650e8400-e29b-41d4-a716-446655440002',
    name: 'api-server-deployment',
    namespace: 'production',
    image: 'denshimon/api-server',
    tag: 'v1.2.3',
    replicas: 2,
    status: DeploymentStatus.RUNNING,
    strategy: 'RollingUpdate',
    created: '2024-01-02T09:00:00Z',
    updated: '2024-01-14T16:20:00Z',
    labels: {
      app: 'api-server',
      version: '1.2.3',
      tier: 'backend'
    },
    ports: [
      { port: 8080, targetPort: 8080, protocol: 'TCP' }
    ],
    env: [
      { name: 'NODE_ENV', value: 'production' },
      { name: 'PORT', value: '8080' }
    ],
    resources: {
      requests: { cpu: '200m', memory: '256Mi' },
      limits: { cpu: '1000m', memory: '1Gi' }
    },
    readyReplicas: 2,
    availableReplicas: 2,
    health: Status.HEALTHY
  }
] as const;

// ==================== UTILITY FUNCTIONS ====================

export const getTypedPodsByNamespace = (namespace: MasterNamespace): Pod[] => 
  TYPED_PODS.filter(pod => pod.namespace === namespace);

export const getTypedPodsByNode = (node: MasterNode): Pod[] => 
  TYPED_PODS.filter(pod => pod.node === node);

export const getTypedServicesByNamespace = (namespace: MasterNamespace): Service[] => 
  TYPED_SERVICES.filter(service => service.namespace === namespace);

export const getTypedPodsByApp = (app: string): Pod[] => 
  TYPED_PODS.filter(pod => pod.app === app);

// ==================== EXPORT ALL ====================

export {
  TYPED_NAMESPACES as MASTER_NAMESPACES,
  TYPED_NODES as MASTER_NODES,
  TYPED_APPLICATIONS as MASTER_APPLICATIONS,
  TYPED_PODS as MASTER_PODS,
  TYPED_SERVICES as MASTER_SERVICES,
  TYPED_REGISTRIES as MASTER_REGISTRIES,
  TYPED_IMAGES as MASTER_IMAGES,
  TYPED_DEPLOYMENTS as MASTER_DEPLOYMENTS
};
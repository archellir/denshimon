import { RegistryType, RegistryStatus, DeploymentStatus, DeploymentStrategy, DeploymentAction } from '@constants';

export interface Registry {
  id: string;
  name: string;
  type: RegistryType;
  config: {
    url: string;
    namespace?: string;
    username?: string;
    password?: string;
    token?: string;
  };
  status: RegistryStatus;
  error?: string;
  lastSync?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ContainerImage {
  registry: string;
  repository: string;
  tag: string;
  digest: string;
  size: number;
  created: string;
  platform: string;
  fullName: string;
}

export interface DeploymentRequest {
  name: string;
  namespace: string;
  image: string;
  registryId?: string;
  replicas: number;
  nodeSelector?: Record<string, string>;
  strategy?: {
    type: DeploymentStrategy;
    maxSurge?: number;
    maxUnavailable?: number;
    nodeSpread: boolean;
    zoneSpread: boolean;
  };
  resources: {
    limits: { cpu: string; memory: string; };
    requests: { cpu: string; memory: string; };
  };
  env?: Array<{ name: string; value: string }>;
  ports?: Array<{ containerPort: number; protocol: string }>;
  labels?: Record<string, string>;
  annotations?: Record<string, string>;
  environment?: Record<string, string>;
}

export interface Deployment {
  id: string;
  name: string;
  namespace: string;
  image: string;
  registryId: string;
  replicas: number;
  availableReplicas: number;
  readyReplicas: number;
  updatedReplicas: number;
  nodeSelector?: Record<string, string>;
  strategy: {
    type: DeploymentStrategy;
    maxSurge?: number;
    maxUnavailable?: number;
    nodeSpread: boolean;
    zoneSpread: boolean;
  };
  status: DeploymentStatus;
  pods: PodInfo[];
  nodeDistribution: Record<string, number>;
  resources?: {
    limits?: { cpu?: string; memory?: string; };
    requests?: { cpu?: string; memory?: string; };
  };
  environment?: Record<string, string>;
  createdAt: string;
  updatedAt: string;
}

export interface PodInfo {
  name: string;
  phase: string;
  ready: boolean;
  restarts: number;
  nodeName: string;
  createdAt: string;
  ip: string;
  labels: Record<string, string>;
}

export interface NodeInfo {
  name: string;
  ready: boolean;
  roles: string[];
  version: string;
  os: string;
  arch: string;
  zone?: string;
  region?: string;
  labels: Record<string, string>;
  capacity: { cpu: string; memory: string; };
  allocatable: { cpu: string; memory: string; };
  podCount: number;
}

export interface DeploymentHistory {
  id: string;
  deploymentId: string;
  action: DeploymentAction;
  oldImage?: string;
  newImage?: string;
  oldReplicas?: number;
  newReplicas?: number;
  success: boolean;
  error?: string;
  user?: string;
  timestamp: string;
  metadata?: Record<string, any>;
}
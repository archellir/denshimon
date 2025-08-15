// Common UI and chart interfaces

// Chart tooltip interfaces for Recharts components
export interface ChartTooltipPayload {
  value: number | string;
  name: string;
  color: string;
  dataKey: string;
  payload: Record<string, unknown>;
}

export interface ChartTooltipProps {
  active?: boolean;
  payload?: ChartTooltipPayload[];
  label?: string;
}

export interface PieChartTooltipProps {
  active?: boolean;
  payload?: ChartTooltipPayload[];
}

// Icon component type (for Lucide React icons)
export interface IconComponent {
  size?: number;
  color?: string;
  className?: string;
}

// WebSocket message types
export interface WebSocketMessage {
  type: string;
  data: Record<string, unknown>;
  timestamp?: string;
}

export interface WebSocketCallback {
  (data: Record<string, unknown>): void;
}

// Terminal data interface
export interface TerminalData {
  data: Record<string, unknown>;
  timestamp?: string;
}

// Generic sort value types
export type SortValue = string | number | Date | boolean;

// Settings update interface
export interface SettingsUpdateValue {
  value: string | number | boolean | Record<string, unknown>;
}

// Resource tree node interface
export interface KubernetesResource {
  kind: string;
  apiVersion: string;
  metadata: {
    name: string;
    namespace?: string;
    uid?: string;
    labels?: Record<string, string>;
    annotations?: Record<string, string>;
    ownerReferences?: Array<{
      apiVersion: string;
      kind: string;
      name: string;
      uid: string;
      controller?: boolean;
      blockOwnerDeletion?: boolean;
    }>;
  };
  spec?: Record<string, unknown>;
  status?: Record<string, unknown>;
}

// Database row data interface
export interface DatabaseRowData {
  [column: string]: string | number | boolean | null;
}

// Force graph node and link interfaces
export interface ForceGraphNode {
  id: string;
  name?: string;
  group?: number;
  size?: number;
  color?: string;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  fx?: number | null;
  fy?: number | null;
}

export interface ForceGraphLink {
  source: string | ForceGraphNode;
  target: string | ForceGraphNode;
  value?: number;
  color?: string;
}

// Generic API response transformation helpers
export interface ApiDataTransform<T, R> {
  (data: T): R;
}

// Health card creation interfaces
export interface HealthCardData {
  nodes?: Array<{ status: string }>;
  pods?: Array<{ status: string }>;
  services?: Array<{ status: string }>;
  applications?: Array<{ health: string }>;
  deployments?: Array<{ status: string }>;
  networkPolicies?: Array<{ status: string }>;
  ingresses?: Array<{ status: string }>;
  volumes?: Array<{ status: string }>;
  persistentVolumes?: Array<{ status: string }>;
  
  // Additional properties for health cards
  readyNodes?: number;
  totalNodes?: number;
  runningPods?: number;
  totalPods?: number;
  cpuUsage?: number;
  cpuTrend?: string;
  cpuTrendValue?: number;
  memoryUsage?: number;
  memoryTrend?: string;
  memoryTrendValue?: number;
  requestRate?: number;
  requestTrend?: string;
  errorRate?: number;
  errorTrend?: string;
  p95Latency?: number;
  latencyTrend?: string;
  availability?: number;
  ingressRate?: number;
  ingressTrend?: string;
  egressRate?: number;
  egressTrend?: string;
  connectionErrors?: number;
  connectionErrorsTrend?: string;
  latency?: number;
  throughput?: number;
  throughputTrend?: string;
  storageUsage?: number;
  storageUsageTrend?: string;
  iops?: number;
  iopsTrend?: string;
  availableCapacity?: number;
  capacityTrend?: string;
  activeConnections?: number;
  volumeUsage?: number;
  volumeTrend?: string;
  boundPVCs?: number;
  totalPVCs?: number;
}

// Manifest viewer data
export interface ManifestData {
  [key: string]: unknown;
}

// Form field update interface
export interface FormFieldUpdate<T> {
  (field: keyof T, value: unknown): void;
}

// Action button interface
export interface ActionButton {
  label: string;
  icon: React.ComponentType<IconComponent>;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
}

// API response interfaces for Kubernetes resources
export interface KubernetesServiceAPI {
  name: string;
  namespace: string;
  type: string;
  clusterIP?: string;
  cluster_ip?: string;
  externalIPs?: string[];
  external_ip?: string;
  ports: Array<{ port: number; targetPort: number; protocol: string }>;
  selector: Record<string, string>;
  endpoints?: { ready: number; not_ready: number; total: number };
  age?: string;
  labels: Record<string, string>;
  annotations?: Record<string, string>;
  sessionAffinity?: string;
  status?: string;
  lastUpdated?: string;
}

export interface KubernetesPodStatus {
  phase?: string;
  ready?: boolean;
  restartCount?: number;
  podIP?: string;
}

export interface KubernetesPodSpec {
  nodeName?: string;
  containers?: Array<{
    name: string;
    image: string;
    ready?: boolean;
    restartCount?: number;
    resources?: {
      requests?: { cpu?: string; memory?: string };
      limits?: { cpu?: string; memory?: string };
    };
  }>;
}

export interface KubernetesPodAPI {
  name: string;
  namespace: string;
  node?: string;
  nodeName?: string;
  phase?: string;
  status?: KubernetesPodStatus;
  podIP?: string;
  spec?: KubernetesPodSpec;
  metadata?: {
    creationTimestamp?: string;
    labels?: Record<string, string>;
  };
  ip?: string;
  ready_containers?: number;
  total_containers?: number;
  restarts?: number;
  restartCount?: number;
  ready?: boolean;
  age?: string;
  cpu?: string;
  memory?: string;
}

export interface KubernetesNamespaceStatus {
  phase?: string;
}

export interface KubernetesNamespaceAPI {
  name?: string;
  status?: KubernetesNamespaceStatus;
  phase?: string;
  age?: string;
  labels?: Record<string, string>;
  annotations?: Record<string, string>;
  metadata?: {
    name?: string;
    creationTimestamp?: string;
    labels?: Record<string, string>;
    annotations?: Record<string, string>;
  };
  resourceQuota?: {
    cpu?: string;
    memory?: string;
    pods?: number;
  };
}

// Kubernetes Resource types for ResourceHierarchy
export interface KubernetesResourceMetadata {
  name?: string;
  namespace?: string;
  uid?: string;
  labels?: Record<string, string>;
  annotations?: Record<string, string>;
  creationTimestamp?: string;
  ownerReferences?: Array<{
    apiVersion: string;
    kind: string;
    name: string;
    uid: string;
    controller?: boolean;
    blockOwnerDeletion?: boolean;
  }>;
}

export interface KubernetesResourceStatus {
  phase?: string;
  conditions?: Array<{
    type?: string;
    status?: string;
    lastTransitionTime?: string;
    reason?: string;
    message?: string;
  }>;
}

export interface KubernetesResource {
  apiVersion?: string;
  kind?: string;
  metadata?: KubernetesResourceMetadata;
  status?: KubernetesResourceStatus;
}
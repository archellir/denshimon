export interface ServiceNode {
  id: string;
  name: string;
  namespace: string;
  version: string;
  type: 'frontend' | 'backend' | 'database' | 'cache' | 'gateway';
  status: 'healthy' | 'warning' | 'error' | 'unknown';
  instances: number;
  metrics: {
    requestRate: number; // requests per second
    errorRate: number; // percentage
    latency: {
      p50: number; // milliseconds
      p95: number;
      p99: number;
    };
    successRate: number; // percentage
  };
  circuitBreaker: {
    status: 'closed' | 'open' | 'half-open';
    failureThreshold: number;
    timeout: number; // milliseconds
    lastTripped?: string; // timestamp
  };
  position?: {
    x: number;
    y: number;
  };
}

export interface ServiceConnection {
  id: string;
  source: string; // service ID
  target: string; // service ID
  protocol: 'HTTP' | 'gRPC' | 'TCP' | 'UDP';
  metrics: {
    requestRate: number; // requests per second
    errorRate: number; // percentage
    latency: number; // average milliseconds
    bytesTransferred: number; // bytes per second
  };
  security: {
    encrypted: boolean;
    mTLS: boolean;
    authPolicy?: string;
  };
  retryPolicy?: {
    attempts: number;
    timeout: number;
    backoff: string;
  };
  loadBalancing: 'round_robin' | 'least_conn' | 'random' | 'weighted';
}

export interface APIEndpoint {
  id: string;
  serviceId: string;
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  metrics: {
    requestRate: number;
    errorRate: number;
    latency: {
      p50: number;
      p95: number;
      p99: number;
    };
    statusCodes: Record<string, number>; // status code -> count
  };
  rateLimit?: {
    limit: number; // requests per period
    period: string; // e.g., "1m", "1h"
    current: number;
  };
  authentication: boolean;
  deprecated: boolean;
}

export interface TrafficFlow {
  id: string;
  path: string[]; // array of service IDs representing the flow
  requestRate: number;
  avgLatency: number;
  errorRate: number;
  criticalPath: boolean; // if this is a critical business flow
}

export interface ServiceMeshMetrics {
  overview: {
    totalServices: number;
    totalConnections: number;
    totalRequestRate: number; // cluster-wide RPS
    avgLatency: number;
    errorRate: number;
    mTLSCoverage: number; // percentage
  };
  topServices: {
    byRequestRate: ServiceNode[];
    byLatency: ServiceNode[];
    byErrorRate: ServiceNode[];
  };
  alerts: {
    circuitBreakersOpen: ServiceNode[];
    highErrorRate: ServiceNode[];
    highLatency: ServiceNode[];
    securityIssues: ServiceConnection[];
  };
  trends: {
    requestRateTrend: 'increasing' | 'decreasing' | 'stable';
    latencyTrend: 'increasing' | 'decreasing' | 'stable';
    errorRateTrend: 'increasing' | 'decreasing' | 'stable';
  };
}

export interface ServiceMeshData {
  services: ServiceNode[];
  connections: ServiceConnection[];
  endpoints: APIEndpoint[];
  flows: TrafficFlow[];
  metrics: ServiceMeshMetrics;
  timestamp: string;
}
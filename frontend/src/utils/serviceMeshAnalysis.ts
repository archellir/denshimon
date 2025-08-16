import { ServiceNode, ServiceConnection } from '@/types/serviceMesh';
import { ServiceType as MeshServiceType, MESH_ANALYSIS } from '@constants';

/**
 * Finds all paths between two services in the service mesh
 */
export const findAllPaths = (
  connections: ServiceConnection[], 
  startId: string, 
  endId: string, 
  visited: Set<string> = new Set()
): string[][] => {
  if (startId === endId) return [[startId]];
  if (visited.has(startId)) return [];
  
  visited.add(startId);
  const paths: string[][] = [];
  
  const outgoingConnections = connections.filter(conn => conn.source === startId);
  for (const conn of outgoingConnections) {
    const subPaths = findAllPaths(connections, conn.target, endId, new Set(visited));
    for (const subPath of subPaths) {
      paths.push([startId, ...subPath]);
    }
  }
  
  return paths;
};

/**
 * Finds the critical path in the service mesh based on request rate and service importance
 */
export const findCriticalPath = (
  services: ServiceNode[], 
  connections: ServiceConnection[]
): string[] => {
  // Find path with highest cumulative request rate (critical for VPS performance)
  const frontendServices = services.filter(s => s.type === MeshServiceType.FRONTEND);
  const databaseServices = services.filter(s => s.type === MeshServiceType.DATABASE);
  
  if (frontendServices.length === 0 || databaseServices.length === 0) return [];
  
  let criticalPath: string[] = [];
  let maxCriticality = 0;
  
  for (const frontend of frontendServices) {
    for (const database of databaseServices) {
      const paths = findAllPaths(connections, frontend.id, database.id);
      for (const path of paths) {
        // Calculate criticality based on request rate and service importance
        const pathCriticality = path.reduce((sum, serviceId) => {
          const service = services.find(s => s.id === serviceId);
          return sum + (service?.metrics.requestRate || 0) * 
                 (service?.type === MeshServiceType.GATEWAY ? MESH_ANALYSIS.CRITICAL_PATH.GATEWAY_WEIGHT_MULTIPLIER : 1);
        }, 0);
        
        if (pathCriticality > maxCriticality) {
          maxCriticality = pathCriticality;
          criticalPath = path;
        }
      }
    }
  }
  
  return criticalPath;
};

/**
 * Finds single points of failure in the service mesh
 */
export const findSinglePointsOfFailure = (
  services: ServiceNode[], 
  connections: ServiceConnection[]
): string[] => {
  const spofs: string[] = [];
  
  for (const service of services) {
    // Count incoming and outgoing connections
    const incomingCount = connections.filter(conn => conn.target === service.id).length;
    const outgoingCount = connections.filter(conn => conn.source === service.id).length;
    const totalConnections = incomingCount + outgoingCount;
    
    // VPS SPOF Analysis - services that would crash the entire VPS:
    // 1. Database services with multiple dependents (critical for VPS)
    // 2. Single instance services with high connectivity
    // 3. Gateway services handling all external traffic
    const isDatabaseBottleneck = service.type === MeshServiceType.DATABASE && 
                                 incomingCount > MESH_ANALYSIS.SPOF_DETECTION.DATABASE_CONNECTION_THRESHOLD;
    const isGatewayBottleneck = service.type === MeshServiceType.GATEWAY && 
                               totalConnections > MESH_ANALYSIS.SPOF_DETECTION.GATEWAY_CONNECTION_THRESHOLD;
    const isHighTrafficBottleneck = service.metrics.requestRate > MESH_ANALYSIS.SPOF_DETECTION.HIGH_TRAFFIC_THRESHOLD && 
                                   incomingCount > 1;
    const isSingleServiceType = services.filter(s => s.type === service.type).length === 1 && 
                               totalConnections > 1;
    
    if (isDatabaseBottleneck || isGatewayBottleneck || isHighTrafficBottleneck || isSingleServiceType) {
      spofs.push(service.id);
    }
  }
  
  return spofs;
};

/**
 * Calculates dependency paths for a selected service
 */
export const calculateDependencyPaths = (
  connections: ServiceConnection[],
  selectedService: string
): string[][] => {
  const allPaths: string[][] = [];
  
  // Find all paths from selected service
  const outgoingConnections = connections.filter(conn => conn.source === selectedService);
  for (const conn of outgoingConnections) {
    const paths = findAllPaths(connections, selectedService, conn.target);
    allPaths.push(...paths);
  }
  
  // Find all paths to selected service
  const incomingConnections = connections.filter(conn => conn.target === selectedService);
  for (const conn of incomingConnections) {
    const paths = findAllPaths(connections, conn.source, selectedService);
    allPaths.push(...paths);
  }
  
  return allPaths;
};

/**
 * Analyzes service mesh health and returns metrics
 */
export const analyzeServiceMeshHealth = (
  services: ServiceNode[],
  connections: ServiceConnection[]
): {
  totalServices: number;
  healthyServices: number;
  warningServices: number;
  errorServices: number;
  openCircuitBreakers: number;
  totalConnections: number;
  encryptedConnections: number;
  mTLSConnections: number;
  avgLatency: number;
  avgErrorRate: number;
  totalRequestRate: number;
} => {
  const healthyServices = services.filter(s => s.status === 'healthy').length;
  const warningServices = services.filter(s => s.status === 'warning').length;
  const errorServices = services.filter(s => s.status === 'error').length;
  const openCircuitBreakers = services.filter(s => s.circuitBreaker.status === 'open').length;
  
  const encryptedConnections = connections.filter(c => c.security.encrypted).length;
  const mTLSConnections = connections.filter(c => c.security.mTLS).length;
  
  const avgLatency = services.reduce((sum, s) => sum + s.metrics.latency.p95, 0) / services.length;
  const avgErrorRate = services.reduce((sum, s) => sum + s.metrics.errorRate, 0) / services.length;
  const totalRequestRate = services.reduce((sum, s) => sum + s.metrics.requestRate, 0);
  
  return {
    totalServices: services.length,
    healthyServices,
    warningServices,
    errorServices,
    openCircuitBreakers,
    totalConnections: connections.length,
    encryptedConnections,
    mTLSConnections,
    avgLatency,
    avgErrorRate,
    totalRequestRate
  };
};

/**
 * Gets service connections for a specific service
 */
export const getServiceConnections = (
  connections: ServiceConnection[],
  serviceId: string
): ServiceConnection[] => {
  return connections.filter(c => c.source === serviceId || c.target === serviceId);
};

/**
 * Calculates service importance score based on various factors
 */
export const calculateServiceImportance = (
  service: ServiceNode,
  connections: ServiceConnection[]
): number => {
  const incomingCount = connections.filter(conn => conn.target === service.id).length;
  const outgoingCount = connections.filter(conn => conn.source === service.id).length;
  
  // Base score from request rate
  let score = service.metrics.requestRate / 100;
  
  // Add points for connectivity
  score += (incomingCount + outgoingCount) * 10;
  
  // Add points for service type importance
  switch (service.type) {
    case MeshServiceType.GATEWAY:
      score += 100; // Gateways are critical entry points
      break;
    case MeshServiceType.DATABASE:
      score += 80;  // Databases are critical for data
      break;
    case MeshServiceType.BACKEND:
      score += 50;  // Backend services are important
      break;
    case MeshServiceType.FRONTEND:
      score += 30;  // Frontend services are user-facing
      break;
    default:
      score += 20;
  }
  
  // Penalize for high error rates
  score -= service.metrics.errorRate * 5;
  
  // Penalize for circuit breaker issues
  if (service.circuitBreaker.status === 'open') {
    score -= 50;
  } else if (service.circuitBreaker.status === 'half-open') {
    score -= 25;
  }
  
  return Math.max(0, score);
};

/**
 * Detects potential performance bottlenecks
 */
export const detectBottlenecks = (
  services: ServiceNode[],
  connections: ServiceConnection[]
): ServiceNode[] => {
  return services.filter(service => {
    const incomingCount = connections.filter(conn => conn.target === service.id).length;
    const isHighLatency = service.metrics.latency.p95 > 200;
    const isHighErrorRate = service.metrics.errorRate > 5;
    const isHighTraffic = service.metrics.requestRate > 100;
    const hasMultipleDependents = incomingCount > 2;
    
    return (isHighLatency || isHighErrorRate) && isHighTraffic && hasMultipleDependents;
  });
};

/**
 * Gets traffic flow metrics between services
 */
export const getTrafficFlowMetrics = (connections: ServiceConnection[]): {
  totalTraffic: number;
  avgLatency: number;
  avgErrorRate: number;
  encryptedPercentage: number;
  mTLSPercentage: number;
} => {
  if (connections.length === 0) {
    return {
      totalTraffic: 0,
      avgLatency: 0,
      avgErrorRate: 0,
      encryptedPercentage: 0,
      mTLSPercentage: 0
    };
  }
  
  const totalTraffic = connections.reduce((sum, c) => sum + c.metrics.requestRate, 0);
  const avgLatency = connections.reduce((sum, c) => sum + c.metrics.latency, 0) / connections.length;
  const avgErrorRate = connections.reduce((sum, c) => sum + c.metrics.errorRate, 0) / connections.length;
  const encryptedCount = connections.filter(c => c.security.encrypted).length;
  const mTLSCount = connections.filter(c => c.security.mTLS).length;
  
  return {
    totalTraffic,
    avgLatency,
    avgErrorRate,
    encryptedPercentage: (encryptedCount / connections.length) * 100,
    mTLSPercentage: (mTLSCount / connections.length) * 100
  };
};
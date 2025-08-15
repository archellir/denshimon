import { ServiceMeshData, ServiceNode, ServiceConnection, APIEndpoint, TrafficFlow, ServiceMeshMetrics } from '@/types/serviceMesh';
import { MASTER_SERVICES } from '@mocks/masterData';
import { NetworkProtocol } from '@constants';

const generateServiceId = (name: string, namespace: string) => `${namespace}-${name}`;

const generateServiceNode = (service: typeof MASTER_SERVICES[number]): ServiceNode => {
  const name = service.name;
  const namespace = service.namespace;
  const type = service.serviceType;
  
  // Generate realistic metrics based on service type
  let baseRequestRate = 0;
  let baseErrorRate = 0;
  let baseLatency = { p50: 0, p95: 0, p99: 0 };
  
  switch (type) {
    case 'frontend':
      baseRequestRate = 50 + Math.random() * 200; // 50-250 RPS
      baseErrorRate = 0.5 + Math.random() * 2; // 0.5-2.5%
      baseLatency = { p50: 20 + Math.random() * 30, p95: 100 + Math.random() * 100, p99: 200 + Math.random() * 200 };
      break;
    case 'backend':
      baseRequestRate = 100 + Math.random() * 500; // 100-600 RPS
      baseErrorRate = 0.2 + Math.random() * 1.5; // 0.2-1.7%
      baseLatency = { p50: 10 + Math.random() * 20, p95: 50 + Math.random() * 80, p99: 150 + Math.random() * 150 };
      break;
    case 'database':
      baseRequestRate = 200 + Math.random() * 800; // 200-1000 RPS
      baseErrorRate = 0.1 + Math.random() * 0.5; // 0.1-0.6%
      baseLatency = { p50: 2 + Math.random() * 8, p95: 20 + Math.random() * 30, p99: 50 + Math.random() * 50 };
      break;
    case 'cache':
      baseRequestRate = 500 + Math.random() * 1000; // 500-1500 RPS
      baseErrorRate = 0.05 + Math.random() * 0.2; // 0.05-0.25%
      baseLatency = { p50: 1 + Math.random() * 3, p95: 5 + Math.random() * 10, p99: 15 + Math.random() * 15 };
      break;
    case 'gateway':
      baseRequestRate = 300 + Math.random() * 700; // 300-1000 RPS
      baseErrorRate = 1 + Math.random() * 3; // 1-4%
      baseLatency = { p50: 5 + Math.random() * 15, p95: 30 + Math.random() * 50, p99: 100 + Math.random() * 100 };
      break;
  }
  
  const errorRate = baseErrorRate;
  const successRate = 100 - errorRate;
  
  // Circuit breaker logic
  const cbStatus = errorRate > 5 ? 'open' : 
                   errorRate > 2 ? (Math.random() > 0.7 ? 'half-open' : 'closed') : 'closed';
  
  // Status based on metrics
  const status = cbStatus === 'open' || errorRate > 5 ? 'error' :
                 errorRate > 2 || baseLatency.p95 > 200 ? 'warning' :
                 Math.random() > 0.95 ? 'unknown' : 'healthy';
  
  return {
    id: generateServiceId(name, namespace),
    name,
    namespace,
    version: `v${Math.floor(Math.random() * 3) + 1}.${Math.floor(Math.random() * 10)}.${Math.floor(Math.random() * 10)}`,
    type,
    status,
    instances: Math.floor(Math.random() * 8) + 1,
    metrics: {
      requestRate: Math.round(baseRequestRate * 100) / 100,
      errorRate: Math.round(errorRate * 100) / 100,
      latency: {
        p50: Math.round(baseLatency.p50 * 10) / 10,
        p95: Math.round(baseLatency.p95 * 10) / 10,
        p99: Math.round(baseLatency.p99 * 10) / 10,
      },
      successRate: Math.round(successRate * 100) / 100,
    },
    circuitBreaker: {
      status: cbStatus,
      failureThreshold: 50 + Math.floor(Math.random() * 50), // 50-100%
      timeout: 5000 + Math.floor(Math.random() * 25000), // 5-30 seconds
      lastTripped: cbStatus !== 'closed' ? 
        new Date(Date.now() - Math.random() * 3600000).toISOString() : undefined,
    },
  };
};

const generateConnections = (services: ServiceNode[]): ServiceConnection[] => {
  const connections: ServiceConnection[] = [];
  
  // Create realistic service dependencies
  const frontends = services.filter(s => s.type === 'frontend');
  const backends = services.filter(s => s.type === 'backend');
  const databases = services.filter(s => s.type === 'database');
  const caches = services.filter(s => s.type === 'cache');
  const gateways = services.filter(s => s.type === 'gateway');
  
  // Gateway to frontends
  gateways.forEach(gateway => {
    frontends.forEach(frontend => {
      if (Math.random() > 0.3) { // 70% chance
        connections.push(generateConnection(gateway.id, frontend.id, 'HTTP'));
      }
    });
  });
  
  // Frontends to backends
  frontends.forEach(frontend => {
    backends.forEach(backend => {
      if (Math.random() > 0.5) { // 50% chance
        connections.push(generateConnection(frontend.id, backend.id, 'HTTP'));
      }
    });
  });
  
  // Backends to databases
  backends.forEach(backend => {
    databases.forEach(database => {
      if (Math.random() > 0.4) { // 60% chance
        const protocol = database.name.includes('postgres') ? 'TCP' : 
                        database.name.includes('mongodb') ? 'TCP' : 'HTTP';
        connections.push(generateConnection(backend.id, database.id, protocol));
      }
    });
  });
  
  // Backends to caches
  backends.forEach(backend => {
    caches.forEach(cache => {
      if (Math.random() > 0.6) { // 40% chance
        connections.push(generateConnection(backend.id, cache.id, 'TCP'));
      }
    });
  });
  
  // Some backend-to-backend communication
  for (let i = 0; i < backends.length; i++) {
    for (let j = i + 1; j < backends.length; j++) {
      if (Math.random() > 0.7) { // 30% chance
        const protocol = Math.random() > 0.5 ? 'HTTP' : 'gRPC';
        connections.push(generateConnection(backends[i].id, backends[j].id, protocol));
      }
    }
  }
  
  return connections;
};

const generateConnection = (sourceId: string, targetId: string, protocol: 'HTTP' | 'gRPC' | 'TCP' | 'UDP'): ServiceConnection => {
  // Base metrics vary by protocol
  let baseRequestRate = 0;
  let baseErrorRate = 0;
  let baseLatency = 0;
  let baseBytesTransferred = 0;
  
  switch (protocol) {
    case NetworkProtocol.HTTP:
      baseRequestRate = 50 + Math.random() * 200;
      baseErrorRate = 0.5 + Math.random() * 2;
      baseLatency = 10 + Math.random() * 40;
      baseBytesTransferred = 1000 + Math.random() * 5000; // 1-6 KB/s
      break;
    case NetworkProtocol.GRPC:
      baseRequestRate = 100 + Math.random() * 300;
      baseErrorRate = 0.2 + Math.random() * 1;
      baseLatency = 5 + Math.random() * 20;
      baseBytesTransferred = 500 + Math.random() * 2000; // 0.5-2.5 KB/s
      break;
    case NetworkProtocol.TCP:
      baseRequestRate = 200 + Math.random() * 500;
      baseErrorRate = 0.1 + Math.random() * 0.5;
      baseLatency = 2 + Math.random() * 10;
      baseBytesTransferred = 2000 + Math.random() * 8000; // 2-10 KB/s
      break;
    case NetworkProtocol.UDP:
      baseRequestRate = 500 + Math.random() * 1000;
      baseErrorRate = 0.05 + Math.random() * 0.3;
      baseLatency = 1 + Math.random() * 5;
      baseBytesTransferred = 500 + Math.random() * 2000; // 0.5-2.5 KB/s
      break;
  }
  
  return {
    id: `${sourceId}-${targetId}`,
    source: sourceId,
    target: targetId,
    protocol,
    metrics: {
      requestRate: Math.round(baseRequestRate * 100) / 100,
      errorRate: Math.round(baseErrorRate * 100) / 100,
      latency: Math.round(baseLatency * 10) / 10,
      bytesTransferred: Math.round(baseBytesTransferred),
    },
    security: {
      encrypted: Math.random() > 0.3, // 70% encrypted
      mTLS: Math.random() > 0.5, // 50% mTLS
      authPolicy: Math.random() > 0.4 ? ['JWT', 'OAuth2', 'Basic'][Math.floor(Math.random() * 3)] : undefined,
    },
    retryPolicy: Math.random() > 0.6 ? {
      attempts: Math.floor(Math.random() * 5) + 1,
      timeout: 1000 + Math.floor(Math.random() * 4000),
      backoff: ['exponential', 'linear', 'fixed'][Math.floor(Math.random() * 3)],
    } : undefined,
    loadBalancing: ['round_robin', 'least_conn', 'random', 'weighted'][Math.floor(Math.random() * 4)] as any,
  };
};

const generateAPIEndpoints = (services: ServiceNode[]): APIEndpoint[] => {
  const endpoints: APIEndpoint[] = [];
  
  services.filter(s => s.type === 'frontend' || s.type === 'backend' || s.type === 'gateway').forEach(service => {
    const endpointCount = 3 + Math.floor(Math.random() * 8); // 3-10 endpoints per service
    
    const endpointPaths = {
      frontend: ['/api/users', '/api/orders', '/api/products', '/api/auth', '/api/profile'],
      backend: ['/health', '/metrics', '/users', '/orders', '/payments', '/inventory', '/notifications'],
      gateway: ['/v1/api', '/v2/api', '/auth', '/health', '/status'],
    };
    
    const paths = endpointPaths[service.type as keyof typeof endpointPaths] || ['/health', '/api'];
    
    for (let i = 0; i < endpointCount; i++) {
      const path = paths[i % paths.length] + (i >= paths.length ? `/${i}` : '');
      const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'] as const;
      const method = methods[Math.floor(Math.random() * methods.length)];
      
      const baseRequestRate = service.metrics.requestRate / endpointCount * (0.5 + Math.random());
      const errorRate = service.metrics.errorRate * (0.5 + Math.random() * 1.5);
      
      // Generate status code distribution
      const statusCodes: Record<string, number> = {};
      const successRate = 100 - errorRate;
      statusCodes['200'] = Math.round(baseRequestRate * successRate / 100);
      statusCodes['201'] = method === 'POST' ? Math.round(baseRequestRate * 0.1) : 0;
      statusCodes['400'] = Math.round(baseRequestRate * errorRate * 0.4 / 100);
      statusCodes['401'] = Math.round(baseRequestRate * errorRate * 0.2 / 100);
      statusCodes['404'] = Math.round(baseRequestRate * errorRate * 0.2 / 100);
      statusCodes['500'] = Math.round(baseRequestRate * errorRate * 0.2 / 100);
      
      endpoints.push({
        id: `${service.id}-${path.replace(/\//g, '-')}-${method}`,
        serviceId: service.id,
        path,
        method,
        metrics: {
          requestRate: Math.round(baseRequestRate * 100) / 100,
          errorRate: Math.round(errorRate * 100) / 100,
          latency: {
            p50: service.metrics.latency.p50 * (0.8 + Math.random() * 0.4),
            p95: service.metrics.latency.p95 * (0.8 + Math.random() * 0.4),
            p99: service.metrics.latency.p99 * (0.8 + Math.random() * 0.4),
          },
          statusCodes,
        },
        rateLimit: Math.random() > 0.7 ? {
          limit: Math.floor(Math.random() * 1000 + 100), // 100-1100 requests per period
          period: ['1m', '1h', '1d'][Math.floor(Math.random() * 3)],
          current: Math.floor(Math.random() * 50),
        } : undefined,
        authentication: Math.random() > 0.4, // 60% require auth
        deprecated: Math.random() > 0.9, // 10% deprecated
      });
    }
  });
  
  return endpoints;
};

const generateTrafficFlows = (services: ServiceNode[], connections: ServiceConnection[]): TrafficFlow[] => {
  const flows: TrafficFlow[] = [];
  
  // Generate some critical business flows
  const criticalFlows = [
    ['api-gateway', 'user-service', 'postgres-primary'],
    ['api-gateway', 'order-service', 'payment-service', 'postgres-primary'],
    ['web-ui', 'api-gateway', 'inventory-service', 'mongodb-cluster'],
  ];
  
  criticalFlows.forEach((flowNames, index) => {
    const path = flowNames.map(name => 
      services.find(s => s.name.includes(name.split('-')[0]))?.id
    ).filter(Boolean) as string[];
    
    if (path.length > 1) {
      const relevantConnections = connections.filter(c => 
        path.includes(c.source) && path.includes(c.target)
      );
      
      const avgRequestRate = relevantConnections.reduce((sum, c) => sum + c.metrics.requestRate, 0) / relevantConnections.length;
      const avgLatency = relevantConnections.reduce((sum, c) => sum + c.metrics.latency, 0) / relevantConnections.length;
      const avgErrorRate = relevantConnections.reduce((sum, c) => sum + c.metrics.errorRate, 0) / relevantConnections.length;
      
      flows.push({
        id: `flow-${index}`,
        path,
        requestRate: Math.round(avgRequestRate * 100) / 100,
        avgLatency: Math.round(avgLatency * 10) / 10,
        errorRate: Math.round(avgErrorRate * 100) / 100,
        criticalPath: true,
      });
    }
  });
  
  // Generate some additional flows
  for (let i = 0; i < 5; i++) {
    const randomServices = services.slice().sort(() => 0.5 - Math.random()).slice(0, 2 + Math.floor(Math.random() * 3));
    const path = randomServices.map(s => s.id);
    
    flows.push({
      id: `flow-additional-${i}`,
      path,
      requestRate: 10 + Math.random() * 50,
      avgLatency: 20 + Math.random() * 100,
      errorRate: Math.random() * 3,
      criticalPath: false,
    });
  }
  
  return flows;
};

export const generateServiceMeshData = (): ServiceMeshData => {
  // Generate services from master data
  const services: ServiceNode[] = MASTER_SERVICES.map(service => generateServiceNode(service));
  
  const connections = generateConnections(services);
  const endpoints = generateAPIEndpoints(services);
  const flows = generateTrafficFlows(services, connections);
  
  // Calculate overall metrics
  const totalRequestRate = services.reduce((sum, s) => sum + s.metrics.requestRate, 0);
  const avgLatency = services.reduce((sum, s) => sum + s.metrics.latency.p50, 0) / services.length;
  const avgErrorRate = services.reduce((sum, s) => sum + s.metrics.errorRate, 0) / services.length;
  const mTLSConnections = connections.filter(c => c.security.mTLS).length;
  const mTLSCoverage = (mTLSConnections / connections.length) * 100;
  
  const metrics: ServiceMeshMetrics = {
    overview: {
      totalServices: services.length,
      totalConnections: connections.length,
      totalRequestRate: Math.round(totalRequestRate * 100) / 100,
      avgLatency: Math.round(avgLatency * 10) / 10,
      errorRate: Math.round(avgErrorRate * 100) / 100,
      mTLSCoverage: Math.round(mTLSCoverage * 10) / 10,
    },
    topServices: {
      byRequestRate: [...services].sort((a, b) => b.metrics.requestRate - a.metrics.requestRate).slice(0, 5),
      byLatency: [...services].sort((a, b) => b.metrics.latency.p95 - a.metrics.latency.p95).slice(0, 5),
      byErrorRate: [...services].sort((a, b) => b.metrics.errorRate - a.metrics.errorRate).slice(0, 5),
    },
    alerts: {
      circuitBreakersOpen: services.filter(s => s.circuitBreaker.status === 'open'),
      highErrorRate: services.filter(s => s.metrics.errorRate > 3),
      highLatency: services.filter(s => s.metrics.latency.p95 > 200),
      securityIssues: connections.filter(c => !c.security.encrypted || !c.security.mTLS),
    },
    trends: {
      requestRateTrend: Math.random() > 0.6 ? 'increasing' : Math.random() > 0.3 ? 'stable' : 'decreasing',
      latencyTrend: Math.random() > 0.6 ? 'increasing' : Math.random() > 0.3 ? 'stable' : 'decreasing',
      errorRateTrend: Math.random() > 0.7 ? 'increasing' : Math.random() > 0.4 ? 'stable' : 'decreasing',
    },
  };
  
  return {
    services,
    connections,
    endpoints,
    flows,
    metrics,
    timestamp: new Date().toISOString(),
  };
};
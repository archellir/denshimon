/**
 * Mock API service to provide consistent data when backend is not available
 */

import { mockPods } from '@mocks/k8s/pods';
import { MASTER_SERVICES, MASTER_NAMESPACES } from '@mocks/masterData';

// Convert mockPods to the expected API format
const convertPodMetricsToApiFormat = (pods: typeof mockPods) => {
  return pods.map(pod => ({
    name: pod.name,
    namespace: pod.namespace,
    status: pod.status,
    node: pod.node,
    ready: pod.status === 'Running' ? '1/1' : '0/1',
    restarts: pod.restart_count,
    age: pod.age,
    ip: `10.244.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
    cpu: `${pod.cpu_usage.used}m`,
    memory: `${Math.round(pod.memory_usage.used / 1048576)}Mi`,
    labels: {
      app: pod.name.split('-')[0],
      version: 'v1.0.0'
    }
  }));
};

// Convert services to the expected API format
const convertServicesToApiFormat = () => {
  return MASTER_SERVICES.map(service => ({
    name: service.name,
    namespace: service.namespace,
    type: service.type,
    clusterIP: service.type === 'ClusterIP' ? `10.96.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}` : 'None',
    externalIP: service.type === 'LoadBalancer' ? `192.168.1.${Math.floor(Math.random() * 255)}` : '<none>',
    ports: service.type === 'NodePort' ? '80:30080/TCP' : '80/TCP',
    age: `${Math.floor(Math.random() * 30) + 1}d`,
    selector: {
      app: service.name.replace('-service', '')
    }
  }));
};

/**
 * Setup mock API interceptor
 */
export const setupMockApi = () => {
  // Only setup mocks in development when backend is not available
  if (import.meta.env.PROD) return;

  // Store original fetch
  const originalFetch = window.fetch;

  // Override fetch to intercept API calls
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;

    // Handle pod endpoints
    if (url.includes('/api/k8s/pods')) {
      const urlObj = new URL(url, window.location.origin);
      const namespace = urlObj.searchParams.get('namespace');
      
      let pods = convertPodMetricsToApiFormat(mockPods);
      
      // Filter by namespace if specified
      if (namespace && namespace !== 'all') {
        pods = pods.filter(pod => pod.namespace === namespace);
      }

      return new Response(JSON.stringify(pods), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Handle service endpoints
    if (url.includes('/api/k8s/services')) {
      const urlObj = new URL(url, window.location.origin);
      const namespace = urlObj.searchParams.get('namespace');
      
      let services = convertServicesToApiFormat();
      
      // Filter by namespace if specified
      if (namespace && namespace !== 'all') {
        services = services.filter(service => service.namespace === namespace);
      }

      return new Response(JSON.stringify(services), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Handle namespace endpoints
    if (url.includes('/api/k8s/namespaces')) {
      const namespaces = MASTER_NAMESPACES.map(name => ({
        name,
        status: 'Active',
        age: `${Math.floor(Math.random() * 30) + 1}d`,
        labels: {
          'kubernetes.io/metadata.name': name
        }
      }));

      return new Response(JSON.stringify(namespaces), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Handle auth endpoints
    if (url.includes('/api/auth/login')) {
      return new Response(JSON.stringify({
        token: 'mock-jwt-token',
        user: { username: 'admin', role: 'admin' }
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (url.includes('/api/auth/me')) {
      return new Response(JSON.stringify({
        username: 'admin',
        role: 'admin'
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // For all other requests, try the original fetch
    try {
      return await originalFetch(input, init);
    } catch (error) {
      // If the backend is not available, return a mock error response
      console.warn(`Backend not available for ${url}, returning mock error`);
      return new Response(JSON.stringify({ error: 'Backend not available' }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  };

  console.log('Mock API interceptor setup complete');
};
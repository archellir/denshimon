/**
 * Mock API service to provide consistent data when backend is not available
 */

import { mockPods } from '@mocks/k8s/pods';
import { MASTER_SERVICES, MASTER_NAMESPACES } from '@mocks/masterData';
import unifiedMockData from '@mocks/unifiedMockData';
import { API_ENDPOINTS } from '@constants';

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

// Get unified mock data
const getMockDeployments = () => unifiedMockData.getDeployments();
const getMockPendingDeployments = () => unifiedMockData.getPendingDeployments();

/**
 * Setup mock API interceptor
 */
export const setupMockApi = () => {
  // Only setup mocks when MOCK_DATA is enabled
  if (import.meta.env.VITE_MOCK_DATA !== 'true') return;

  // Store original fetch
  const originalFetch = window.fetch;

  // Override fetch to intercept API calls
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;

    // Handle pod endpoints
    if (url.includes(API_ENDPOINTS.KUBERNETES.PODS)) {
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
    if (url.includes(API_ENDPOINTS.KUBERNETES.SERVICES)) {
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
    if (url.includes(API_ENDPOINTS.KUBERNETES.NAMESPACES)) {
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
    if (url.includes(API_ENDPOINTS.AUTH.LOGIN)) {
      return new Response(JSON.stringify({
        token: 'mock-jwt-token',
        user: { username: 'admin', role: 'admin' }
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (url.includes(API_ENDPOINTS.AUTH.ME)) {
      return new Response(JSON.stringify({
        username: 'admin',
        role: 'admin'
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Handle deployment history endpoints
    if (url.includes('/history')) {
      const deploymentId = url.split('/')[3]; // Extract deployment ID from URL
      const history = unifiedMockData.getDeploymentHistory(deploymentId);
      return new Response(JSON.stringify(history), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Handle individual deployment apply endpoints
    if (url.includes('/apply') && init?.method === 'POST') {
      const pathParts = url.split('/');
      const deploymentId = pathParts[pathParts.length - 2]; // Get ID before /apply
      
      const result = unifiedMockData.applyPendingDeployment(deploymentId);
      
      return new Response(JSON.stringify({
        status: result.success ? 'applied' : 'failed',
        message: result.success ? 'Deployment applied successfully' : result.error
      }), {
        status: result.success ? 200 : 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Handle deployment endpoints
    if (url.includes(API_ENDPOINTS.DEPLOYMENTS.PENDING)) {
      const pendingDeployments = getMockPendingDeployments();
      return new Response(JSON.stringify(pendingDeployments), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (url.includes(API_ENDPOINTS.DEPLOYMENTS.BATCH_APPLY)) {
      const requestBody = await (init?.body ? JSON.parse(init.body.toString()) : {});
      const deploymentIds = requestBody.deployment_ids || [];
      
      // Simulate batch apply with unified mock data
      const results: Record<string, any> = {};
      let successes = 0;
      let failures = 0;
      
      deploymentIds.forEach((id: string) => {
        const result = unifiedMockData.applyPendingDeployment(id);
        results[id] = result.success ? null : new Error(result.error);
        if (result.success) successes++;
        else failures++;
      });

      return new Response(JSON.stringify({
        status: 'completed',
        successes,
        failures,
        results
      }), {
        status: failures > 0 ? 206 : 200, // Partial content if any failures
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (url.includes(API_ENDPOINTS.DEPLOYMENTS.BASE) && 
        !url.includes(API_ENDPOINTS.DEPLOYMENTS.PENDING) && 
        !url.includes(API_ENDPOINTS.DEPLOYMENTS.BATCH_APPLY)) {
      const urlObj = new URL(url, window.location.origin);
      const namespace = urlObj.searchParams.get('namespace');
      
      const deployments = unifiedMockData.getDeploymentsByNamespace(namespace || 'all');

      return new Response(JSON.stringify(deployments), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // For all other requests, try the original fetch
    try {
      return await originalFetch(input, init);
    } catch (error) {
      // If the backend is not available, return a mock error response
      return new Response(JSON.stringify({ error: 'Backend not available' }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  };

};
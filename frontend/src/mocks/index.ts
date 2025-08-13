// Central mock data exports
export { mockNodes } from './k8s/nodes';
export { mockPods } from './k8s/pods';
export { mockNamespaces } from './k8s/namespaces';
export { mockClusterMetrics, mockMetricsHistory, generateMockMetricsHistory } from './metrics/cluster';
export { mockLogs, generateMockLogs } from './logs/system';
// Deployment system mocks
export { mockRegistries } from './deployments/registries';
export { mockImages } from './deployments/images';
export { mockDeployments, mockNodes as mockDeploymentNodes } from './deployments/deployments';
export { mockDeploymentHistory } from './deployments/history';

// Mock environment flag - explicit control over mock data usage
export const MOCK_ENABLED = import.meta.env.VITE_MOCK_DATA === 'true';

// Mock environment configuration

// Mock API responses wrapper - always works when called directly
export const mockApiResponse = <T>(data: T, delay: number = 200): Promise<T> => {
  return new Promise((resolve) => {
    setTimeout(() => resolve(data), delay);
  });
};

// Mock error responses
export const mockApiError = (message: string, status: number = 500): Promise<never> => {
  return new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Error(`HTTP ${status}: ${message}`));
    }, 200);
  });
};
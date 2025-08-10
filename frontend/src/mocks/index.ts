// Central mock data exports
export { mockNodes } from './k8s/nodes';
export { mockPods } from './k8s/pods';
export { mockClusterMetrics, mockMetricsHistory, generateMockMetricsHistory } from './metrics/cluster';
export { mockLogs, generateMockLogs, type LogEntry } from './logs/system';
export { mockRepositories, mockApplications } from './gitops/repositories';

// Mock environment flag
export const MOCK_ENABLED = import.meta.env.VITE_MOCK_DATA === 'true' || import.meta.env.DEV;

// Mock API responses wrapper
export const mockApiResponse = <T>(data: T, delay: number = 200): Promise<T> => {
  if (!MOCK_ENABLED) {
    throw new Error('Mock data is disabled');
  }
  
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
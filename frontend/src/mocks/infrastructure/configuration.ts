import { BaseInfrastructureRepo, SyncMetrics } from '@/types/infrastructure';
import unifiedMockData from '../unifiedMockData';

// Mock base infrastructure repository
export const mockBaseInfrastructureRepo: BaseInfrastructureRepo = {
  id: 'base-infra-001',
  name: 'base-infrastructure',
  url: 'https://git.company.com/infrastructure/base-k8s-configs.git',
  branch: 'main',
  status: 'active',
  last_sync: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 minutes ago
  sync_status: 'synced',
  health: 'healthy'
};

// Generate dynamic sync metrics based on unified data
export const mockSyncMetrics: SyncMetrics = (() => {
  const metrics = unifiedMockData.getMetrics();
  return {
    last_sync_time: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    total_applications: metrics.totalDeployments,
    synced_applications: metrics.runningDeployments,
    out_of_sync_applications: metrics.pendingDeployments,
    recent_deployments: Math.floor(metrics.totalDeployments * 0.6) // 60% are recent
  };
})();

// Additional mock repositories for testing
export const mockInfrastructureRepos: BaseInfrastructureRepo[] = [
  mockBaseInfrastructureRepo,
  {
    id: 'app-configs-002',
    name: 'application-configs',
    url: 'https://git.example.com/infrastructure/app-configs.git',
    branch: 'main',
    status: 'active',
    last_sync: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    sync_status: 'synced',
    health: 'healthy'
  },
  {
    id: 'monitoring-003',
    name: 'monitoring-stack',
    url: 'https://git.example.com/infrastructure/monitoring.git',
    branch: 'main',
    status: 'syncing',
    last_sync: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
    sync_status: 'out_of_sync',
    health: 'degraded'
  }
];

// Mock monitoring and webhook data removed as part of GitOps cleanup
// These were fake features that have been removed from the UI

// Mock recent activity
export const mockRecentActivity = [
  {
    id: 'activity-001',
    type: 'deployment',
    message: 'Deployed nginx-ingress to production',
    timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    status: 'success'
  },
  {
    id: 'activity-002',
    type: 'sync',
    message: 'Synchronized base-infrastructure repository',
    timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    status: 'success'
  },
  {
    id: 'activity-003',
    type: 'config_change',
    message: 'Updated HPA configuration for api-service',
    timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    status: 'success'
  },
  {
    id: 'activity-004',
    type: 'rollback',
    message: 'Rolled back frontend deployment to v2.1.3',
    timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    status: 'warning'
  }
];

// Helper function to simulate sync operation
export const simulateSync = async (repoId: string): Promise<{ success: boolean; message: string }> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const success = Math.random() > 0.1; // 90% success rate
      resolve({
        success,
        message: success 
          ? `Successfully synchronized repository ${repoId}`
          : `Failed to sync repository ${repoId}: Connection timeout`
      });
    }, 2000); // Simulate 2 second sync time
  });
};

// Generate mock sync history
export const generateMockSyncHistory = (count: number = 10) => {
  const history = [];
  const statuses = ['success', 'success', 'success', 'success', 'warning', 'error'];
  
  for (let i = 0; i < count; i++) {
    const timestamp = new Date(Date.now() - (i * 30 * 60 * 1000)); // Every 30 minutes
    history.push({
      id: `sync-history-${i}`,
      repository: mockBaseInfrastructureRepo.name,
      status: statuses[Math.floor(Math.random() * statuses.length)],
      timestamp: timestamp.toISOString(),
      duration: Math.floor(Math.random() * 5000) + 1000, // 1-6 seconds
      changes: Math.floor(Math.random() * 10),
      message: i === 0 ? 'Latest sync completed' : `Sync #${count - i} completed`
    });
  }
  
  return history;
};
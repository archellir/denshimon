import type { Repository, Application } from '@types/gitops';

export const mockRepositories: Repository[] = [
  {
    id: 'repo-1',
    name: 'k8s-configs',
    url: 'https://github.com/company/k8s-configs.git',
    branch: 'main',
    auth_type: 'ssh',
    last_sync: new Date(Date.now() - 10 * 60 * 1000).toISOString(), // 10 minutes ago
    sync_status: 'synced',
    created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
    updated_at: new Date(Date.now() - 10 * 60 * 1000).toISOString()
  },
  {
    id: 'repo-2', 
    name: 'app-manifests',
    url: 'https://github.com/company/app-manifests.git',
    branch: 'production',
    auth_type: 'token',
    last_sync: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 minutes ago
    sync_status: 'synced',
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
    updated_at: new Date(Date.now() - 5 * 60 * 1000).toISOString()
  },
  {
    id: 'repo-3',
    name: 'infrastructure',
    url: 'https://github.com/company/infrastructure.git', 
    branch: 'main',
    auth_type: 'ssh',
    last_sync: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    sync_status: 'out_of_sync',
    sync_error: 'Authentication failed: SSH key expired',
    created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago
    updated_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
  }
];

export const mockApplications: Application[] = [
  {
    id: 'app-1',
    name: 'nginx-app',
    repository_id: 'repo-1',
    path: 'apps/nginx',
    namespace: 'default',
    sync_policy: {
      automated: true,
      prune: true,
      self_heal: true
    },
    health_status: 'healthy',
    sync_status: 'synced',
    last_sync: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 10 * 60 * 1000).toISOString()
  },
  {
    id: 'app-2',
    name: 'api-service',
    repository_id: 'repo-2',
    path: 'services/api',
    namespace: 'production',
    sync_policy: {
      automated: true,
      prune: false,
      self_heal: true
    },
    health_status: 'healthy',
    sync_status: 'synced',
    last_sync: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 5 * 60 * 1000).toISOString()
  },
  {
    id: 'app-3',
    name: 'monitoring-stack',
    repository_id: 'repo-1',
    path: 'monitoring',
    namespace: 'monitoring',
    sync_policy: {
      automated: false,
      prune: true,
      self_heal: false
    },
    health_status: 'progressing',
    sync_status: 'out_of_sync',
    last_sync: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
    created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 30 * 60 * 1000).toISOString()
  },
  {
    id: 'app-4',
    name: 'failing-app',
    repository_id: 'repo-2',
    path: 'apps/failing',
    namespace: 'production',
    sync_policy: {
      automated: true,
      prune: true,
      self_heal: true
    },
    health_status: 'degraded',
    sync_status: 'synced',
    sync_error: 'Pod CrashLoopBackOff: container failed to start',
    last_sync: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 15 * 60 * 1000).toISOString()
  },
  {
    id: 'app-5', 
    name: 'database',
    repository_id: 'repo-3',
    path: 'databases/postgresql',
    namespace: 'production',
    sync_policy: {
      automated: false,
      prune: false,
      self_heal: false
    },
    health_status: 'unknown',
    sync_status: 'unknown',
    sync_error: 'Repository authentication failed',
    last_sync: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
  }
];
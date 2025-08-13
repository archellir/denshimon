import type { Repository, Application } from '@/types/gitops';
import { AuthType, MirrorSyncStatus, DeploymentStatus } from '@/types/gitops';
import { SyncStatus, Status } from '@/constants';

export const mockRepositories: Repository[] = [
  {
    id: 'repo-1',
    name: 'k8s-configs',
    url: 'https://gitea.company.com/ops/k8s-configs.git',
    branch: 'main',
    auth_type: AuthType.SSH,
    last_sync: new Date(Date.now() - 10 * 60 * 1000).toISOString(), // 10 minutes ago
    sync_status: SyncStatus.SYNCED,
    sync_error: null,
    created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
    updated_at: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    // GitHub → Gitea mirror workflow
    github_url: 'https://github.com/company/k8s-configs.git',
    mirror_sync_status: MirrorSyncStatus.SYNCED,
    last_mirror_sync: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 minutes ago
    mirror_sync_error: null
  },
  {
    id: 'repo-2', 
    name: 'app-manifests',
    url: 'https://gitea.company.com/apps/app-manifests.git',
    branch: 'production',
    auth_type: AuthType.TOKEN,
    last_sync: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 minutes ago
    sync_status: SyncStatus.SYNCED,
    sync_error: null,
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
    updated_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    github_url: 'https://github.com/company/app-manifests.git',
    mirror_sync_status: MirrorSyncStatus.SYNCED,
    last_mirror_sync: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
    mirror_sync_error: null
  },
  {
    id: 'repo-3',
    name: 'infrastructure',
    url: 'https://gitea.company.com/infra/infrastructure.git', 
    branch: 'main',
    auth_type: AuthType.SSH,
    last_sync: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    sync_status: SyncStatus.OUT_OF_SYNC,
    sync_error: 'Authentication failed: SSH key expired',
    created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago
    updated_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    github_url: 'https://github.com/company/infrastructure.git',
    mirror_sync_status: MirrorSyncStatus.ERROR,
    last_mirror_sync: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    mirror_sync_error: 'Mirror sync failed: repository not found'
  },
  {
    id: 'repo-4',
    name: 'frontend-apps',
    url: 'https://gitea.company.com/frontend/apps.git',
    branch: 'main',
    auth_type: AuthType.TOKEN,
    last_sync: new Date(Date.now() - 45 * 60 * 1000).toISOString(), // 45 minutes ago
    sync_status: SyncStatus.SYNCED,
    sync_error: null,
    created_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days ago
    updated_at: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    github_url: 'https://github.com/company/frontend-apps.git',
    mirror_sync_status: MirrorSyncStatus.OUT_OF_SYNC,
    last_mirror_sync: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    mirror_sync_error: null
  },
  {
    id: 'repo-5',
    name: 'backend-services',
    url: 'https://gitea.company.com/backend/services.git',
    branch: 'develop',
    auth_type: AuthType.SSH,
    last_sync: new Date(Date.now() - 2 * 60 * 1000).toISOString(), // 2 minutes ago
    sync_status: SyncStatus.PENDING,
    sync_error: null,
    created_at: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(), // 21 days ago
    updated_at: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
    github_url: 'https://github.com/company/backend-services.git',
    mirror_sync_status: MirrorSyncStatus.SYNCING,
    last_mirror_sync: new Date(Date.now() - 1 * 60 * 1000).toISOString(), // 1 minute ago (currently syncing)
    mirror_sync_error: null
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
      auto_sync: true,
      prune: true,
      self_heal: true
    },
    health_status: Status.HEALTHY,
    sync_status: SyncStatus.SYNCED,
    sync_error: null,
    last_sync: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    deployment_status: DeploymentStatus.SUCCESS,
    last_deployment: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    deployment_error: null,
    auto_deploy_on_image_update: true
  },
  {
    id: 'app-2',
    name: 'api-service',
    repository_id: 'repo-2',
    path: 'services/api',
    namespace: 'production',
    sync_policy: {
      auto_sync: true,
      prune: false,
      self_heal: true
    },
    health_status: Status.HEALTHY,
    sync_status: SyncStatus.SYNCED,
    sync_error: null,
    last_sync: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    deployment_status: DeploymentStatus.SUCCESS,
    last_deployment: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
    deployment_error: null,
    auto_deploy_on_image_update: true
  },
  {
    id: 'app-3',
    name: 'monitoring-stack',
    repository_id: 'repo-1',
    path: 'monitoring',
    namespace: 'monitoring',
    sync_policy: {
      auto_sync: false,
      prune: true,
      self_heal: false
    },
    health_status: Status.PROGRESSING,
    sync_status: SyncStatus.OUT_OF_SYNC,
    sync_error: 'Sync operation timed out',
    last_sync: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
    created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    deployment_status: DeploymentStatus.FAILURE,
    last_deployment: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    deployment_error: 'Failed to deploy: image not found',
    auto_deploy_on_image_update: false
  },
  {
    id: 'app-4',
    name: 'failing-app',
    repository_id: 'repo-2',
    path: 'apps/failing',
    namespace: 'production',
    sync_policy: {
      auto_sync: true,
      prune: true,
      self_heal: true
    },
    health_status: Status.DEGRADED,
    sync_status: SyncStatus.SYNCED,
    sync_error: 'Pod CrashLoopBackOff: container failed to start',
    last_sync: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    deployment_status: DeploymentStatus.PENDING,
    last_deployment: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
    deployment_error: null,
    auto_deploy_on_image_update: false
  },
  {
    id: 'app-5', 
    name: 'database',
    repository_id: 'repo-3',
    path: 'databases/postgresql',
    namespace: 'production',
    sync_policy: {
      auto_sync: false,
      prune: false,
      self_heal: false
    },
    health_status: Status.UNKNOWN,
    sync_status: SyncStatus.UNKNOWN,
    sync_error: 'Repository authentication failed',
    last_sync: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    deployment_status: DeploymentStatus.IN_PROGRESS,
    last_deployment: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    deployment_error: null,
    auto_deploy_on_image_update: true
  }
];
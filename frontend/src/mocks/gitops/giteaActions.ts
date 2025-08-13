import type { GiteaAction } from '@/types/gitops';
import { PipelineStatus } from '@/types/gitops';

export const mockGiteaActions: GiteaAction[] = [
  {
    id: 'action-1',
    repository_id: 'repo-1',
    workflow_name: 'Build and Push Image',
    run_number: 42,
    status: PipelineStatus.SUCCESS,
    commit_sha: 'a1b2c3d4e5f6789012345678901234567890abcd',
    commit_message: 'feat(api): add user authentication endpoint',
    branch: 'main',
    actor: 'developer1',
    started_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(), // 15 minutes ago
    completed_at: new Date(Date.now() - 10 * 60 * 1000).toISOString(), // 10 minutes ago
    duration: 300, // 5 minutes
    logs_url: 'https://gitea.company.com/ops/k8s-configs/actions/runs/42/logs',
    artifacts: [
      {
        id: 'artifact-1',
        name: 'k8s-configs:latest',
        type: 'image',
        size_bytes: 157286400, // ~150MB
        download_url: 'https://gitea.company.com/ops/-/packages/container/k8s-configs/latest',
        created_at: new Date(Date.now() - 10 * 60 * 1000).toISOString()
      }
    ]
  },
  {
    id: 'action-2',
    repository_id: 'repo-2',
    workflow_name: 'CI/CD Pipeline',
    run_number: 127,
    status: PipelineStatus.RUNNING,
    commit_sha: 'f1e2d3c4b5a69870123456789012345678901234',
    commit_message: 'fix(auth): resolve token validation issue',
    branch: 'production',
    actor: 'developer2',
    started_at: new Date(Date.now() - 8 * 60 * 1000).toISOString(), // 8 minutes ago
    completed_at: null,
    duration: undefined,
    logs_url: 'https://gitea.company.com/apps/app-manifests/actions/runs/127/logs',
    artifacts: []
  },
  {
    id: 'action-3',
    repository_id: 'repo-1',
    workflow_name: 'Build and Push Image',
    run_number: 41,
    status: PipelineStatus.FAILURE,
    commit_sha: 'b2c3d4e5f6a78901234567890123456789012345',
    commit_message: 'chore(deps): update kubernetes manifests',
    branch: 'main',
    actor: 'developer3',
    started_at: new Date(Date.now() - 45 * 60 * 1000).toISOString(), // 45 minutes ago
    completed_at: new Date(Date.now() - 40 * 60 * 1000).toISOString(), // 40 minutes ago
    duration: 300,
    logs_url: 'https://gitea.company.com/ops/k8s-configs/actions/runs/41/logs',
    artifacts: []
  },
  {
    id: 'action-4',
    repository_id: 'repo-2',
    workflow_name: 'Test and Build',
    run_number: 126,
    status: PipelineStatus.SUCCESS,
    commit_sha: 'c3d4e5f6a7b89012345678901234567890123456',
    commit_message: 'feat(api): implement rate limiting',
    branch: 'production',
    actor: 'developer1',
    started_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    completed_at: new Date(Date.now() - 110 * 60 * 1000).toISOString(), // 1h 50m ago
    duration: 600, // 10 minutes
    logs_url: 'https://gitea.company.com/apps/app-manifests/actions/runs/126/logs',
    artifacts: [
      {
        id: 'artifact-2',
        name: 'api-service:v1.2.3',
        type: 'image',
        size_bytes: 268435456, // ~256MB
        download_url: 'https://gitea.company.com/apps/-/packages/container/api-service/v1.2.3',
        created_at: new Date(Date.now() - 110 * 60 * 1000).toISOString()
      },
      {
        id: 'artifact-3',
        name: 'api-service:latest',
        type: 'image',
        size_bytes: 268435456, // ~256MB
        download_url: 'https://gitea.company.com/apps/-/packages/container/api-service/latest',
        created_at: new Date(Date.now() - 110 * 60 * 1000).toISOString()
      }
    ]
  },
  {
    id: 'action-5',
    repository_id: 'repo-3',
    workflow_name: 'Infrastructure Build',
    run_number: 15,
    status: PipelineStatus.CANCELLED,
    commit_sha: 'd4e5f6a7b8c90123456789012345678901234567',
    commit_message: 'update(infra): migrate to new cluster config',
    branch: 'main',
    actor: 'developer2',
    started_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
    completed_at: new Date(Date.now() - 3.5 * 60 * 60 * 1000).toISOString(), // 3.5 hours ago
    duration: 1800, // 30 minutes before cancellation
    logs_url: 'https://gitea.company.com/infra/infrastructure/actions/runs/15/logs',
    artifacts: []
  }
];
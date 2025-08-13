import type { ContainerImage } from '@/types/gitops';

export const mockContainerImages: ContainerImage[] = [
  {
    id: 'image-1',
    repository_id: 'repo-1',
    name: 'k8s-configs',
    tag: 'latest',
    digest: 'sha256:a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456',
    size_bytes: 157286400, // ~150MB
    architecture: 'amd64',
    os: 'linux',
    created_at: new Date(Date.now() - 10 * 60 * 1000).toISOString(), // 10 minutes ago
    pushed_at: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    pull_count: 23,
    registry_url: 'gitea.company.com/ops/-/packages/container/k8s-configs',
    built_by_action_id: 'action-1'
  },
  {
    id: 'image-2',
    repository_id: 'repo-1',
    name: 'k8s-configs',
    tag: 'v2.1.0',
    digest: 'sha256:b2c3d4e5f6a78901234567890123456789012345ef1234567890abcdef123456',
    size_bytes: 155648000, // ~148MB
    architecture: 'amd64',
    os: 'linux',
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
    pushed_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    pull_count: 145,
    registry_url: 'gitea.company.com/ops/-/packages/container/k8s-configs',
    built_by_action_id: 'action-20'
  },
  {
    id: 'image-3',
    repository_id: 'repo-2',
    name: 'api-service',
    tag: 'latest',
    digest: 'sha256:c3d4e5f6a7b89012345678901234567890123456ef1234567890abcdef123456',
    size_bytes: 268435456, // ~256MB
    architecture: 'amd64',
    os: 'linux',
    created_at: new Date(Date.now() - 110 * 60 * 1000).toISOString(), // 1h 50m ago
    pushed_at: new Date(Date.now() - 110 * 60 * 1000).toISOString(),
    pull_count: 67,
    registry_url: 'gitea.company.com/apps/-/packages/container/api-service',
    built_by_action_id: 'action-4'
  },
  {
    id: 'image-4',
    repository_id: 'repo-2',
    name: 'api-service',
    tag: 'v1.2.3',
    digest: 'sha256:d4e5f6a7b8c90123456789012345678901234567ef1234567890abcdef123456',
    size_bytes: 268435456, // ~256MB
    architecture: 'amd64',
    os: 'linux',
    created_at: new Date(Date.now() - 110 * 60 * 1000).toISOString(), // 1h 50m ago
    pushed_at: new Date(Date.now() - 110 * 60 * 1000).toISOString(),
    pull_count: 34,
    registry_url: 'gitea.company.com/apps/-/packages/container/api-service',
    built_by_action_id: 'action-4'
  },
  {
    id: 'image-5',
    repository_id: 'repo-2',
    name: 'api-service',
    tag: 'v1.2.2',
    digest: 'sha256:e5f6a7b8c9d01234567890123456789012345678ef1234567890abcdef123456',
    size_bytes: 265289728, // ~253MB
    architecture: 'amd64',
    os: 'linux',
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
    pushed_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    pull_count: 89,
    registry_url: 'gitea.company.com/apps/-/packages/container/api-service',
    built_by_action_id: 'action-105'
  },
  {
    id: 'image-6',
    repository_id: 'repo-1',
    name: 'nginx-app',
    tag: 'latest',
    digest: 'sha256:f6a7b8c9d0e12345678901234567890123456789ef1234567890abcdef123456',
    size_bytes: 134217728, // ~128MB
    architecture: 'amd64',
    os: 'linux',
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
    pushed_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    pull_count: 156,
    registry_url: 'gitea.company.com/ops/-/packages/container/nginx-app',
    built_by_action_id: 'action-18'
  },
  {
    id: 'image-7',
    repository_id: 'repo-2',
    name: 'monitoring-stack',
    tag: 'v3.1.0',
    digest: 'sha256:a7b8c9d0e1f23456789012345678901234567890ef1234567890abcdef123456',
    size_bytes: 524288000, // ~500MB
    architecture: 'amd64',
    os: 'linux',
    created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
    pushed_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    pull_count: 78,
    registry_url: 'gitea.company.com/apps/-/packages/container/monitoring-stack',
    built_by_action_id: 'action-95'
  },
  {
    id: 'image-8',
    repository_id: 'repo-3',
    name: 'postgresql',
    tag: 'v14.8-alpine',
    digest: 'sha256:b8c9d0e1f2a34567890123456789012345678901ef1234567890abcdef123456',
    size_bytes: 209715200, // ~200MB
    architecture: 'amd64',
    os: 'linux',
    created_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days ago
    pushed_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    pull_count: 234,
    registry_url: 'gitea.company.com/infra/-/packages/container/postgresql',
    built_by_action_id: 'action-8'
  }
];
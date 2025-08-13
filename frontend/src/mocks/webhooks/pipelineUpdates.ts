import { PipelineStatus, DeploymentStatus, MirrorSyncStatus } from '@/types/gitops';
import type { PipelineUpdatePayload, GitHubWebhookPayload, GiteaWebhookPayload } from '@/types/gitops';

export const generateMockPipelineUpdate = (): PipelineUpdatePayload => {
  const types = ['mirror_sync', 'action_status', 'image_push', 'deployment_status'] as const;
  const type = types[Math.floor(Math.random() * types.length)];
  
  let status: PipelineStatus | DeploymentStatus | MirrorSyncStatus;
  
  switch (type) {
    case 'mirror_sync':
      status = Math.random() > 0.3 ? MirrorSyncStatus.SYNCED : MirrorSyncStatus.SYNCING;
      break;
    case 'action_status':
      status = Math.random() > 0.2 ? PipelineStatus.SUCCESS : 
               Math.random() > 0.5 ? PipelineStatus.RUNNING : PipelineStatus.FAILURE;
      break;
    case 'image_push':
      status = PipelineStatus.SUCCESS;
      break;
    case 'deployment_status':
      status = Math.random() > 0.2 ? DeploymentStatus.SUCCESS : 
               Math.random() > 0.5 ? DeploymentStatus.IN_PROGRESS : DeploymentStatus.FAILURE;
      break;
  }
  
  return {
    type,
    repository_id: `repo-${Math.floor(Math.random() * 3) + 1}`,
    status,
    timestamp: new Date().toISOString(),
    metadata: {
      action_id: type === 'action_status' ? `action-${Date.now()}` : undefined,
      image_id: type === 'image_push' ? `image-${Date.now()}` : undefined,
      deployment_id: type === 'deployment_status' ? `deploy-${Date.now()}` : undefined,
      commit_sha: Math.random().toString(36).substring(2, 10),
      branch: Math.random() > 0.7 ? 'main' : 'production',
      duration: Math.floor(Math.random() * 600) + 30
    }
  };
};

export const generateMockGitHubWebhook = (): GitHubWebhookPayload => {
  const actions = ['push', 'pull_request', 'release', 'create'] as const;
  const action = actions[Math.floor(Math.random() * actions.length)];
  
  return {
    action,
    repository: {
      id: Math.floor(Math.random() * 1000) + 1,
      name: `repo-${Math.floor(Math.random() * 3) + 1}`,
      full_name: `user/repo-${Math.floor(Math.random() * 3) + 1}`,
      html_url: `https://github.com/user/repo-${Math.floor(Math.random() * 3) + 1}`,
      clone_url: `https://github.com/user/repo-${Math.floor(Math.random() * 3) + 1}.git`
    },
    ref: action === 'push' ? 'refs/heads/main' : undefined,
    commits: action === 'push' ? [{
      id: Math.random().toString(36).substring(2, 10),
      message: 'feat: update application configuration',
      author: {
        name: 'Developer',
        email: 'dev@company.com'
      },
      timestamp: new Date().toISOString()
    }] : undefined,
    pusher: action === 'push' ? {
      name: 'Developer',
      email: 'dev@company.com'
    } : undefined
  };
};

export const generateMockGiteaWebhook = (): GiteaWebhookPayload => {
  const actions = ['completed', 'started', 'pushed', 'created'] as const;
  const action = actions[Math.floor(Math.random() * actions.length)];
  
  const payload: GiteaWebhookPayload = {
    action,
    repository: {
      id: Math.floor(Math.random() * 1000) + 1,
      name: `repo-${Math.floor(Math.random() * 3) + 1}`,
      full_name: `user/repo-${Math.floor(Math.random() * 3) + 1}`,
      html_url: `https://gitea.company.com/user/repo-${Math.floor(Math.random() * 3) + 1}`,
      clone_url: `https://gitea.company.com/user/repo-${Math.floor(Math.random() * 3) + 1}.git`
    }
  };
  
  if (action === 'completed' || action === 'started') {
    payload.workflow_run = {
      id: `run-${Date.now()}`,
      name: 'Build and Push Image',
      status: action === 'completed' ? PipelineStatus.SUCCESS : PipelineStatus.RUNNING,
      conclusion: action === 'completed' ? 'success' : undefined,
      head_sha: Math.random().toString(36).substring(2, 10),
      head_branch: 'main',
      run_number: Math.floor(Math.random() * 100) + 1,
      actor: {
        login: 'developer1',
        avatar_url: 'https://avatars.githubusercontent.com/u/1234567?v=4'
      },
      created_at: new Date(Date.now() - Math.random() * 3600000).toISOString(),
      updated_at: new Date().toISOString(),
      html_url: `https://gitea.company.com/user/repo/actions/runs/${Date.now()}`
    };
  }
  
  if (action === 'created') {
    payload.package = {
      id: `pkg-${Date.now()}`,
      name: `repo-${Math.floor(Math.random() * 3) + 1}`,
      package_type: 'container',
      version: {
        id: `ver-${Date.now()}`,
        name: 'latest',
        tag: 'latest'
      },
      registry_url: 'https://gitea.company.com/user/-/packages/container/repo/latest',
      created_at: new Date().toISOString()
    };
  }
  
  return payload;
};
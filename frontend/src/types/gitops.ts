import { SyncStatus, Status, SortDirection } from '@/constants';

export enum AuthType {
  NONE = 'none',
  TOKEN = 'token',
  SSH = 'ssh'
}

export enum PipelineStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  SUCCESS = 'success',
  FAILURE = 'failure',
  CANCELLED = 'cancelled',
  SKIPPED = 'skipped'
}

export enum DeploymentStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  SUCCESS = 'success',
  FAILURE = 'failure',
  CANCELLED = 'cancelled',
  ROLLBACK = 'rollback'
}

export enum MirrorSyncStatus {
  SYNCED = 'synced',
  OUT_OF_SYNC = 'out_of_sync',
  SYNCING = 'syncing',
  ERROR = 'error',
  UNKNOWN = 'unknown'
}

export interface Repository {
  id: string;
  name: string;
  url: string;
  branch: string;
  auth_type: AuthType;
  sync_status: SyncStatus;
  last_sync: string | null;
  sync_error: string | null;
  created_at: string;
  updated_at: string;
  // GitHub → Gitea mirror workflow
  github_url?: string;
  mirror_sync_status: MirrorSyncStatus;
  last_mirror_sync?: string | null;
  mirror_sync_error?: string | null;
}

export interface GiteaAction {
  id: string;
  repository_id: string;
  workflow_name: string;
  run_number: number;
  status: PipelineStatus;
  commit_sha: string;
  commit_message: string;
  branch: string;
  actor: string;
  started_at: string;
  completed_at?: string | null;
  duration?: number; // seconds
  logs_url?: string;
  artifacts: GiteaArtifact[];
}

export interface GiteaArtifact {
  id: string;
  name: string;
  type: 'image' | 'package' | 'binary' | 'other';
  size_bytes: number;
  download_url: string;
  created_at: string;
}

export interface ContainerImage {
  id: string;
  repository_id: string;
  name: string;
  tag: string;
  digest: string;
  size_bytes: number;
  architecture: string;
  os: string;
  created_at: string;
  pushed_at: string;
  pull_count: number;
  registry_url: string;
  // Link to the Gitea Action that built this image
  built_by_action_id?: string;
}

export interface CreateRepositoryRequest {
  name: string;
  url: string;
  branch: string;
  auth_type: AuthType;
  credentials: {
    token?: string;
    private_key?: string;
    passphrase?: string;
  };
}

export interface SyncPolicy {
  auto_sync: boolean;
  prune: boolean;
  self_heal: boolean;
}

export interface Application {
  id: string;
  name: string;
  repository_id: string;
  path: string;
  namespace: string;
  sync_status: SyncStatus;
  health_status: Status;
  sync_policy: SyncPolicy;
  last_sync: string | null;
  sync_error: string | null;
  created_at: string;
  updated_at: string;
  // Deployment from Gitea-built images
  current_image?: ContainerImage;
  target_image?: ContainerImage;
  deployment_status: DeploymentStatus;
  last_deployment?: string | null;
  deployment_error?: string | null;
  auto_deploy_on_image_update: boolean;
}

export interface DeploymentHistory {
  id: string;
  application_id: string;
  image: ContainerImage;
  status: DeploymentStatus;
  triggered_by: 'manual' | 'auto' | 'webhook';
  triggered_by_user?: string;
  started_at: string;
  completed_at?: string | null;
  duration?: number; // seconds
  error_message?: string | null;
  rollback_target?: string | null; // Previous deployment ID if this was a rollback
}

export interface CreateApplicationRequest {
  name: string;
  repository_id: string;
  path: string;
  namespace: string;
  sync_policy: SyncPolicy;
}

export interface GitCommitInfo {
  hash: string;
  author: string;
  email: string;
  timestamp: string;
  message: string;
}

export interface RepositoryStatus {
  repository_id: string;
  branch: string;
  status: string;
  commits: GitCommitInfo[];
  synced_at: string;
}

export interface CommitRequest {
  message: string;
  paths: string[];
}

export interface DiffResponse {
  repository_id: string;
  path?: string;
  diff: string;
}

export interface GitOpsStore {
  // Data
  repositories: Repository[];
  applications: Application[];
  giteaActions: GiteaAction[];
  containerImages: ContainerImage[];
  deploymentHistory: DeploymentHistory[];
  
  // Loading states
  isLoading: boolean;
  isCreating: boolean;
  isSyncing: boolean;
  isDeploying: boolean;
  error: string | null;
  
  // Filters and sorting
  repositoryFilter: string;
  applicationFilter: string;
  sortBy: string;
  sortOrder: SortDirection;
  
  // Setters
  setRepositories: (repositories: Repository[]) => void;
  setApplications: (applications: Application[]) => void;
  setGiteaActions: (actions: GiteaAction[]) => void;
  setContainerImages: (images: ContainerImage[]) => void;
  setDeploymentHistory: (history: DeploymentHistory[]) => void;
  setLoading: (isLoading: boolean) => void;
  setCreating: (isCreating: boolean) => void;
  setSyncing: (isSyncing: boolean) => void;
  setDeploying: (isDeploying: boolean) => void;
  setError: (error: string | null) => void;
  setRepositoryFilter: (filter: string) => void;
  setApplicationFilter: (filter: string) => void;
  setSortBy: (sortBy: string) => void;
  setSortOrder: (sortOrder: SortDirection) => void;
  
  // Repository Actions
  fetchRepositories: () => Promise<void>;
  createRepository: (repository: CreateRepositoryRequest) => Promise<Repository>;
  deleteRepository: (id: string) => Promise<void>;
  syncRepository: (id: string) => Promise<void>;
  triggerMirrorSync: (id: string) => Promise<void>;
  
  // Git Operations
  pullRepository: (id: string) => Promise<void>;
  getRepositoryStatus: (id: string) => Promise<RepositoryStatus>;
  commitAndPush: (id: string, commitData: CommitRequest) => Promise<void>;
  getRepositoryDiff: (id: string, path?: string) => Promise<DiffResponse>;
  
  // Application Actions
  fetchApplications: () => Promise<void>;
  createApplication: (application: CreateApplicationRequest) => Promise<Application>;
  deleteApplication: (id: string) => Promise<void>;
  syncApplication: (id: string) => Promise<void>;
  deployApplication: (id: string, imageId: string) => Promise<void>;
  rollbackApplication: (id: string, deploymentId: string) => Promise<void>;
  
  // Gitea Actions Integration
  fetchGiteaActions: (repositoryId?: string) => Promise<void>;
  triggerGiteaAction: (repositoryId: string, workflowName: string) => Promise<void>;
  getActionLogs: (actionId: string) => Promise<string>;
  
  // Container Images
  fetchContainerImages: (repositoryId?: string) => Promise<void>;
  getImagesByRepository: (repositoryId: string) => ContainerImage[];
  getLatestImage: (repositoryId: string, tag?: string) => ContainerImage | null;
  
  // Deployment History
  fetchDeploymentHistory: (applicationId?: string) => Promise<void>;
  getDeploymentsByApplication: (applicationId: string) => DeploymentHistory[];
  
  // Computed
  getFilteredRepositories: () => Repository[];
  getFilteredApplications: () => Application[];
  
  // Cleanup
  clearGitOps: () => void;
  
  // WebSocket integration
  initializeWebSocket: () => void;
  cleanupWebSocket: () => void;
}

// ============================================================================
// WEBHOOK PAYLOAD TYPES
// ============================================================================

export interface GitHubWebhookPayload {
  action: 'push' | 'pull_request' | 'release' | 'create' | 'delete';
  repository: {
    id: number;
    name: string;
    full_name: string;
    html_url: string;
    clone_url: string;
  };
  ref?: string;
  commits?: Array<{
    id: string;
    message: string;
    author: {
      name: string;
      email: string;
    };
    timestamp: string;
  }>;
  pusher?: {
    name: string;
    email: string;
  };
}

export interface GiteaWebhookPayload {
  action: 'opened' | 'closed' | 'synchronized' | 'pushed' | 'created' | 'completed' | 'started';
  repository: {
    id: number;
    name: string;
    full_name: string;
    html_url: string;
    clone_url: string;
  };
  workflow_run?: {
    id: string;
    name: string;
    status: PipelineStatus;
    conclusion?: string;
    head_sha: string;
    head_branch: string;
    run_number: number;
    actor: {
      login: string;
      avatar_url: string;
    };
    created_at: string;
    updated_at: string;
    html_url: string;
  };
  package?: {
    id: string;
    name: string;
    package_type: 'container';
    version: {
      id: string;
      name: string;
      tag: string;
    };
    registry_url: string;
    created_at: string;
  };
}

export interface PipelineUpdatePayload {
  type: 'mirror_sync' | 'action_status' | 'image_push' | 'deployment_status';
  repository_id: string;
  status: PipelineStatus | DeploymentStatus | MirrorSyncStatus;
  timestamp: string;
  metadata?: {
    action_id?: string;
    image_id?: string;
    deployment_id?: string;
    error_message?: string;
    duration?: number;
    commit_sha?: string;
    branch?: string;
  };
}
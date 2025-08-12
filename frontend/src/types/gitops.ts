import { SyncStatus, HealthStatus, SortDirection } from '@/constants';

export enum AuthType {
  NONE = 'none',
  TOKEN = 'token',
  SSH = 'ssh'
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
  health_status: HealthStatus;
  sync_policy: SyncPolicy;
  last_sync: string | null;
  sync_error: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateApplicationRequest {
  name: string;
  repository_id: string;
  path: string;
  namespace: string;
  sync_policy: SyncPolicy;
}

export interface GitOpsStore {
  // Data
  repositories: Repository[];
  applications: Application[];
  
  // Loading states
  isLoading: boolean;
  isCreating: boolean;
  isSyncing: boolean;
  error: string | null;
  
  // Filters and sorting
  repositoryFilter: string;
  applicationFilter: string;
  sortBy: string;
  sortOrder: SortDirection;
  
  // Setters
  setRepositories: (repositories: Repository[]) => void;
  setApplications: (applications: Application[]) => void;
  setLoading: (isLoading: boolean) => void;
  setCreating: (isCreating: boolean) => void;
  setSyncing: (isSyncing: boolean) => void;
  setError: (error: string | null) => void;
  setRepositoryFilter: (filter: string) => void;
  setApplicationFilter: (filter: string) => void;
  setSortBy: (sortBy: string) => void;
  setSortOrder: (sortOrder: SortDirection) => void;
  
  // Actions
  fetchRepositories: () => Promise<void>;
  fetchApplications: () => Promise<void>;
  createRepository: (repository: CreateRepositoryRequest) => Promise<Repository>;
  createApplication: (application: CreateApplicationRequest) => Promise<Application>;
  deleteRepository: (id: string) => Promise<void>;
  deleteApplication: (id: string) => Promise<void>;
  syncRepository: (id: string) => Promise<void>;
  syncApplication: (id: string) => Promise<void>;
  
  // Computed
  getFilteredRepositories: () => Repository[];
  getFilteredApplications: () => Application[];
  
  // Cleanup
  clearGitOps: () => void;
}
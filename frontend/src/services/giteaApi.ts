/**
 * Gitea API Client for Frontend
 * Communicates with backend Gitea API endpoints
 */

export interface GiteaRepository {
  id: number;
  name: string;
  full_name: string;
  description: string;
  private: boolean;
  fork: boolean;
  created_at: string;
  updated_at: string;
  pushed_at: string;
  size: number;
  stargazers_count: number;
  watchers_count: number;
  forks_count: number;
  open_issues_count: number;
  default_branch: string;
  archived: boolean;
  clone_url: string;
  ssh_url: string;
  html_url: string;
  owner: {
    id: number;
    login: string;
    avatar_url: string;
  };
}

export interface GiteaCommit {
  sha: string;
  commit: {
    author: {
      name: string;
      email: string;
      date: string;
    };
    committer: {
      name: string;
      email: string;
      date: string;
    };
    message: string;
  };
  author?: {
    id: number;
    login: string;
    avatar_url: string;
  };
}

export interface GiteaBranch {
  name: string;
  commit: {
    sha: string;
    url: string;
  };
  protected: boolean;
}

export interface GiteaPullRequest {
  id: number;
  number: number;
  state: 'open' | 'closed';
  title: string;
  body: string;
  created_at: string;
  updated_at: string;
  closed_at?: string;
  merged_at?: string;
  head: {
    label: string;
    ref: string;
    sha: string;
  };
  base: {
    label: string;
    ref: string;
    sha: string;
  };
  user: {
    id: number;
    login: string;
    avatar_url: string;
  };
}

export interface GiteaRelease {
  id: number;
  tag_name: string;
  target_commitish: string;
  name: string;
  body: string;
  draft: boolean;
  prerelease: boolean;
  created_at: string;
  published_at: string;
  author: {
    id: number;
    login: string;
    avatar_url: string;
  };
}

export interface GiteaWorkflowRun {
  id: number;
  name: string;
  head_branch: string;
  head_sha: string;
  run_number: number;
  event: string;
  status: 'queued' | 'in_progress' | 'completed';
  conclusion?: 'success' | 'failure' | 'cancelled' | 'skipped';
  workflow_id: number;
  created_at: string;
  updated_at: string;
}

class GiteaApiClient {
  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('auth_token');
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
    };
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `/api/gitea${endpoint}`;
    
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...this.getAuthHeaders(),
          ...options.headers,
        },
      });

      if (!response.ok) {
        if (response.status === 503) {
          throw new Error('Gitea integration not configured');
        }
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Gitea API request failed:', error);
      throw error;
    }
  }

  // Repository endpoints
  async listRepositories(page = 1, limit = 20): Promise<GiteaRepository[]> {
    return this.request<GiteaRepository[]>(`/repositories?page=${page}&limit=${limit}`);
  }

  async getRepository(owner: string, repo: string): Promise<GiteaRepository> {
    return this.request<GiteaRepository>(`/repositories/${owner}/${repo}`);
  }

  // Commit endpoints
  async listCommits(owner: string, repo: string, branch?: string, page = 1): Promise<GiteaCommit[]> {
    const params = new URLSearchParams({ page: page.toString() });
    if (branch) params.append('branch', branch);
    
    return this.request<GiteaCommit[]>(`/repositories/${owner}/${repo}/commits?${params}`);
  }

  // Branch endpoints
  async listBranches(owner: string, repo: string): Promise<GiteaBranch[]> {
    return this.request<GiteaBranch[]>(`/repositories/${owner}/${repo}/branches`);
  }

  // Pull Request endpoints
  async listPullRequests(
    owner: string, 
    repo: string, 
    state: 'open' | 'closed' | 'all' = 'open',
    page = 1
  ): Promise<GiteaPullRequest[]> {
    return this.request<GiteaPullRequest[]>(
      `/repositories/${owner}/${repo}/pulls?state=${state}&page=${page}`
    );
  }

  // Release endpoints
  async listReleases(owner: string, repo: string, page = 1): Promise<GiteaRelease[]> {
    return this.request<GiteaRelease[]>(`/repositories/${owner}/${repo}/releases?page=${page}`);
  }

  // Workflow/Actions endpoints
  async listWorkflowRuns(owner: string, repo: string, page = 1): Promise<GiteaWorkflowRun[]> {
    return this.request<GiteaWorkflowRun[]>(
      `/repositories/${owner}/${repo}/actions/runs?page=${page}`
    );
  }

  // Deployment endpoint
  async triggerDeployment(
    owner: string,
    repo: string,
    ref: string = 'main',
    environment: string = 'production'
  ): Promise<{ status: string; ref: string; environment: string }> {
    return this.request(`/repositories/${owner}/${repo}/deploy`, {
      method: 'POST',
      body: JSON.stringify({ ref, environment }),
    });
  }

  // Helper methods for common operations
  async getRepositoryOverview(owner: string, repo: string): Promise<{
    repository: GiteaRepository | null;
    branches: GiteaBranch[];
    recentCommits: GiteaCommit[];
    openPullRequests: GiteaPullRequest[];
    latestRelease?: GiteaRelease;
    workflowRuns: GiteaWorkflowRun[];
  }> {
    const [repository, branches, recentCommits, openPullRequests, releases, workflowRuns] = await Promise.allSettled([
      this.getRepository(owner, repo),
      this.listBranches(owner, repo),
      this.listCommits(owner, repo, undefined, 1),
      this.listPullRequests(owner, repo, 'open', 1),
      this.listReleases(owner, repo, 1),
      this.listWorkflowRuns(owner, repo, 1),
    ]);

    return {
      repository: repository.status === 'fulfilled' ? repository.value : null,
      branches: branches.status === 'fulfilled' ? branches.value : [],
      recentCommits: recentCommits.status === 'fulfilled' ? recentCommits.value.slice(0, 10) : [],
      openPullRequests: openPullRequests.status === 'fulfilled' ? openPullRequests.value : [],
      latestRelease: releases.status === 'fulfilled' && releases.value.length > 0 ? releases.value[0] : undefined,
      workflowRuns: workflowRuns.status === 'fulfilled' ? workflowRuns.value.slice(0, 5) : [],
    };
  }

  // Check if Gitea integration is available
  async checkAvailability(): Promise<boolean> {
    try {
      await this.listRepositories(1, 1);
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      if (errorMessage.includes('not configured')) {
        return false;
      }
      // Other errors might be auth issues, but integration is available
      return true;
    }
  }
}

// Export singleton instance
export const giteaApi = new GiteaApiClient();
export default giteaApi;
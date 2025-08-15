import { useState, useEffect } from 'react';
import { 
  GitOpsRepositoryStatus, 
  GitOpsApplicationHealth, 
  GitOpsApplicationSyncStatus,
  GitOpsDeploymentStatus,
  Status,
  API_ENDPOINTS,
  UI_MESSAGES,
  STATUS_COLORS
} from '@/constants';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RefreshCw, GitBranch, Zap, History, Settings } from 'lucide-react';

interface GitOpsRepository {
  id: string;
  name: string;
  url: string;
  branch: string;
  path: string;
  status: GitOpsRepositoryStatus;
  description?: string;
  last_sync?: string;
  created_at: string;
  updated_at: string;
}

interface GitOpsApplication {
  id: string;
  name: string;
  namespace: string;
  repository_id?: string;
  path?: string;
  image: string;
  replicas: number;
  resources?: Record<string, string>;
  environment?: Record<string, string>;
  status: string;
  health: GitOpsApplicationHealth;
  sync_status: GitOpsApplicationSyncStatus;
  last_deployed?: string;
  created_at: string;
  updated_at: string;
}

interface GitOpsDeployment {
  id: string;
  application_id: string;
  image: string;
  replicas: number;
  environment?: Record<string, string>;
  git_hash?: string;
  status: GitOpsDeploymentStatus;
  message?: string;
  deployed_by: string;
  deployed_at: string;
}

interface SyncStatus {
  last_sync: string;
  pending_changes: boolean;
  application_count: number;
  recent_commits: Array<{
    hash: string;
    author: string;
    message: string;
    timestamp: string;
  }>;
  git_status: string;
}

const GitOpsTab: React.FC = () => {
  const [repositories, setRepositories] = useState<GitOpsRepository[]>([]);
  const [applications, setApplications] = useState<GitOpsApplication[]>([]);
  const [deploymentHistory, setDeploymentHistory] = useState<GitOpsDeployment[]>([]);
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [reposRes, appsRes, syncRes] = await Promise.all([
        fetch(API_ENDPOINTS.GITOPS.REPOSITORIES),
        fetch(API_ENDPOINTS.GITOPS.APPLICATIONS),
        fetch(API_ENDPOINTS.GITOPS.BASE + '/sync/status')
      ]);

      if (reposRes.ok) {
        const reposData = await reposRes.json();
        setRepositories(reposData.data || []);
      }

      if (appsRes.ok) {
        const appsData = await appsRes.json();
        setApplications(appsData.data || []);
      }

      if (syncRes.ok) {
        const syncData = await syncRes.json();
        setSyncStatus(syncData.data);
      }
    } catch (error) {
      console.error('Failed to fetch GitOps data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleForceSync = async () => {
    try {
      setSyncing(true);
      const response = await fetch(API_ENDPOINTS.GITOPS.BASE + '/sync/force', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config: { auto_sync: true } })
      });

      if (response.ok) {
        await fetchData(); // Refresh data after sync
      }
    } catch (error) {
      console.error('Failed to force sync:', error);
    } finally {
      setSyncing(false);
    }
  };

  const handleInitRepository = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.GITOPS.REPOSITORIES + '/init', {
        method: 'POST'
      });

      if (response.ok) {
        await fetchData();
      }
    } catch (error) {
      console.error('Failed to initialize repository:', error);
    }
  };

  const getStatusBadge = (status: string, type: 'repository' | 'application' | 'deployment' = 'repository') => {
    const colorMap = {
      repository: {
        [GitOpsRepositoryStatus.ACTIVE]: 'bg-green-900/20 text-green-400 border-green-400',
        [GitOpsRepositoryStatus.PENDING]: 'bg-yellow-900/20 text-yellow-400 border-yellow-400',
        [GitOpsRepositoryStatus.ERROR]: 'bg-red-900/20 text-red-400 border-red-400',
        [GitOpsRepositoryStatus.SYNCING]: 'bg-blue-900/20 text-blue-400 border-blue-400',
      },
      application: {
        [GitOpsApplicationHealth.HEALTHY]: 'bg-green-900/20 text-green-400 border-green-400',
        [GitOpsApplicationHealth.DEGRADED]: 'bg-yellow-900/20 text-yellow-400 border-yellow-400',
        [GitOpsApplicationHealth.SUSPENDED]: 'bg-gray-900/20 text-gray-400 border-gray-400',
        [GitOpsApplicationHealth.MISSING]: 'bg-red-900/20 text-red-400 border-red-400',
        [GitOpsApplicationHealth.UNKNOWN]: 'bg-gray-900/20 text-gray-400 border-gray-400',
      },
      deployment: {
        [GitOpsDeploymentStatus.DEPLOYED]: 'bg-green-900/20 text-green-400 border-green-400',
        [GitOpsDeploymentStatus.FAILED]: 'bg-red-900/20 text-red-400 border-red-400',
        [GitOpsDeploymentStatus.PENDING]: 'bg-yellow-900/20 text-yellow-400 border-yellow-400',
        [GitOpsDeploymentStatus.ROLLED_BACK]: 'bg-purple-900/20 text-purple-400 border-purple-400',
      }
    };

    const className = colorMap[type]?.[status] || 'bg-gray-900/20 text-gray-400 border-gray-400';
    return (
      <Badge variant="outline" className={`${className} font-mono text-xs`}>
        {status.toUpperCase()}
      </Badge>
    );
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-green-400 font-mono">{UI_MESSAGES.LOADING}...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Sync Status */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-mono text-white">GitOps Management</h2>
          <p className="text-sm text-gray-400 font-mono">
            Infrastructure as Code synchronization and deployment automation
          </p>
        </div>
        <div className="flex items-center space-x-4">
          {syncStatus && (
            <div className="text-xs font-mono text-gray-400">
              Last sync: {new Date(syncStatus.last_sync).toLocaleString()}
            </div>
          )}
          <Button
            onClick={handleForceSync}
            disabled={syncing}
            className="bg-green-600 hover:bg-green-700 text-white font-mono"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Syncing...' : 'Force Sync'}
          </Button>
        </div>
      </div>

      {/* Sync Status Card */}
      {syncStatus && (
        <Card className="bg-black border-white">
          <CardHeader className="pb-3">
            <CardTitle className="text-white font-mono flex items-center">
              <Zap className="w-4 h-4 mr-2" />
              Sync Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-mono text-green-400">{syncStatus.application_count}</div>
                <div className="text-xs text-gray-400 font-mono">Applications</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-mono text-blue-400">{syncStatus.recent_commits.length}</div>
                <div className="text-xs text-gray-400 font-mono">Recent Commits</div>
              </div>
              <div className="text-center">
                <div className={`text-2xl font-mono ${syncStatus.pending_changes ? 'text-yellow-400' : 'text-green-400'}`}>
                  {syncStatus.pending_changes ? 'YES' : 'NO'}
                </div>
                <div className="text-xs text-gray-400 font-mono">Pending Changes</div>
              </div>
              <div className="text-center">
                <div className={`text-sm font-mono ${syncStatus.git_status ? 'text-yellow-400' : 'text-green-400'}`}>
                  {syncStatus.git_status || 'CLEAN'}
                </div>
                <div className="text-xs text-gray-400 font-mono">Git Status</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs for different GitOps sections */}
      <Tabs defaultValue="applications" className="w-full">
        <TabsList className="bg-black border-white">
          <TabsTrigger value="applications" className="font-mono">Applications</TabsTrigger>
          <TabsTrigger value="repositories" className="font-mono">Repositories</TabsTrigger>
          <TabsTrigger value="history" className="font-mono">Deployment History</TabsTrigger>
        </TabsList>

        {/* Applications Tab */}
        <TabsContent value="applications" className="space-y-4">
          {applications.length === 0 ? (
            <Card className="bg-black border-white">
              <CardContent className="py-8 text-center">
                <div className="text-gray-400 font-mono">No GitOps applications found</div>
                <Button className="mt-4 bg-green-600 hover:bg-green-700 text-white font-mono">
                  Create Application
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {applications.map((app) => (
                <Card key={app.id} className="bg-black border-white">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-white font-mono">{app.name}</CardTitle>
                      <div className="flex items-center space-x-2">
                        {getStatusBadge(app.health, 'application')}
                        {getStatusBadge(app.sync_status, 'application')}
                      </div>
                    </div>
                    <CardDescription className="font-mono">
                      Namespace: {app.namespace} • Replicas: {app.replicas}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm font-mono">
                      <div>
                        <div className="text-gray-400">Image:</div>
                        <div className="text-white truncate">{app.image}</div>
                      </div>
                      <div>
                        <div className="text-gray-400">Last Deployed:</div>
                        <div className="text-white">
                          {app.last_deployed 
                            ? new Date(app.last_deployed).toLocaleString()
                            : 'Never'
                          }
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Repositories Tab */}
        <TabsContent value="repositories" className="space-y-4">
          {repositories.length === 0 ? (
            <Card className="bg-black border-white">
              <CardContent className="py-8 text-center">
                <div className="text-gray-400 font-mono">No GitOps repositories configured</div>
                <div className="mt-4 space-x-4">
                  <Button 
                    onClick={handleInitRepository}
                    className="bg-green-600 hover:bg-green-700 text-white font-mono"
                  >
                    Initialize Repository
                  </Button>
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white font-mono">
                    Add Repository
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {repositories.map((repo) => (
                <Card key={repo.id} className="bg-black border-white">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-white font-mono flex items-center">
                        <GitBranch className="w-4 h-4 mr-2" />
                        {repo.name}
                      </CardTitle>
                      {getStatusBadge(repo.status, 'repository')}
                    </div>
                    <CardDescription className="font-mono">
                      {repo.description || 'No description'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm font-mono">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <div className="text-gray-400">URL:</div>
                          <div className="text-white truncate">{repo.url}</div>
                        </div>
                        <div>
                          <div className="text-gray-400">Branch:</div>
                          <div className="text-white">{repo.branch}</div>
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-400">Last Sync:</div>
                        <div className="text-white">
                          {repo.last_sync 
                            ? new Date(repo.last_sync).toLocaleString()
                            : 'Never'
                          }
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-4">
          <Card className="bg-black border-white">
            <CardHeader>
              <CardTitle className="text-white font-mono flex items-center">
                <History className="w-4 h-4 mr-2" />
                Deployment History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center text-gray-400 font-mono py-8">
                Deployment history will be displayed here
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default GitOpsTab;
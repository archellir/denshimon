import React, { useState, useEffect } from 'react';
import { GitBranch, CheckCircle, XCircle, Clock, Play, Pause, AlertTriangle, Server, Archive, Download, Package } from 'lucide-react';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { useWorkflowsWebSocket } from '@hooks/useWebSocket';

interface GiteaWorkflow {
  id: string;
  name: string;
  repository: string;
  owner: string;
  branch: string;
  status: 'queued' | 'in_progress' | 'completed';
  conclusion: 'success' | 'failure' | 'cancelled' | 'skipped' | 'neutral';
  workflow_file: string;
  duration: number; // minutes
  startTime: string;
  endTime?: string;
  commit: {
    hash: string;
    message: string;
    author: string;
    url: string;
  };
  jobs: GiteaJob[];
  artifacts: GiteaArtifact[];
  runner?: string;
  trigger_event: 'push' | 'pull_request' | 'schedule' | 'manual' | 'workflow_dispatch';
  run_number: number;
}

interface GiteaJob {
  id: string;
  name: string;
  status: 'queued' | 'in_progress' | 'completed';
  conclusion: 'success' | 'failure' | 'cancelled' | 'skipped' | 'neutral';
  duration: number;
  runner_name: string;
  runner_labels: string[];
  steps: GiteaStep[];
  logs_url?: string;
  started_at?: string;
  completed_at?: string;
}

interface GiteaStep {
  name: string;
  status: 'queued' | 'in_progress' | 'completed';
  conclusion: 'success' | 'failure' | 'cancelled' | 'skipped' | 'neutral';
  duration: number;
  output?: string;
  number: number;
}

interface GiteaArtifact {
  id: string;
  name: string;
  size: number;
  download_count: number;
  created_at: string;
  expired: boolean;
  workflow_run_id: string;
}

interface GiteaRunner {
  id: string;
  name: string;
  labels: string[];
  status: 'online' | 'offline';
  version: string;
  os: string;
  architecture: string;
  busy: boolean;
  current_job?: string;
  last_online: string;
}

interface GiteaRepository {
  name: string;
  owner: string;
  workflows_enabled: boolean;
  workflow_count: number;
  recent_runs: number;
  success_rate: number;
}

const GiteaActions: React.FC = () => {
  const [selectedWorkflow, setSelectedWorkflow] = useState<string | null>(null);
  const [selectedJob, setSelectedJob] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'workflows' | 'runners' | 'artifacts' | 'repositories'>('workflows');
  const [filterStatus, setFilterStatus] = useState<'all' | 'running' | 'failed' | 'queued'>('all');
  const [workflows, setWorkflows] = useState<GiteaWorkflow[]>([]);
  const [runners, setRunners] = useState<GiteaRunner[]>([]);
  const [artifacts, setArtifacts] = useState<GiteaArtifact[]>([]);
  const [repositories, setRepositories] = useState<GiteaRepository[]>([]);
  const [workflowHistory, setWorkflowHistory] = useState<any[]>([]);

  // WebSocket for real-time workflow updates
  const { data: workflowUpdate, isConnected } = useWorkflowsWebSocket();

  // Handle real-time workflow updates
  useEffect(() => {
    if (workflowUpdate && isConnected) {
      setWorkflows(prev => {
        const existingIndex = prev.findIndex(w => w.id === workflowUpdate.id);
        if (existingIndex >= 0) {
          // Update existing workflow
          const updated = [...prev];
          updated[existingIndex] = { ...updated[existingIndex], ...workflowUpdate };
          return updated;
        } else {
          // Add new workflow
          return [workflowUpdate, ...prev.slice(0, 49)]; // Keep max 50 workflows
        }
      });
    }
  }, [workflowUpdate, isConnected]);

  // Generate mock Gitea Actions data
  useEffect(() => {
    // Mock workflows
    const mockWorkflows: GiteaWorkflow[] = [
      {
        id: 'workflow-1',
        name: 'CI/CD Pipeline',
        repository: 'web-frontend',
        owner: 'company',
        branch: 'main',
        status: 'in_progress',
        conclusion: 'neutral',
        workflow_file: '.gitea/workflows/ci.yml',
        duration: 8,
        startTime: new Date(Date.now() - 480000).toISOString(),
        commit: {
          hash: 'a1b2c3d',
          message: 'feat: add user authentication',
          author: 'john.doe',
          url: 'https://gitea.company.com/company/web-frontend/commit/a1b2c3d'
        },
        jobs: [
          {
            id: 'job-1',
            name: 'test',
            status: 'completed',
            conclusion: 'success',
            duration: 3,
            runner_name: 'gitea-runner-1',
            runner_labels: ['ubuntu-latest', 'self-hosted'],
            started_at: new Date(Date.now() - 480000).toISOString(),
            completed_at: new Date(Date.now() - 300000).toISOString(),
            steps: [
              { name: 'Checkout code', status: 'completed', conclusion: 'success', duration: 0.5, number: 1 },
              { name: 'Setup Node.js', status: 'completed', conclusion: 'success', duration: 1, number: 2 },
              { name: 'Install dependencies', status: 'completed', conclusion: 'success', duration: 1.2, number: 3 },
              { name: 'Run tests', status: 'completed', conclusion: 'success', duration: 0.3, number: 4 }
            ]
          },
          {
            id: 'job-2',
            name: 'build',
            status: 'in_progress',
            conclusion: 'neutral',
            duration: 5,
            runner_name: 'gitea-runner-2',
            runner_labels: ['ubuntu-latest', 'docker'],
            started_at: new Date(Date.now() - 300000).toISOString(),
            steps: [
              { name: 'Checkout code', status: 'completed', conclusion: 'success', duration: 0.5, number: 1 },
              { name: 'Build Docker image', status: 'in_progress', conclusion: 'neutral', duration: 4, number: 2 },
              { name: 'Push to registry', status: 'queued', conclusion: 'neutral', duration: 0, number: 3 }
            ]
          }
        ],
        artifacts: [
          {
            id: 'artifact-1',
            name: 'test-results',
            size: 1024,
            download_count: 3,
            created_at: new Date(Date.now() - 300000).toISOString(),
            expired: false,
            workflow_run_id: 'workflow-1'
          }
        ],
        runner: 'gitea-runner-1',
        trigger_event: 'push',
        run_number: 42
      },
      {
        id: 'workflow-2',
        name: 'Security Scan',
        repository: 'api-backend',
        owner: 'company',
        branch: 'develop',
        status: 'completed',
        conclusion: 'failure',
        workflow_file: '.gitea/workflows/security.yml',
        duration: 6,
        startTime: new Date(Date.now() - 900000).toISOString(),
        endTime: new Date(Date.now() - 540000).toISOString(),
        commit: {
          hash: 'e4f5g6h',
          message: 'fix: update dependencies',
          author: 'jane.smith',
          url: 'https://gitea.company.com/company/api-backend/commit/e4f5g6h'
        },
        jobs: [
          {
            id: 'job-3',
            name: 'security-scan',
            status: 'completed',
            conclusion: 'failure',
            duration: 6,
            runner_name: 'gitea-runner-3',
            runner_labels: ['ubuntu-latest', 'security'],
            started_at: new Date(Date.now() - 900000).toISOString(),
            completed_at: new Date(Date.now() - 540000).toISOString(),
            logs_url: 'https://gitea.company.com/company/api-backend/actions/runs/workflow-2/jobs/job-3/logs',
            steps: [
              { name: 'Checkout code', status: 'completed', conclusion: 'success', duration: 0.5, number: 1 },
              { name: 'Run Trivy scan', status: 'completed', conclusion: 'failure', duration: 4, number: 2, output: 'Found 3 high severity vulnerabilities' },
              { name: 'Upload results', status: 'completed', conclusion: 'success', duration: 1.5, number: 3 }
            ]
          }
        ],
        artifacts: [
          {
            id: 'artifact-2',
            name: 'security-report',
            size: 2048,
            download_count: 1,
            created_at: new Date(Date.now() - 540000).toISOString(),
            expired: false,
            workflow_run_id: 'workflow-2'
          }
        ],
        runner: 'gitea-runner-3',
        trigger_event: 'pull_request',
        run_number: 15
      },
      {
        id: 'workflow-3',
        name: 'Deploy to Production',
        repository: 'web-frontend',
        owner: 'company',
        branch: 'main',
        status: 'queued',
        conclusion: 'neutral',
        workflow_file: '.gitea/workflows/deploy.yml',
        duration: 0,
        startTime: new Date().toISOString(),
        commit: {
          hash: 'i7j8k9l',
          message: 'release: version 2.1.0',
          author: 'mike.wilson',
          url: 'https://gitea.company.com/company/web-frontend/commit/i7j8k9l'
        },
        jobs: [
          {
            id: 'job-4',
            name: 'deploy',
            status: 'queued',
            conclusion: 'neutral',
            duration: 0,
            runner_name: 'gitea-runner-prod',
            runner_labels: ['self-hosted', 'production'],
            steps: [
              { name: 'Checkout code', status: 'queued', conclusion: 'neutral', duration: 0, number: 1 },
              { name: 'Deploy to Kubernetes', status: 'queued', conclusion: 'neutral', duration: 0, number: 2 }
            ]
          }
        ],
        artifacts: [],
        trigger_event: 'manual',
        run_number: 8
      }
    ];

    // Mock runners
    const mockRunners: GiteaRunner[] = [
      {
        id: 'runner-1',
        name: 'gitea-runner-1',
        labels: ['ubuntu-latest', 'self-hosted'],
        status: 'online',
        version: '3.4.1',
        os: 'linux',
        architecture: 'amd64',
        busy: true,
        current_job: 'job-2',
        last_online: new Date(Date.now() - 60000).toISOString()
      },
      {
        id: 'runner-2',
        name: 'gitea-runner-2',
        labels: ['ubuntu-latest', 'docker'],
        status: 'online',
        version: '3.4.1',
        os: 'linux',
        architecture: 'amd64',
        busy: false,
        last_online: new Date(Date.now() - 30000).toISOString()
      },
      {
        id: 'runner-3',
        name: 'gitea-runner-3',
        labels: ['ubuntu-latest', 'security'],
        status: 'offline',
        version: '3.4.0',
        os: 'linux',
        architecture: 'amd64',
        busy: false,
        last_online: new Date(Date.now() - 3600000).toISOString()
      },
      {
        id: 'runner-prod',
        name: 'gitea-runner-prod',
        labels: ['self-hosted', 'production'],
        status: 'online',
        version: '3.4.1',
        os: 'linux',
        architecture: 'amd64',
        busy: false,
        last_online: new Date(Date.now() - 120000).toISOString()
      }
    ];

    // Mock repositories
    const mockRepositories: GiteaRepository[] = [
      {
        name: 'web-frontend',
        owner: 'company',
        workflows_enabled: true,
        workflow_count: 3,
        recent_runs: 25,
        success_rate: 85.2
      },
      {
        name: 'api-backend',
        owner: 'company',
        workflows_enabled: true,
        workflow_count: 4,
        recent_runs: 32,
        success_rate: 78.5
      },
      {
        name: 'mobile-app',
        owner: 'company',
        workflows_enabled: true,
        workflow_count: 2,
        recent_runs: 18,
        success_rate: 92.1
      }
    ];

    // Generate workflow history
    const history = [];
    for (let i = 0; i < 24; i++) {
      history.push({
        hour: i,
        successful: Math.floor(Math.random() * 8) + 3,
        failed: Math.floor(Math.random() * 3),
        queued: Math.floor(Math.random() * 5),
        cancelled: Math.floor(Math.random() * 2),
        avgDuration: 5 + Math.random() * 8
      });
    }

    // Collect all artifacts
    const allArtifacts = mockWorkflows.flatMap(w => w.artifacts);

    setWorkflows(mockWorkflows);
    setRunners(mockRunners);
    setArtifacts(allArtifacts);
    setRepositories(mockRepositories);
    setWorkflowHistory(history);
  }, []);

  const getStatusColor = (status: string, conclusion?: string) => {
    if (status === 'completed') {
      switch (conclusion) {
        case 'success': return 'text-green-500 border-green-500';
        case 'failure': return 'text-red-500 border-red-500';
        case 'cancelled': return 'text-gray-500 border-gray-500';
        case 'skipped': return 'text-yellow-500 border-yellow-500';
        default: return 'text-blue-500 border-blue-500';
      }
    }
    
    switch (status) {
      case 'in_progress': return 'text-blue-500 border-blue-500';
      case 'queued': return 'text-yellow-500 border-yellow-500';
      default: return 'text-gray-500 border-gray-500';
    }
  };

  const getStatusIcon = (status: string, conclusion?: string) => {
    if (status === 'completed') {
      switch (conclusion) {
        case 'success': return <CheckCircle size={16} className="text-green-500" />;
        case 'failure': return <XCircle size={16} className="text-red-500" />;
        case 'cancelled': return <Pause size={16} className="text-gray-500" />;
        case 'skipped': return <AlertTriangle size={16} className="text-yellow-500" />;
        default: return <CheckCircle size={16} className="text-blue-500" />;
      }
    }
    
    switch (status) {
      case 'in_progress': return <Play size={16} className="text-blue-500" />;
      case 'queued': return <Clock size={16} className="text-yellow-500" />;
      default: return <AlertTriangle size={16} className="text-gray-500" />;
    }
  };

  const filteredWorkflows = workflows.filter(w => {
    if (filterStatus === 'all') return true;
    if (filterStatus === 'running') return w.status === 'in_progress';
    if (filterStatus === 'failed') return w.conclusion === 'failure';
    if (filterStatus === 'queued') return w.status === 'queued';
    return false;
  });

  const selectedWorkflowData = selectedWorkflow ? workflows.find(w => w.id === selectedWorkflow) : null;
  const selectedJobData = selectedJob && selectedWorkflowData ? 
    selectedWorkflowData.jobs.find(j => j.id === selectedJob) : null;

  // Calculate metrics
  const totalRuns = workflows.length;
  const successfulRuns = workflows.filter(w => w.conclusion === 'success').length;
  const failedRuns = workflows.filter(w => w.conclusion === 'failure').length;
  const queuedRuns = workflows.filter(w => w.status === 'queued').length;
  const activeRunners = runners.filter(r => r.status === 'online').length;
  const busyRunners = runners.filter(r => r.busy).length;

  return (
    <div className="space-y-6">
      {/* View Mode Tabs */}
      <div className="flex space-x-1">
        {[
          { id: 'workflows', label: 'Workflows', icon: GitBranch },
          { id: 'runners', label: 'Runners', icon: Server },
          { id: 'artifacts', label: 'Artifacts', icon: Archive },
          { id: 'repositories', label: 'Repositories', icon: Package }
        ].map(mode => (
          <button
            key={mode.id}
            onClick={() => setViewMode(mode.id as any)}
            className={`flex items-center space-x-2 px-4 py-2 font-mono text-sm transition-colors border ${ 
              viewMode === mode.id 
                ? 'bg-white text-black border-white' 
                : 'border-white/30 hover:border-white'
            }`}
          >
            <mode.icon size={16} />
            <span>{mode.label}</span>
          </button>
        ))}
      </div>

      {/* Gitea Actions Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <div className="border border-white p-4">
          <div className="flex items-center justify-between mb-2">
            <GitBranch size={20} />
            <span className="text-xs font-mono text-gray-500">WORKFLOWS</span>
          </div>
          <div className="text-2xl font-mono font-bold">{totalRuns}</div>
          <div className="text-xs text-gray-500">total runs</div>
        </div>

        <div className="border border-green-500 p-4">
          <div className="flex items-center justify-between mb-2">
            <CheckCircle size={20} className="text-green-500" />
            <span className="text-xs font-mono text-gray-500">SUCCESS</span>
          </div>
          <div className="text-2xl font-mono font-bold text-green-500">{successfulRuns}</div>
          <div className="text-xs text-gray-500">completed</div>
        </div>

        <div className="border border-red-500 p-4">
          <div className="flex items-center justify-between mb-2">
            <XCircle size={20} className="text-red-500" />
            <span className="text-xs font-mono text-gray-500">FAILED</span>
          </div>
          <div className="text-2xl font-mono font-bold text-red-500">{failedRuns}</div>
          <div className="text-xs text-gray-500">workflows</div>
        </div>

        <div className="border border-yellow-500 p-4">
          <div className="flex items-center justify-between mb-2">
            <Clock size={20} className="text-yellow-500" />
            <span className="text-xs font-mono text-gray-500">QUEUED</span>
          </div>
          <div className="text-2xl font-mono font-bold text-yellow-500">{queuedRuns}</div>
          <div className="text-xs text-gray-500">waiting</div>
        </div>

        <div className="border border-white p-4">
          <div className="flex items-center justify-between mb-2">
            <Server size={20} />
            <span className="text-xs font-mono text-gray-500">RUNNERS</span>
          </div>
          <div className="text-2xl font-mono font-bold">{activeRunners}</div>
          <div className="text-xs text-gray-500">online ({busyRunners} busy)</div>
        </div>

        <div className="border border-white p-4">
          <div className="flex items-center justify-between mb-2">
            <Archive size={20} />
            <span className="text-xs font-mono text-gray-500">ARTIFACTS</span>
          </div>
          <div className="text-2xl font-mono font-bold">{artifacts.length}</div>
          <div className="text-xs text-gray-500">available</div>
        </div>
      </div>

      {/* Workflows View */}
      {viewMode === 'workflows' && (
        <>
          {/* Activity Chart */}
          <div className="border border-white p-4">
            <h3 className="font-mono text-sm mb-4">WORKFLOW ACTIVITY (24H)</h3>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={workflowHistory}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="hour" stroke="#666" />
                <YAxis stroke="#666" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#000', border: '1px solid #fff' }}
                  labelStyle={{ color: '#fff' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="successful" 
                  stackId="1"
                  stroke="#22c55e" 
                  fill="#22c55e" 
                  fillOpacity={0.8}
                  name="Successful"
                />
                <Area 
                  type="monotone" 
                  dataKey="failed" 
                  stackId="1"
                  stroke="#ef4444" 
                  fill="#ef4444" 
                  fillOpacity={0.8}
                  name="Failed"
                />
                <Area 
                  type="monotone" 
                  dataKey="queued" 
                  stackId="1"
                  stroke="#eab308" 
                  fill="#eab308" 
                  fillOpacity={0.8}
                  name="Queued"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Filter Controls */}
          <div className="flex justify-between items-center">
            <div className="flex space-x-2">
              {['all', 'running', 'failed', 'queued'].map(status => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status as any)}
                  className={`px-3 py-1 text-xs font-mono border transition-colors ${
                    filterStatus === status ? 'bg-white text-black border-white' : 'border-white/30 hover:border-white'
                  }`}
                >
                  {status.toUpperCase()}
                </button>
              ))}
            </div>
            <div className="text-xs font-mono text-gray-500">
              {filteredWorkflows.length} workflow{filteredWorkflows.length !== 1 ? 's' : ''}
            </div>
          </div>

          {/* Workflows Table */}
          <div className="border border-white">
            <div className="border-b border-white px-4 py-2">
              <h3 className="font-mono text-sm font-bold">GITEA WORKFLOWS</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full font-mono text-sm">
                <thead>
                  <tr className="border-b border-white/20">
                    <th className="text-left p-3">WORKFLOW</th>
                    <th className="text-left p-3">REPOSITORY</th>
                    <th className="text-left p-3">BRANCH</th>
                    <th className="text-center p-3">STATUS</th>
                    <th className="text-left p-3">TRIGGER</th>
                    <th className="text-right p-3">RUN #</th>
                    <th className="text-right p-3">DURATION</th>
                    <th className="text-left p-3">COMMIT</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredWorkflows.map(workflow => (
                    <tr 
                      key={workflow.id}
                      onClick={() => setSelectedWorkflow(workflow.id === selectedWorkflow ? null : workflow.id)}
                      className={`border-b border-white/10 hover:bg-white/5 cursor-pointer ${
                        selectedWorkflow === workflow.id ? 'bg-white/10' : ''
                      }`}
                    >
                      <td className="p-3">
                        <div>
                          <div className="font-bold">{workflow.name}</div>
                          <div className="text-xs text-gray-500">{workflow.workflow_file}</div>
                        </div>
                      </td>
                      <td className="p-3">
                        <div>
                          <div className="font-bold">{workflow.owner}/{workflow.repository}</div>
                        </div>
                      </td>
                      <td className="p-3">{workflow.branch}</td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center space-x-2">
                          {getStatusIcon(workflow.status, workflow.conclusion)}
                          <span className={getStatusColor(workflow.status, workflow.conclusion).split(' ')[0]}>
                            {workflow.status === 'completed' ? workflow.conclusion?.toUpperCase() : workflow.status.toUpperCase()}
                          </span>
                        </div>
                      </td>
                      <td className="p-3">{workflow.trigger_event}</td>
                      <td className="p-3 text-right">#{workflow.run_number}</td>
                      <td className="p-3 text-right">
                        {workflow.status === 'in_progress' 
                          ? `${Math.floor((Date.now() - new Date(workflow.startTime).getTime()) / 60000)}m`
                          : `${workflow.duration}m`
                        }
                      </td>
                      <td className="p-3">
                        <div>
                          <div className="text-xs text-blue-400">{workflow.commit.hash}</div>
                          <div className="text-xs text-gray-500 truncate max-w-[200px]">{workflow.commit.message}</div>
                          <div className="text-xs text-gray-400">{workflow.commit.author}</div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Selected Workflow Details */}
          {selectedWorkflowData && (
            <div className="border border-white p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-mono text-sm font-bold">
                  WORKFLOW JOBS: {selectedWorkflowData.name}
                </h3>
                <button
                  onClick={() => setSelectedWorkflow(null)}
                  className="text-xs font-mono hover:text-gray-400"
                >
                  CLOSE
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                {selectedWorkflowData.jobs.map((job) => (
                  <div 
                    key={job.id}
                    onClick={() => setSelectedJob(job.id === selectedJob ? null : job.id)}
                    className={`border p-3 cursor-pointer hover:bg-white/5 ${getStatusColor(job.status, job.conclusion)}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono text-sm font-bold">{job.name}</span>
                      {getStatusIcon(job.status, job.conclusion)}
                    </div>
                    <div className="text-xs space-y-1">
                      <div>Runner: {job.runner_name}</div>
                      <div>Duration: {job.duration}m</div>
                      <div>Steps: {job.steps.length}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Selected Job Steps */}
              {selectedJobData && (
                <div className="border border-white/30 p-3">
                  <h4 className="font-mono text-xs font-bold mb-2">JOB STEPS: {selectedJobData.name}</h4>
                  <div className="space-y-2">
                    {selectedJobData.steps.map((step, index) => (
                      <div key={index} className="flex items-center justify-between text-xs">
                        <div className="flex items-center space-x-2">
                          <span className="text-gray-500">{step.number}.</span>
                          <span>{step.name}</span>
                          {getStatusIcon(step.status, step.conclusion)}
                        </div>
                        <div className="flex items-center space-x-4">
                          <span>{step.duration}m</span>
                          {step.output && (
                            <span className="text-red-400 max-w-[300px] truncate">{step.output}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Runners View */}
      {viewMode === 'runners' && (
        <div className="border border-white">
          <div className="border-b border-white px-4 py-2">
            <h3 className="font-mono text-sm font-bold">GITEA RUNNERS</h3>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {runners.map(runner => (
                <div key={runner.id} className={`border p-4 ${runner.status === 'online' ? 'border-green-500' : 'border-red-500'}`}>
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="font-mono text-sm font-bold">{runner.name}</div>
                      <div className="text-xs text-gray-500">{runner.os}/{runner.architecture}</div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 text-xs ${runner.status === 'online' ? 'bg-green-500' : 'bg-red-500'} text-white`}>
                        {runner.status.toUpperCase()}
                      </span>
                      {runner.busy && <span className="px-2 py-1 text-xs bg-blue-500 text-white">BUSY</span>}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <div className="text-gray-500">Version</div>
                      <div className="font-bold">{runner.version}</div>
                    </div>
                    <div>
                      <div className="text-gray-500">Labels</div>
                      <div className="font-bold">{runner.labels.join(', ')}</div>
                    </div>
                    <div>
                      <div className="text-gray-500">Current Job</div>
                      <div className="font-bold">{runner.current_job || 'None'}</div>
                    </div>
                    <div>
                      <div className="text-gray-500">Last Online</div>
                      <div className="font-bold">
                        {Math.floor((Date.now() - new Date(runner.last_online).getTime()) / 60000)}m ago
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Artifacts View */}
      {viewMode === 'artifacts' && (
        <div className="border border-white">
          <div className="border-b border-white px-4 py-2">
            <h3 className="font-mono text-sm font-bold">WORKFLOW ARTIFACTS</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full font-mono text-sm">
              <thead>
                <tr className="border-b border-white/20">
                  <th className="text-left p-3">NAME</th>
                  <th className="text-left p-3">WORKFLOW</th>
                  <th className="text-right p-3">SIZE</th>
                  <th className="text-right p-3">DOWNLOADS</th>
                  <th className="text-left p-3">CREATED</th>
                  <th className="text-center p-3">STATUS</th>
                  <th className="text-center p-3">ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {artifacts.map(artifact => {
                  const workflow = workflows.find(w => w.id === artifact.workflow_run_id);
                  return (
                    <tr key={artifact.id} className="border-b border-white/10 hover:bg-white/5">
                      <td className="p-3 font-bold">{artifact.name}</td>
                      <td className="p-3">{workflow?.name || 'Unknown'}</td>
                      <td className="p-3 text-right">{(artifact.size / 1024).toFixed(1)} KB</td>
                      <td className="p-3 text-right">{artifact.download_count}</td>
                      <td className="p-3">
                        {Math.floor((Date.now() - new Date(artifact.created_at).getTime()) / 60000)}m ago
                      </td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-1 text-xs ${artifact.expired ? 'bg-red-500' : 'bg-green-500'} text-white`}>
                          {artifact.expired ? 'EXPIRED' : 'ACTIVE'}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        {!artifact.expired && (
                          <button className="text-blue-500 hover:text-blue-400">
                            <Download size={14} />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Repositories View */}
      {viewMode === 'repositories' && (
        <div className="border border-white">
          <div className="border-b border-white px-4 py-2">
            <h3 className="font-mono text-sm font-bold">REPOSITORIES WITH ACTIONS</h3>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {repositories.map(repo => (
                <div key={`${repo.owner}/${repo.name}`} className="border border-white/30 p-4">
                  <div className="font-mono text-sm font-bold mb-2">{repo.owner}/{repo.name}</div>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Workflows:</span>
                      <span className="font-bold">{repo.workflow_count}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Recent Runs:</span>
                      <span className="font-bold">{repo.recent_runs}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Success Rate:</span>
                      <span className={`font-bold ${repo.success_rate > 90 ? 'text-green-500' : repo.success_rate > 75 ? 'text-yellow-500' : 'text-red-500'}`}>
                        {repo.success_rate.toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Actions:</span>
                      <span className={`font-bold ${repo.workflows_enabled ? 'text-green-500' : 'text-red-500'}`}>
                        {repo.workflows_enabled ? 'ENABLED' : 'DISABLED'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GiteaActions;
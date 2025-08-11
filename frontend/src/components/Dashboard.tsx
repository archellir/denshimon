import { useEffect, useState } from 'react';
import type { FC } from 'react';
import { Activity, Server, Database, HardDrive, Cpu, MemoryStick, Network, Clock, Zap, Package, Eye, FileText, GitBranch, TreePine } from 'lucide-react';
import StatusIcon, { getStatusColor, normalizeStatus, type StatusType } from '@components/common/StatusIcon';
import useMetricsStore from '@stores/metricsStore';
import ClusterOverview from '@components/metrics/ClusterOverview';
import HealthDashboard from '@components/metrics/HealthDashboard';
import ResourceCharts from '@components/metrics/ResourceCharts';
import NodeList from '@components/metrics/NodeList';
import NamespaceMetrics from '@components/metrics/NamespaceMetrics';
import NetworkTraffic from '@components/network/NetworkTraffic';
import PodsOverview from '@components/pods/PodsOverview';
import EventTimeline from '@components/events/EventTimeline';
import ServiceMesh from '@components/services/ServiceMesh';
import Logs from '@components/Logs';
import GitOps from '@components/GitOps';
import PodsView from '@components/PodsView';
import ResourceTree from '@components/infrastructure/ResourceTree';

interface DashboardProps {
  activePrimaryTab?: string;
  onSecondaryTabChange?: (tabId: string) => void;
}

const Dashboard: FC<DashboardProps> = ({ activePrimaryTab = 'infrastructure', onSecondaryTabChange }) => {
  const [secondaryTabMemory, setSecondaryTabMemory] = useState<Record<string, string>>({
    infrastructure: 'overview',
    workloads: 'overview',
    mesh: 'topology',
    deployments: 'applications',
    observability: 'logs',
  });

  // Get current secondary tab for the active primary tab
  const activeSecondaryTab = secondaryTabMemory[activePrimaryTab] || 
    (secondaryTabs[activePrimaryTab] ? secondaryTabs[activePrimaryTab][0].id : '');

  // Update secondary tab and remember it
  const setActiveSecondaryTab = (tabId: string) => {
    setSecondaryTabMemory(prev => ({
      ...prev,
      [activePrimaryTab]: tabId
    }));
    onSecondaryTabChange?.(tabId);
  };

  // Notify parent of current secondary tab on primary tab change
  useEffect(() => {
    const currentSecondary = secondaryTabMemory[activePrimaryTab] || 
      (secondaryTabs[activePrimaryTab] ? secondaryTabs[activePrimaryTab][0].id : '');
    onSecondaryTabChange?.(currentSecondary);
  }, [activePrimaryTab, secondaryTabMemory, onSecondaryTabChange]);
  const {
    clusterMetrics,
    isLoading,
    error,
    autoRefresh,
    refreshInterval,
    fetchAllMetrics,
    fetchMetricsHistory,
    clearMetrics,
  } = useMetricsStore();

  // Auto-refresh effect
  useEffect(() => {
    let intervalId: number;

    const refresh = () => {
      fetchAllMetrics();
      fetchMetricsHistory('1h');
    };

    // Initial load
    refresh();

    // Set up auto-refresh
    if (autoRefresh) {
      intervalId = setInterval(refresh, refreshInterval) as unknown as number;
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
      clearMetrics();
    };
  }, [autoRefresh, refreshInterval, fetchAllMetrics, fetchMetricsHistory, clearMetrics]);

  const primaryTabs = [
    { id: 'infrastructure', label: 'Infrastructure', icon: Server },
    { id: 'workloads', label: 'Workloads', icon: Package },
    { id: 'mesh', label: 'Service Mesh', icon: Zap },
    { id: 'deployments', label: 'Deployments', icon: GitBranch },
    { id: 'observability', label: 'Observability', icon: Eye },
  ];

  const getQuickStats = () => {
    if (!clusterMetrics) return [];

    return [
      {
        label: 'Nodes',
        value: `${clusterMetrics.ready_nodes}/${clusterMetrics.total_nodes}`,
        icon: Server,
        status: clusterMetrics.ready_nodes === clusterMetrics.total_nodes ? 'healthy' as StatusType : 'warning' as StatusType,
      },
      {
        label: 'Pods',
        value: `${clusterMetrics.running_pods}/${clusterMetrics.total_pods}`,
        icon: Database,
        status: clusterMetrics.running_pods > 0 ? 'healthy' as StatusType : 'error' as StatusType,
      },
      {
        label: 'CPU',
        value: `${clusterMetrics.cpu_usage.usage_percent.toFixed(1)}%`,
        icon: Cpu,
        status: clusterMetrics.cpu_usage.usage_percent < 80 ? 'healthy' as StatusType : 
                clusterMetrics.cpu_usage.usage_percent < 95 ? 'warning' as StatusType : 'critical' as StatusType,
      },
      {
        label: 'Memory',
        value: `${clusterMetrics.memory_usage.usage_percent.toFixed(1)}%`,
        icon: MemoryStick,
        status: clusterMetrics.memory_usage.usage_percent < 80 ? 'healthy' as StatusType : 
                clusterMetrics.memory_usage.usage_percent < 95 ? 'warning' as StatusType : 'critical' as StatusType,
      },
    ];
  };

  const secondaryTabs: Record<string, Array<{ id: string; label: string; icon: any }>> = {
    infrastructure: [
      { id: 'overview', label: 'Overview', icon: Activity },
      { id: 'nodes', label: 'Nodes', icon: Server },
      { id: 'resources', label: 'Resources', icon: Cpu },
      { id: 'hierarchy', label: 'Hierarchy', icon: TreePine },
      { id: 'network', label: 'Network', icon: Network },
    ],
    workloads: [
      { id: 'overview', label: 'Overview', icon: Activity },
      { id: 'pods', label: 'Pods', icon: Database },
      { id: 'services', label: 'Services', icon: Network },
      { id: 'namespaces', label: 'Namespaces', icon: HardDrive },
    ],
    mesh: [
      { id: 'topology', label: 'Topology', icon: Network },
      { id: 'services', label: 'Services', icon: Server },
      { id: 'endpoints', label: 'Endpoints', icon: Activity },
      { id: 'flows', label: 'Flows', icon: Zap },
    ],
    deployments: [
      { id: 'applications', label: 'Applications', icon: Package },
      { id: 'repositories', label: 'Repositories', icon: GitBranch },
      { id: 'sync', label: 'Sync Status', icon: Activity },
    ],
    observability: [
      { id: 'logs', label: 'Logs', icon: FileText },
      { id: 'events', label: 'Events', icon: Clock },
    ],
  };


  if (error) {
    return (
      <div className="min-h-screen bg-black text-white p-6">
        <div className="max-w-7xl mx-auto">
          <div className="border border-red-400 bg-red-900/20 p-6 rounded-sm">
            <h2 className="text-xl font-mono mb-2">ERROR</h2>
            <p className="font-mono text-red-400">{error}</p>
            <button
              onClick={() => {
                clearMetrics();
                fetchAllMetrics();
              }}
              className="mt-4 px-4 py-2 border border-red-400 text-red-400 hover:bg-red-400 hover:text-black transition-colors font-mono"
            >
              RETRY
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Quick Stats - only on Infrastructure tab */}
      {activePrimaryTab === 'infrastructure' && clusterMetrics && (
        <div className="border-b border-white">
          <div className="max-w-7xl mx-auto p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {getQuickStats().map((stat) => (
                <div key={stat.label} className={`border ${getStatusColor(stat.status)} p-4`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-mono opacity-60">{stat.label}</p>
                      <p className="text-lg font-mono">{stat.value}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <stat.icon size={20} className="text-white" />
                      <StatusIcon status={stat.status} size={16} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Secondary Navigation - with visual separation */}
      {secondaryTabs[activePrimaryTab] && (
        <div className="bg-black border-b border-white/20">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex space-x-1 py-2">
              {secondaryTabs[activePrimaryTab].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveSecondaryTab(tab.id)}
                  className={`flex items-center space-x-2 px-3 py-2 font-mono text-sm transition-colors rounded-sm ${
                    activeSecondaryTab === tab.id
                      ? 'bg-white text-black'
                      : 'text-white hover:bg-white/10'
                  }`}
                >
                  <tab.icon size={14} />
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="max-w-7xl mx-auto p-6">
        {/* Infrastructure Tab Content */}
        {activePrimaryTab === 'infrastructure' && activeSecondaryTab === 'overview' && (
          <div className="space-y-6">
            <HealthDashboard compact />
            <ClusterOverview />
          </div>
        )}
        {activePrimaryTab === 'infrastructure' && activeSecondaryTab === 'nodes' && <NodeList />}
        {activePrimaryTab === 'infrastructure' && activeSecondaryTab === 'resources' && <ResourceCharts />}
        {activePrimaryTab === 'infrastructure' && activeSecondaryTab === 'hierarchy' && <ResourceTree />}
        {activePrimaryTab === 'infrastructure' && activeSecondaryTab === 'network' && <NetworkTraffic />}
        
        {/* Workloads Tab Content */}
        {activePrimaryTab === 'workloads' && activeSecondaryTab === 'overview' && <ClusterOverview />}
        {activePrimaryTab === 'workloads' && activeSecondaryTab === 'pods' && <PodsView />}
        {activePrimaryTab === 'workloads' && activeSecondaryTab === 'services' && <div className="p-6"><div className="text-center text-gray-500">Services view coming soon</div></div>}
        {activePrimaryTab === 'workloads' && activeSecondaryTab === 'namespaces' && <NamespaceMetrics />}
        
        {/* Service Mesh Tab Content */}
        {activePrimaryTab === 'mesh' && <ServiceMesh />}
        
        {/* Deployments Tab Content */}
        {activePrimaryTab === 'deployments' && <GitOps />}
        
        {/* Observability Tab Content */}
        {activePrimaryTab === 'observability' && activeSecondaryTab === 'logs' && <Logs />}
        {activePrimaryTab === 'observability' && activeSecondaryTab === 'events' && <EventTimeline />}
      </div>
    </div>
  );
};

export default Dashboard;
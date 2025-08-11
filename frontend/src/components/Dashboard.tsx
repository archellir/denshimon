import { useEffect } from 'react';
import { useSearchParams } from 'react-router';
import type { FC } from 'react';
import { Activity, Server, Database, HardDrive, Cpu, MemoryStick, Network, Clock, Zap, Package, Eye, FileText, GitBranch, TreePine, TrendingUp } from 'lucide-react';
import StatusIcon, { getStatusColor, type StatusType } from '@components/common/StatusIcon';
import useWebSocketMetricsStore from '@stores/webSocketMetricsStore';
import ClusterOverview from '@components/metrics/ClusterOverview';
import HealthDashboard from '@components/metrics/HealthDashboard';
import ResourceCharts from '@components/metrics/ResourceCharts';
import NodeList from '@components/metrics/NodeList';
import NamespaceMetrics from '@components/metrics/NamespaceMetrics';
import NetworkTraffic from '@components/network/NetworkTraffic';
import EventTimeline from '@components/events/EventTimeline';
import ServiceMesh from '@components/services/ServiceMesh';
import EnhancedLogs from '@components/observability/EnhancedLogs';
import LiveStreams from '@components/observability/LiveStreams';
import LogAnalytics from '@components/observability/LogAnalytics';
import GitOps from '@components/GitOps';
import PodsView from '@components/PodsView';
import ResourceTree from '@components/infrastructure/ResourceTree';
import StorageIOMetrics from '@components/storage/StorageIOMetrics';
import APIGatewayAnalytics from '@components/gateway/APIGatewayAnalytics';
import GiteaActions from '@components/cicd/GiteaActions';
import ServicesList from '@components/workloads/ServicesList';

interface DashboardProps {
  activePrimaryTab?: string;
  onSecondaryTabChange?: (tabId: string) => void;
  timeRange?: string;
}

const Dashboard: FC<DashboardProps> = ({ activePrimaryTab = 'infrastructure', onSecondaryTabChange, timeRange = '1h' }) => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Default secondary tabs for each primary tab
  const defaultSecondaryTabs = {
    infrastructure: 'overview',
    workloads: 'overview',
    mesh: 'topology',
    deployments: 'applications',
    observability: 'logs',
  };

  // Secondary tab definitions
  const secondaryTabs: Record<string, Array<{ id: string; label: string; icon: any }>> = {
    infrastructure: [
      { id: 'overview', label: 'Overview', icon: Activity },
      { id: 'nodes', label: 'Nodes', icon: Server },
      { id: 'resources', label: 'Resources', icon: Cpu },
      { id: 'storage', label: 'Storage', icon: HardDrive },
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
      { id: 'flows', label: 'Traffic Flow', icon: Zap },
      { id: 'gateway', label: 'API Gateway', icon: Eye },
    ],
    deployments: [
      { id: 'applications', label: 'Applications', icon: Package },
      { id: 'repositories', label: 'Repositories', icon: GitBranch },
      { id: 'gitea', label: 'Gitea Actions', icon: Zap },
    ],
    observability: [
      { id: 'logs', label: 'Logs', icon: FileText },
      { id: 'events', label: 'Events', icon: Clock },
      { id: 'streams', label: 'Live Streams', icon: Activity },
      { id: 'analytics', label: 'Analytics', icon: TrendingUp },
    ],
  };

  // Get current secondary tab from URL or use default
  const activeSecondaryTab = searchParams.get('tab') || 
    defaultSecondaryTabs[activePrimaryTab as keyof typeof defaultSecondaryTabs] || 
    (secondaryTabs[activePrimaryTab] ? secondaryTabs[activePrimaryTab][0].id : '');

  // Update secondary tab and URL
  const setActiveSecondaryTab = (tabId: string) => {
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.set('tab', tabId);
    setSearchParams(newSearchParams);
    onSecondaryTabChange?.(tabId);
  };

  // Set default tab in URL if none is present
  useEffect(() => {
    if (!searchParams.get('tab')) {
      const defaultTab = defaultSecondaryTabs[activePrimaryTab as keyof typeof defaultSecondaryTabs] || 
        (secondaryTabs[activePrimaryTab] ? secondaryTabs[activePrimaryTab][0].id : '');
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.set('tab', defaultTab);
      setSearchParams(newSearchParams, { replace: true });
    }
  }, [activePrimaryTab, searchParams, setSearchParams, defaultSecondaryTabs, secondaryTabs]);

  // Notify parent of current secondary tab
  useEffect(() => {
    onSecondaryTabChange?.(activeSecondaryTab);
  }, [activeSecondaryTab, onSecondaryTabChange]);
  const {
    clusterMetrics,
    isLoading,
    error,
    autoRefresh,
    refreshInterval,
    isConnected,
    fetchAllMetrics,
    fetchMetricsHistory,
    clearMetrics,
    initializeWebSocketMetrics,
    cleanupWebSocketMetrics,
  } = useWebSocketMetricsStore();

  // WebSocket metrics initialization
  useEffect(() => {
    initializeWebSocketMetrics();
    
    // Initial data load for fallback
    fetchAllMetrics();
    fetchMetricsHistory(timeRange);

    return () => {
      cleanupWebSocketMetrics();
      clearMetrics();
    };
  }, [initializeWebSocketMetrics, cleanupWebSocketMetrics, fetchAllMetrics, fetchMetricsHistory, clearMetrics, timeRange]);

  // Optional polling fallback when WebSocket is disconnected
  useEffect(() => {
    let intervalId: number;

    if (autoRefresh && !isConnected) {
      const refresh = () => {
        fetchAllMetrics();
        fetchMetricsHistory(timeRange);
      };

      intervalId = setInterval(refresh, refreshInterval) as unknown as number;
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [autoRefresh, refreshInterval, isConnected, fetchAllMetrics, fetchMetricsHistory, timeRange]);

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
            <div className="flex justify-end items-center mb-4">
              {isConnected && (
                <div className="flex items-center space-x-2 text-sm font-mono">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-green-400">LIVE UPDATES</span>
                </div>
              )}
            </div>
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
            <ClusterOverview timeRange={timeRange} />
          </div>
        )}
        {activePrimaryTab === 'infrastructure' && activeSecondaryTab === 'nodes' && <NodeList />}
        {activePrimaryTab === 'infrastructure' && activeSecondaryTab === 'resources' && <ResourceCharts timeRange={timeRange} />}
        {activePrimaryTab === 'infrastructure' && activeSecondaryTab === 'storage' && <StorageIOMetrics timeRange={timeRange} />}
        {activePrimaryTab === 'infrastructure' && activeSecondaryTab === 'hierarchy' && <ResourceTree />}
        {activePrimaryTab === 'infrastructure' && activeSecondaryTab === 'network' && <NetworkTraffic timeRange={timeRange} />}
        
        {/* Workloads Tab Content */}
        {activePrimaryTab === 'workloads' && activeSecondaryTab === 'overview' && <ClusterOverview timeRange={timeRange} />}
        {activePrimaryTab === 'workloads' && activeSecondaryTab === 'pods' && <PodsView />}
        {activePrimaryTab === 'workloads' && activeSecondaryTab === 'services' && <ServicesList />}
        {activePrimaryTab === 'workloads' && activeSecondaryTab === 'namespaces' && <NamespaceMetrics />}
        
        {/* Service Mesh Tab Content */}
        {activePrimaryTab === 'mesh' && activeSecondaryTab === 'topology' && <ServiceMesh activeSecondaryTab={activeSecondaryTab} />}
        {activePrimaryTab === 'mesh' && activeSecondaryTab === 'services' && <ServiceMesh activeSecondaryTab={activeSecondaryTab} />}
        {activePrimaryTab === 'mesh' && activeSecondaryTab === 'endpoints' && <ServiceMesh activeSecondaryTab={activeSecondaryTab} />}
        {activePrimaryTab === 'mesh' && activeSecondaryTab === 'flows' && <ServiceMesh activeSecondaryTab={activeSecondaryTab} />}
        {activePrimaryTab === 'mesh' && activeSecondaryTab === 'gateway' && <APIGatewayAnalytics timeRange={timeRange} />}
        
        {/* Deployments Tab Content */}
        {activePrimaryTab === 'deployments' && activeSecondaryTab === 'applications' && <GitOps activeSecondaryTab={activeSecondaryTab} />}
        {activePrimaryTab === 'deployments' && activeSecondaryTab === 'repositories' && <GitOps activeSecondaryTab={activeSecondaryTab} />}
        {activePrimaryTab === 'deployments' && activeSecondaryTab === 'gitea' && <GiteaActions />}
        
        {/* Observability Tab Content */}
        {activePrimaryTab === 'observability' && activeSecondaryTab === 'logs' && <EnhancedLogs />}
        {activePrimaryTab === 'observability' && activeSecondaryTab === 'events' && <EventTimeline timeRange={timeRange} />}
        {activePrimaryTab === 'observability' && activeSecondaryTab === 'streams' && <LiveStreams />}
        {activePrimaryTab === 'observability' && activeSecondaryTab === 'analytics' && <LogAnalytics timeRange={timeRange} />}
      </div>
    </div>
  );
};

export default Dashboard;
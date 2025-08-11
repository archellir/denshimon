import { useEffect } from 'react';
import { useSearchParams } from 'react-router';
import type { FC } from 'react';
import { Activity, Server, Database, HardDrive, Cpu, MemoryStick, Network, Clock, Zap, Package, Eye, FileText, GitBranch, TreePine, TrendingUp } from 'lucide-react';
import StatusIcon, { getStatusColor, type StatusType } from '@components/common/StatusIcon';
import useWebSocketMetricsStore from '@stores/webSocketMetricsStore';
import { PrimaryTab, InfrastructureTab, WorkloadsTab, MeshTab, DeploymentsTab, ObservabilityTab, LABELS, UI_MESSAGES, TimeRange, HealthStatus } from '@constants';
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

const Dashboard: FC<DashboardProps> = ({ activePrimaryTab = PrimaryTab.INFRASTRUCTURE, onSecondaryTabChange, timeRange = TimeRange.ONE_HOUR }) => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Default secondary tabs for each primary tab
  const defaultSecondaryTabs = {
    [PrimaryTab.INFRASTRUCTURE]: InfrastructureTab.OVERVIEW,
    [PrimaryTab.WORKLOADS]: WorkloadsTab.OVERVIEW,
    [PrimaryTab.MESH]: MeshTab.TOPOLOGY,
    [PrimaryTab.DEPLOYMENTS]: DeploymentsTab.APPLICATIONS,
    [PrimaryTab.OBSERVABILITY]: ObservabilityTab.LOGS,
  };

  // Secondary tab definitions
  const secondaryTabs: Record<string, Array<{ id: string; label: string; icon: any }>> = {
    [PrimaryTab.INFRASTRUCTURE]: [
      { id: InfrastructureTab.OVERVIEW, label: LABELS.OVERVIEW, icon: Activity },
      { id: InfrastructureTab.NODES, label: LABELS.NODES, icon: Server },
      { id: InfrastructureTab.RESOURCES, label: LABELS.RESOURCES, icon: Cpu },
      { id: InfrastructureTab.STORAGE, label: LABELS.STORAGE, icon: HardDrive },
      { id: InfrastructureTab.HIERARCHY, label: LABELS.HIERARCHY, icon: TreePine },
      { id: InfrastructureTab.NETWORK, label: LABELS.NETWORK, icon: Network },
    ],
    [PrimaryTab.WORKLOADS]: [
      { id: WorkloadsTab.OVERVIEW, label: LABELS.OVERVIEW, icon: Activity },
      { id: WorkloadsTab.PODS, label: LABELS.PODS, icon: Database },
      { id: WorkloadsTab.SERVICES, label: LABELS.SERVICES, icon: Network },
      { id: WorkloadsTab.NAMESPACES, label: LABELS.NAMESPACES, icon: HardDrive },
    ],
    [PrimaryTab.MESH]: [
      { id: MeshTab.TOPOLOGY, label: LABELS.TOPOLOGY, icon: Network },
      { id: MeshTab.SERVICES, label: LABELS.SERVICES, icon: Server },
      { id: MeshTab.ENDPOINTS, label: LABELS.ENDPOINTS, icon: Activity },
      { id: MeshTab.FLOWS, label: LABELS.TRAFFIC_FLOW, icon: Zap },
      { id: MeshTab.GATEWAY, label: LABELS.API_GATEWAY, icon: Eye },
    ],
    [PrimaryTab.DEPLOYMENTS]: [
      { id: DeploymentsTab.APPLICATIONS, label: LABELS.APPLICATIONS, icon: Package },
      { id: DeploymentsTab.REPOSITORIES, label: LABELS.REPOSITORIES, icon: GitBranch },
      { id: DeploymentsTab.GITEA, label: LABELS.GITEA_ACTIONS, icon: Zap },
    ],
    [PrimaryTab.OBSERVABILITY]: [
      { id: ObservabilityTab.LOGS, label: LABELS.LOGS, icon: FileText },
      { id: ObservabilityTab.EVENTS, label: LABELS.EVENTS, icon: Clock },
      { id: ObservabilityTab.STREAMS, label: LABELS.LIVE_STREAMS, icon: Activity },
      { id: ObservabilityTab.ANALYTICS, label: LABELS.ANALYTICS, icon: TrendingUp },
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

  // WebSocket metrics initialization - only once on mount
  useEffect(() => {
    initializeWebSocketMetrics();
    
    // Initial data load for fallback
    fetchAllMetrics();

    return () => {
      cleanupWebSocketMetrics();
      clearMetrics();
    };
  }, []); // Empty dependency array - only run once on mount

  // Fetch history when timeRange changes
  useEffect(() => {
    fetchMetricsHistory(timeRange);
  }, [timeRange, fetchMetricsHistory]);

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
  }, [autoRefresh, refreshInterval, isConnected, timeRange]); // Removed fetchAllMetrics and fetchMetricsHistory from deps to avoid circular updates

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
        status: clusterMetrics.ready_nodes === clusterMetrics.total_nodes ? HealthStatus.HEALTHY as StatusType : HealthStatus.WARNING as StatusType,
      },
      {
        label: 'Pods',
        value: `${clusterMetrics.running_pods}/${clusterMetrics.total_pods}`,
        icon: Database,
        status: clusterMetrics.running_pods > 0 ? HealthStatus.HEALTHY as StatusType : HealthStatus.ERROR as StatusType,
      },
      {
        label: 'CPU',
        value: `${clusterMetrics.cpu_usage.usage_percent.toFixed(1)}%`,
        icon: Cpu,
        status: clusterMetrics.cpu_usage.usage_percent < 80 ? HealthStatus.HEALTHY as StatusType : 
                clusterMetrics.cpu_usage.usage_percent < 95 ? HealthStatus.WARNING as StatusType : HealthStatus.CRITICAL as StatusType,
      },
      {
        label: 'Memory',
        value: `${clusterMetrics.memory_usage.usage_percent.toFixed(1)}%`,
        icon: MemoryStick,
        status: clusterMetrics.memory_usage.usage_percent < 80 ? HealthStatus.HEALTHY as StatusType : 
                clusterMetrics.memory_usage.usage_percent < 95 ? HealthStatus.WARNING as StatusType : HealthStatus.CRITICAL as StatusType,
      },
    ];
  };

  if (error) {
    return (
      <div className="min-h-screen bg-black text-white p-6">
        <div className="max-w-7xl mx-auto">
          <div className="border border-red-400 bg-red-900/20 p-6 rounded-sm">
            <h2 className="text-xl font-mono mb-2">{UI_MESSAGES.ERROR}</h2>
            <p className="font-mono text-red-400">{error}</p>
            <button
              onClick={() => {
                clearMetrics();
                fetchAllMetrics();
              }}
              className="mt-4 px-4 py-2 border border-red-400 text-red-400 hover:bg-red-400 hover:text-black transition-colors font-mono"
            >
              {UI_MESSAGES.RETRY}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Quick Stats - only on Infrastructure tab */}
      {activePrimaryTab === PrimaryTab.INFRASTRUCTURE && clusterMetrics && (
        <div className="border-b border-white">
          <div className="max-w-7xl mx-auto p-6">
            <div className="flex justify-end items-center mb-4">
              {isConnected && (
                <div className="flex items-center space-x-2 text-sm font-mono">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-green-400">{UI_MESSAGES.LIVE_UPDATES}</span>
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
        {activePrimaryTab === PrimaryTab.INFRASTRUCTURE && activeSecondaryTab === InfrastructureTab.OVERVIEW && (
          <div className="space-y-6">
            <HealthDashboard compact />
            <ClusterOverview timeRange={timeRange} />
          </div>
        )}
        {activePrimaryTab === PrimaryTab.INFRASTRUCTURE && activeSecondaryTab === InfrastructureTab.NODES && <NodeList />}
        {activePrimaryTab === PrimaryTab.INFRASTRUCTURE && activeSecondaryTab === InfrastructureTab.RESOURCES && <ResourceCharts timeRange={timeRange} />}
        {activePrimaryTab === PrimaryTab.INFRASTRUCTURE && activeSecondaryTab === InfrastructureTab.STORAGE && <StorageIOMetrics timeRange={timeRange} />}
        {activePrimaryTab === PrimaryTab.INFRASTRUCTURE && activeSecondaryTab === InfrastructureTab.HIERARCHY && <ResourceTree />}
        {activePrimaryTab === PrimaryTab.INFRASTRUCTURE && activeSecondaryTab === InfrastructureTab.NETWORK && <NetworkTraffic timeRange={timeRange} />}
        
        {/* Workloads Tab Content */}
        {activePrimaryTab === PrimaryTab.WORKLOADS && activeSecondaryTab === WorkloadsTab.OVERVIEW && <ClusterOverview timeRange={timeRange} />}
        {activePrimaryTab === PrimaryTab.WORKLOADS && activeSecondaryTab === WorkloadsTab.PODS && <PodsView />}
        {activePrimaryTab === PrimaryTab.WORKLOADS && activeSecondaryTab === WorkloadsTab.SERVICES && <ServicesList />}
        {activePrimaryTab === PrimaryTab.WORKLOADS && activeSecondaryTab === WorkloadsTab.NAMESPACES && <NamespaceMetrics />}
        
        {/* Service Mesh Tab Content */}
        {activePrimaryTab === PrimaryTab.MESH && activeSecondaryTab === MeshTab.TOPOLOGY && <ServiceMesh activeSecondaryTab={activeSecondaryTab} />}
        {activePrimaryTab === PrimaryTab.MESH && activeSecondaryTab === MeshTab.SERVICES && <ServiceMesh activeSecondaryTab={activeSecondaryTab} />}
        {activePrimaryTab === PrimaryTab.MESH && activeSecondaryTab === MeshTab.ENDPOINTS && <ServiceMesh activeSecondaryTab={activeSecondaryTab} />}
        {activePrimaryTab === PrimaryTab.MESH && activeSecondaryTab === MeshTab.FLOWS && <ServiceMesh activeSecondaryTab={activeSecondaryTab} />}
        {activePrimaryTab === PrimaryTab.MESH && activeSecondaryTab === MeshTab.GATEWAY && <APIGatewayAnalytics timeRange={timeRange} />}
        
        {/* Deployments Tab Content */}
        {activePrimaryTab === PrimaryTab.DEPLOYMENTS && activeSecondaryTab === DeploymentsTab.APPLICATIONS && <GitOps activeSecondaryTab={activeSecondaryTab} />}
        {activePrimaryTab === PrimaryTab.DEPLOYMENTS && activeSecondaryTab === DeploymentsTab.REPOSITORIES && <GitOps activeSecondaryTab={activeSecondaryTab} />}
        {activePrimaryTab === PrimaryTab.DEPLOYMENTS && activeSecondaryTab === DeploymentsTab.GITEA && <GiteaActions />}
        
        {/* Observability Tab Content */}
        {activePrimaryTab === PrimaryTab.OBSERVABILITY && activeSecondaryTab === ObservabilityTab.LOGS && <EnhancedLogs />}
        {activePrimaryTab === PrimaryTab.OBSERVABILITY && activeSecondaryTab === ObservabilityTab.EVENTS && <EventTimeline timeRange={timeRange} />}
        {activePrimaryTab === PrimaryTab.OBSERVABILITY && activeSecondaryTab === ObservabilityTab.STREAMS && <LiveStreams />}
        {activePrimaryTab === PrimaryTab.OBSERVABILITY && activeSecondaryTab === ObservabilityTab.ANALYTICS && <LogAnalytics timeRange={timeRange} />}
      </div>
    </div>
  );
};

export default Dashboard;
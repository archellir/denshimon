import { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'react-router';
import type { FC } from 'react';
import { Activity, Server, Database, HardDrive, Cpu, Network, Clock, Zap, Package, Eye, FileText, GitBranch, TreePine, TrendingUp, Plus, Filter, Download, Grid, List } from 'lucide-react';
import StatusIcon, { getStatusColor } from '@components/common/StatusIcon';
import GlobalSearch from '@components/common/GlobalSearch';
import useWebSocketMetricsStore from '@stores/webSocketMetricsStore';
import { SearchResult } from '@stores/globalSearchStore';
import { PrimaryTab, InfrastructureTab, WorkloadsTab, MeshTab, DeploymentsTab, ObservabilityTab, LABELS, UI_MESSAGES, TimeRange, DASHBOARD_SECTIONS } from '@constants';
import useSettingsStore from '@stores/settingsStore';
import { 
  generateInfrastructureStats, 
  generateWorkloadsStats, 
  generateMeshStats, 
  generateDeploymentStats, 
  generateObservabilityStats,
  type QuickStat
} from '@utils/quickStatsUtils';
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
  const { isSectionVisible } = useSettingsStore();

  // Store last visited secondary tab for each primary tab
  const [lastVisitedTabs, setLastVisitedTabs] = useState<Record<string, string>>({});
  const previousPrimaryTab = useRef<string>(activePrimaryTab);

  // Workload controls state
  const [selectedNamespace, setSelectedNamespace] = useState<string>('all');
  const [selectedServiceType, setSelectedServiceType] = useState<string>('all');
  const [serviceViewMode, setServiceViewMode] = useState<'cards' | 'table'>('cards');
  const [serviceSortBy, setServiceSortBy] = useState<string>('name');
  const [serviceSortOrder, setServiceSortOrder] = useState<'asc' | 'desc'>('asc');

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

  // Get current secondary tab from URL, last visited, or use default
  const getSecondaryTabForPrimaryTab = (primaryTab: string) => {
    return lastVisitedTabs[primaryTab] || 
           defaultSecondaryTabs[primaryTab as keyof typeof defaultSecondaryTabs] || 
           (secondaryTabs[primaryTab] ? secondaryTabs[primaryTab][0].id : '');
  };

  const activeSecondaryTab = searchParams.get('tab') || getSecondaryTabForPrimaryTab(activePrimaryTab);

  // Update secondary tab and URL
  const setActiveSecondaryTab = (tabId: string) => {
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.set('tab', tabId);
    setSearchParams(newSearchParams);
    
    // Store this as the last visited tab for the current primary tab
    setLastVisitedTabs(prev => ({
      ...prev,
      [activePrimaryTab]: tabId
    }));
    
    onSecondaryTabChange?.(tabId);
  };

  // Handle global search navigation
  useEffect(() => {
    const handleGlobalSearchNavigate = (event: CustomEvent<SearchResult>) => {
      const result = event.detail;
      
      // Navigate to the primary tab
      const { primaryTab, secondaryTab } = result.location;
      
      // Navigate to primary tab (this will be handled by the parent component)
      window.dispatchEvent(new CustomEvent('navigateToPrimaryTab', {
        detail: { primaryTab }
      }));
      
      // Set secondary tab if specified
      if (secondaryTab) {
        setActiveSecondaryTab(secondaryTab);
      }
      
      // Set local search filter for the target component
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('setLocalSearchFilter', {
          detail: { 
            query: result.name,
            type: result.type,
            namespace: result.namespace
          }
        }));
      }, 100);
    };

    window.addEventListener('globalSearchNavigate', handleGlobalSearchNavigate as EventListener);
    return () => {
      window.removeEventListener('globalSearchNavigate', handleGlobalSearchNavigate as EventListener);
    };
  }, [setActiveSecondaryTab]);

  // Handle primary tab changes - restore last visited secondary tab
  useEffect(() => {
    // If primary tab changed, restore the last visited secondary tab for the new primary tab
    if (previousPrimaryTab.current !== activePrimaryTab) {
      const targetSecondaryTab = getSecondaryTabForPrimaryTab(activePrimaryTab);
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.set('tab', targetSecondaryTab);
      setSearchParams(newSearchParams, { replace: true });
      previousPrimaryTab.current = activePrimaryTab;
    }
  }, [activePrimaryTab, searchParams, setSearchParams, lastVisitedTabs]);

  // Set default tab in URL if none is present (initial load)
  useEffect(() => {
    if (!searchParams.get('tab')) {
      const defaultTab = getSecondaryTabForPrimaryTab(activePrimaryTab);
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.set('tab', defaultTab);
      setSearchParams(newSearchParams, { replace: true });
    }
  }, [activePrimaryTab, searchParams, setSearchParams, lastVisitedTabs]);

  // Notify parent of current secondary tab
  useEffect(() => {
    onSecondaryTabChange?.(activeSecondaryTab);
  }, [activeSecondaryTab, onSecondaryTabChange]);
  const {
    clusterMetrics,
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


  const getQuickStatsForTab = (tab: string): QuickStat[] => {
    if (!clusterMetrics) return [];
    
    switch (tab) {
      case PrimaryTab.INFRASTRUCTURE:
        return generateInfrastructureStats(clusterMetrics);
      case PrimaryTab.WORKLOADS:
        return generateWorkloadsStats(clusterMetrics);
      case PrimaryTab.MESH:
        return generateMeshStats();
      case PrimaryTab.DEPLOYMENTS:
        return generateDeploymentStats();
      case PrimaryTab.OBSERVABILITY:
        return generateObservabilityStats();
      default:
        return [];
    }
  };

  // Render action buttons and counts for secondary tabs
  const renderSecondaryTabActions = (primaryTab: string, secondaryTab: string) => {
    switch (primaryTab) {
      case PrimaryTab.INFRASTRUCTURE:
        switch (secondaryTab) {
          case InfrastructureTab.NODES:
            return (
              <span className="text-sm font-mono opacity-60">
                {clusterMetrics ? `${clusterMetrics.total_nodes} NODES` : 'CONNECTING...'}
              </span>
            );
          case InfrastructureTab.RESOURCES:
            return (
              <span className="text-sm font-mono opacity-60">
                {clusterMetrics ? `${(clusterMetrics.cpu_usage.usage_percent).toFixed(1)}% CPU • ${(clusterMetrics.memory_usage.usage_percent).toFixed(1)}% MEM` : 'CONNECTING...'}
              </span>
            );
          case InfrastructureTab.STORAGE:
            return (
              <span className="text-sm font-mono opacity-60">
                {clusterMetrics ? `${(clusterMetrics.storage_usage.usage_percent).toFixed(1)}% STORAGE` : 'CONNECTING...'}
              </span>
            );
          default:
            return null;
        }
      
      case PrimaryTab.WORKLOADS:
        switch (secondaryTab) {
          case WorkloadsTab.PODS:
            return (
              <>
                <span className="text-sm font-mono opacity-60">
                  {clusterMetrics ? `${clusterMetrics.total_pods} PODS` : 'CONNECTING...'}
                </span>
                <select
                  value={selectedNamespace}
                  onChange={(e) => setSelectedNamespace(e.target.value)}
                  className="bg-black border border-white text-white px-2 py-1 font-mono text-xs focus:outline-none focus:border-green-400"
                >
                  <option value="all">ALL NAMESPACES</option>
                  <option value="default">DEFAULT</option>
                  <option value="denshimon-test">DENSHIMON-TEST</option>
                  <option value="monitoring">MONITORING</option>
                  <option value="production">PRODUCTION</option>
                </select>
              </>
            );
          case WorkloadsTab.SERVICES:
            return (
              <>
                <span className="text-sm font-mono opacity-60">SERVICES</span>
                <select
                  value={selectedNamespace}
                  onChange={(e) => setSelectedNamespace(e.target.value)}
                  className="bg-black border border-white text-white px-2 py-1 font-mono text-xs focus:outline-none focus:border-green-400"
                >
                  <option value="all">ALL NAMESPACES</option>
                  <option value="default">DEFAULT</option>
                  <option value="monitoring">MONITORING</option>
                  <option value="production">PRODUCTION</option>
                </select>
                <select
                  value={selectedServiceType}
                  onChange={(e) => setSelectedServiceType(e.target.value)}
                  className="bg-black border border-white text-white px-2 py-1 font-mono text-xs focus:outline-none focus:border-green-400"
                >
                  <option value="all">ALL TYPES</option>
                  <option value="ClusterIP">CLUSTER IP</option>
                  <option value="NodePort">NODE PORT</option>
                  <option value="LoadBalancer">LOAD BALANCER</option>
                  <option value="ExternalName">EXTERNAL NAME</option>
                </select>
                <div className="flex border border-white">
                  <button
                    onClick={() => setServiceViewMode('cards')}
                    className={`px-2 py-1 font-mono text-xs transition-colors ${
                      serviceViewMode === 'cards' ? 'bg-white text-black' : 'hover:bg-white/10'
                    }`}
                  >
                    <Grid size={12} />
                  </button>
                  <button
                    onClick={() => setServiceViewMode('table')}
                    className={`px-2 py-1 border-l border-white font-mono text-xs transition-colors ${
                      serviceViewMode === 'table' ? 'bg-white text-black' : 'hover:bg-white/10'
                    }`}
                  >
                    <List size={12} />
                  </button>
                </div>
                <select
                  value={serviceSortBy}
                  onChange={(e) => setServiceSortBy(e.target.value)}
                  className="bg-black border border-white text-white px-2 py-1 font-mono text-xs focus:outline-none focus:border-green-400"
                >
                  <option value="name">SORT: NAME</option>
                  <option value="namespace">SORT: NAMESPACE</option>
                  <option value="type">SORT: TYPE</option>
                  <option value="age">SORT: AGE</option>
                  <option value="endpoints">SORT: ENDPOINTS</option>
                </select>
                <button
                  onClick={() => setServiceSortOrder(serviceSortOrder === 'asc' ? 'desc' : 'asc')}
                  className="px-2 py-1 border border-white font-mono text-xs hover:bg-white hover:text-black transition-colors"
                >
                  {serviceSortOrder === 'asc' ? '↑' : '↓'}
                </button>
              </>
            );
          case WorkloadsTab.NAMESPACES:
            return (
              <span className="text-sm font-mono opacity-60">
                {clusterMetrics ? `${clusterMetrics.total_namespaces} NAMESPACES` : 'CONNECTING...'}
              </span>
            );
          default:
            return null;
        }
      
      case PrimaryTab.MESH:
        return (
          <span className="text-sm font-mono opacity-60">
            12 SERVICES • 89.2% mTLS
          </span>
        );
      
      case PrimaryTab.DEPLOYMENTS:
        switch (secondaryTab) {
          case DeploymentsTab.APPLICATIONS:
            return (
              <div className="flex items-center space-x-2">
                <span className="text-sm font-mono opacity-60">
                  8 APPLICATIONS
                </span>
                <button
                  onClick={() => {}}
                  className="flex items-center space-x-1 px-2 py-1 border border-green-400 text-green-400 hover:bg-green-400 hover:text-black transition-colors font-mono text-xs"
                >
                  <Plus size={12} />
                  <span>CREATE</span>
                </button>
              </div>
            );
          case DeploymentsTab.REPOSITORIES:
            return (
              <div className="flex items-center space-x-2">
                <span className="text-sm font-mono opacity-60">
                  4 REPOSITORIES
                </span>
                <button
                  onClick={() => {}}
                  className="flex items-center space-x-1 px-2 py-1 border border-green-400 text-green-400 hover:bg-green-400 hover:text-black transition-colors font-mono text-xs"
                >
                  <Plus size={12} />
                  <span>CREATE</span>
                </button>
              </div>
            );
          default:
            return null;
        }
      
      case PrimaryTab.OBSERVABILITY:
        switch (secondaryTab) {
          case ObservabilityTab.LOGS:
            return (
              <div className="flex items-center space-x-2">
                <span className="text-sm font-mono opacity-60">
                  1.2K ENTRIES
                </span>
                <button
                  onClick={() => {}}
                  className="flex items-center space-x-1 px-2 py-1 border border-white hover:bg-white hover:text-black transition-colors font-mono text-xs"
                >
                  <Download size={12} />
                  <span>EXPORT</span>
                </button>
              </div>
            );
          case ObservabilityTab.EVENTS:
            return (
              <div className="flex items-center space-x-4">
                <span className="text-sm font-mono opacity-60">
                  45 EVENTS
                </span>
                <span className="text-sm font-mono opacity-60">
                  8 WARNINGS
                </span>
                <span className="text-sm font-mono opacity-60">
                  2 ERRORS
                </span>
              </div>
            );
          default:
            return null;
        }
      
      default:
        return null;
    }
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
      {/* Quick Stats - show for major tabs except observability */}
      {isSectionVisible(DASHBOARD_SECTIONS.QUICK_STATS) && (activePrimaryTab === PrimaryTab.INFRASTRUCTURE || activePrimaryTab === PrimaryTab.WORKLOADS || activePrimaryTab === PrimaryTab.MESH || activePrimaryTab === PrimaryTab.DEPLOYMENTS) && clusterMetrics && (
        <div className="border-b border-white">
          <div className="max-w-7xl mx-auto px-6 pt-2 pb-6">
            <div className="flex justify-end items-center mb-4">
              {isSectionVisible(DASHBOARD_SECTIONS.LIVE_UPDATES_INDICATOR) && (
                <div className="flex items-center space-x-2 text-sm font-mono">
                  {isConnected ? (
                    <>
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-green-400">{UI_MESSAGES.LIVE_UPDATES}</span>
                    </>
                  ) : (
                    <>
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                      <span className="text-red-400">RECONNECTING...</span>
                    </>
                  )}
                </div>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {getQuickStatsForTab(activePrimaryTab).map((stat) => (
                <div key={stat.label} className={`border ${getStatusColor(stat.status)} p-3`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-mono opacity-60">{stat.label}</p>
                      <p className="text-base font-mono">{stat.value}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <stat.icon size={16} className="text-white" />
                      <StatusIcon status={stat.status} size={14} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Secondary Navigation - with visual separation and right-side actions */}
      {isSectionVisible(DASHBOARD_SECTIONS.SECONDARY_TABS) && secondaryTabs[activePrimaryTab] && (
        <div className="bg-black border-b border-white/20">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex items-center justify-between py-2">
              {/* Tab Navigation */}
              <div className="flex space-x-1">
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
              
              {/* Right-side Actions and Counts */}
              <div className="flex items-center space-x-4">
                {/* Item counts and action buttons will be rendered here per tab */}
                {renderSecondaryTabActions(activePrimaryTab, activeSecondaryTab)}
                
                {/* Global WebSocket Status Indicator */}
                {isSectionVisible(DASHBOARD_SECTIONS.LIVE_UPDATES_INDICATOR) && (
                  <div className="flex items-center space-x-2 text-xs font-mono border-l border-white/20 pl-4">
                    {isConnected ? (
                      <>
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-green-400">LIVE</span>
                      </>
                    ) : (
                      <>
                        <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></div>
                        <span className="text-red-400">OFFLINE</span>
                      </>
                    )}
                  </div>
                )}
              </div>
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
        {activePrimaryTab === PrimaryTab.WORKLOADS && activeSecondaryTab === WorkloadsTab.PODS && <PodsView selectedNamespace={selectedNamespace} />}
        {activePrimaryTab === PrimaryTab.WORKLOADS && activeSecondaryTab === WorkloadsTab.SERVICES && <ServicesList 
          selectedNamespace={selectedNamespace} 
          selectedType={selectedServiceType}
          viewMode={serviceViewMode}
          sortBy={serviceSortBy}
          sortOrder={serviceSortOrder}
        />}
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
      
      {/* Global Search Component */}
      <GlobalSearch />
    </div>
  );
};

export default Dashboard;
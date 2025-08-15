import { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'react-router';
import type { FC } from 'react';
import { Activity, Server, Database, HardDrive, Cpu, Network, Clock, Zap, Package, Eye, FileText, TreePine, TrendingUp, Plus, Download, Grid, List, Rocket, History, Shield, GitBranch, RefreshCw, type LucideIcon } from 'lucide-react';
import StatusIcon, { getStatusColor } from '@/components/common/StatusIcon';
import GlobalSearch from '@/components/common/GlobalSearch';
import useWebSocketMetricsStore from '@/stores/webSocketMetricsStore';
import useDeploymentStore from '@/stores/deploymentStore';
import useDatabaseStore from '@/stores/databaseStore';
import { SearchResult } from '@/stores/globalSearchStore';
import { PrimaryTab, InfrastructureTab, WorkloadsTab, MeshTab, DeploymentsTab, DatabaseTab, ObservabilityTab, UI_LABELS, UI_MESSAGES, TimeRange, DASHBOARD_SECTIONS } from '@/constants';
import useSettingsStore from '@/stores/settingsStore';
import NotificationContainer from '@/components/common/NotificationContainer';
import { 
  generateInfrastructureStats, 
  generateWorkloadsStats, 
  generateMeshStats, 
  generateDeploymentStats, 
  generateDatabaseStats,
  generateObservabilityStats,
  type QuickStat
} from '@/utils/quickStatsUtils';
import ClusterOverview from '@/components/metrics/ClusterOverview';
import WorkloadsOverview from '@/components/metrics/WorkloadsOverview';
import HealthDashboard from '@/components/metrics/HealthDashboard';
import ResourceCharts from '@/components/metrics/ResourceCharts';
import NodeList from '@/components/metrics/NodeList';
import NamespaceMetrics from '@/components/metrics/NamespaceMetrics';
import NetworkTraffic from '@/components/network/NetworkTraffic';
import EventTimeline from '@/components/events/EventTimeline';
import ServiceMesh from '@/components/services/ServiceMesh';
import EnhancedLogs from '@/components/observability/EnhancedLogs';
import LiveStreams from '@/components/observability/LiveStreams';
import LogAnalytics from '@/components/observability/LogAnalytics';
import DeploymentDashboard from '@/components/deployments/DeploymentDashboard';
import ConfigurationTab from '@/components/infrastructure/ConfigurationTab';
import PodsView from '@/components/PodsView';
import ResourceTree from '@/components/infrastructure/ResourceTree';
import StorageIOMetrics from '@/components/storage/StorageIOMetrics';
import APIGatewayAnalytics from '@/components/gateway/APIGatewayAnalytics';
import ServicesList from '@/components/workloads/ServicesList';
import DatabaseGrid from '@/components/infrastructure/DatabaseGrid';
import AddDatabaseConnectionModal from '@/components/infrastructure/AddDatabaseConnectionModal';
import DatabaseManagement from '@/components/infrastructure/DatabaseManagement';
import DatabaseBrowser from '@/components/database/DatabaseBrowser';
import SQLQueryInterface from '@/components/database/SQLQueryInterface';
import DatabaseMonitoring from '@/components/database/DatabaseMonitoring';
import CertificateHealthDashboard from '@/components/infrastructure/CertificateHealthDashboard';
import ServiceHealthDashboard from '@/components/infrastructure/ServiceHealthDashboard';
import BackupRecoveryDashboard from '@/components/infrastructure/BackupRecoveryDashboard';

interface DashboardProps {
  activePrimaryTab?: string;
  onSecondaryTabChange?: (tabId: string) => void;
  timeRange?: string;
  showHelp?: boolean;
}

const Dashboard: FC<DashboardProps> = ({ activePrimaryTab = PrimaryTab.INFRASTRUCTURE, onSecondaryTabChange, timeRange = TimeRange.ONE_HOUR, showHelp = false }) => {
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

  // Database management state
  const [showAddDatabaseModal, setShowAddDatabaseModal] = useState(false);
  const [selectedDatabaseConnection, setSelectedDatabaseConnection] = useState<string | null>(null);
  
  // Deployment management state
  const [showDeployModal, setShowDeployModal] = useState(false);
  
  // Backup management state
  const [backupRefreshing, setBackupRefreshing] = useState(false);

  const refreshBackupData = async () => {
    setBackupRefreshing(true);
    // Trigger backup data refresh - this will be handled by the BackupRecoveryDashboard component
    window.dispatchEvent(new CustomEvent('refreshBackupData'));
    setTimeout(() => setBackupRefreshing(false), 1000);
  };

  // Default secondary tabs for each primary tab
  const defaultSecondaryTabs = {
    [PrimaryTab.DEPLOYMENTS]: DeploymentsTab.DEPLOYMENTS,
    [PrimaryTab.DATABASE]: DatabaseTab.BROWSER,
    [PrimaryTab.OBSERVABILITY]: ObservabilityTab.SERVICE_HEALTH,
    [PrimaryTab.INFRASTRUCTURE]: InfrastructureTab.OVERVIEW,
    [PrimaryTab.WORKLOADS]: WorkloadsTab.OVERVIEW,
    [PrimaryTab.MESH]: MeshTab.TOPOLOGY,
  };

  // Secondary tab definitions
  const secondaryTabs: Record<string, Array<{ id: string; label: string; icon: LucideIcon }>> = {
    [PrimaryTab.INFRASTRUCTURE]: [
      { id: InfrastructureTab.OVERVIEW, label: UI_LABELS.OVERVIEW, icon: Activity },
      { id: InfrastructureTab.CONFIGURATION, label: UI_LABELS.CONFIGURATION, icon: GitBranch },
      { id: InfrastructureTab.BACKUP, label: UI_LABELS.BACKUP, icon: HardDrive },
      { id: InfrastructureTab.CERTIFICATES, label: UI_LABELS.CERTIFICATES, icon: Shield },
      { id: InfrastructureTab.NETWORK, label: UI_LABELS.NETWORK, icon: Network },
      { id: InfrastructureTab.RESOURCES, label: UI_LABELS.RESOURCES, icon: Cpu },
      { id: InfrastructureTab.STORAGE, label: UI_LABELS.STORAGE, icon: HardDrive },
      { id: InfrastructureTab.NODES, label: UI_LABELS.NODES, icon: Server },
    ],
    [PrimaryTab.WORKLOADS]: [
      { id: WorkloadsTab.OVERVIEW, label: UI_LABELS.OVERVIEW, icon: Activity },
      { id: WorkloadsTab.HIERARCHY, label: UI_LABELS.HIERARCHY, icon: TreePine },
      { id: WorkloadsTab.PODS, label: UI_LABELS.PODS, icon: Database },
      { id: WorkloadsTab.SERVICES, label: UI_LABELS.SERVICES, icon: Network },
      { id: WorkloadsTab.NAMESPACES, label: UI_LABELS.NAMESPACES, icon: HardDrive },
    ],
    [PrimaryTab.MESH]: [
      { id: MeshTab.SERVICES, label: UI_LABELS.SERVICES, icon: Server },
      { id: MeshTab.ENDPOINTS, label: UI_LABELS.ENDPOINTS, icon: Activity },
      { id: MeshTab.FLOWS, label: UI_LABELS.TRAFFIC_FLOW, icon: Zap },
      { id: MeshTab.TOPOLOGY, label: UI_LABELS.TOPOLOGY, icon: Network },
      { id: MeshTab.GATEWAY, label: UI_LABELS.API_GATEWAY, icon: Eye },
    ],
    [PrimaryTab.DEPLOYMENTS]: [
      { id: DeploymentsTab.DEPLOYMENTS, label: UI_LABELS.DEPLOYMENTS, icon: Rocket },
      { id: DeploymentsTab.HISTORY, label: UI_LABELS.HISTORY, icon: History },
      { id: DeploymentsTab.IMAGES, label: UI_LABELS.IMAGES, icon: Package },
      { id: DeploymentsTab.REGISTRIES, label: UI_LABELS.REGISTRIES, icon: Server },
    ],
    [PrimaryTab.DATABASE]: [
      { id: DatabaseTab.BROWSER, label: UI_LABELS.BROWSER, icon: Eye },
      { id: DatabaseTab.MONITORING, label: UI_LABELS.MONITORING, icon: TrendingUp },
      { id: DatabaseTab.QUERIES, label: UI_LABELS.QUERIES, icon: FileText },
      { id: DatabaseTab.CONNECTIONS, label: UI_LABELS.CONNECTIONS, icon: Database },
    ],
    [PrimaryTab.OBSERVABILITY]: [
      { id: ObservabilityTab.SERVICE_HEALTH, label: UI_LABELS.SERVICE_HEALTH, icon: Server },
      { id: ObservabilityTab.STREAMS, label: UI_LABELS.LIVE_STREAMS, icon: Activity },
      { id: ObservabilityTab.LOGS, label: UI_LABELS.LOGS, icon: FileText },
      { id: ObservabilityTab.ANALYTICS, label: UI_LABELS.ANALYTICS, icon: TrendingUp },
      { id: ObservabilityTab.EVENTS, label: UI_LABELS.EVENTS, icon: Clock },
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
      
      // Navigate to primary tab with secondary tab info (this will be handled by the parent component)
      window.dispatchEvent(new CustomEvent('navigateToPrimaryTab', {
        detail: { primaryTab, secondaryTab }
      }));
      
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
  }, []);

  // Handle primary tab changes - restore last visited secondary tab
  useEffect(() => {
    // If primary tab changed, restore the last visited secondary tab for the new primary tab
    if (previousPrimaryTab.current !== activePrimaryTab) {
      // Only set default tab if no tab is specified in URL
      if (!searchParams.get('tab')) {
        const targetSecondaryTab = getSecondaryTabForPrimaryTab(activePrimaryTab);
        const newSearchParams = new URLSearchParams(searchParams);
        newSearchParams.set('tab', targetSecondaryTab);
        setSearchParams(newSearchParams, { replace: true });
      }
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

  // Generate tab descriptions
  const getTabDescriptions = (primaryTab: string, secondaryTab: string) => {
    // Primary tab descriptions
    const primaryDescriptions: Record<string, string> = {
      [PrimaryTab.INFRASTRUCTURE]: "Monitor and manage your Kubernetes cluster's core infrastructure components and settings.",
      [PrimaryTab.WORKLOADS]: "View and manage application workloads, pods, services, and resource relationships across namespaces.",
      [PrimaryTab.MESH]: "Configure and monitor service mesh topology, traffic flows, and inter-service communication.",
      [PrimaryTab.DEPLOYMENTS]: "Deploy applications, manage container images, and track deployment history across registries.",
      [PrimaryTab.DATABASE]: "Browse databases, execute queries, monitor connections, and manage database operations.",
      [PrimaryTab.OBSERVABILITY]: "Analyze logs, monitor system events, track service health, and view real-time analytics."
    };

    // Secondary tab descriptions
    const secondaryDescriptions: Record<string, Record<string, string>> = {
      [PrimaryTab.INFRASTRUCTURE]: {
        [InfrastructureTab.OVERVIEW]: "View cluster health metrics, node status, and overall infrastructure performance.",
        [InfrastructureTab.CONFIGURATION]: "Manage the base infrastructure repository containing all Kubernetes configurations and GitOps synchronization.",
        [InfrastructureTab.NODES]: "Monitor individual cluster nodes, their resources, and operational status.",
        [InfrastructureTab.RESOURCES]: "Track CPU, memory, and storage utilization across the cluster.",
        [InfrastructureTab.STORAGE]: "Monitor storage I/O metrics, volumes, and persistent storage usage.",
        [InfrastructureTab.NETWORK]: "Analyze network traffic patterns, connectivity, and bandwidth utilization.",
        [InfrastructureTab.CERTIFICATES]: "Manage TLS certificates, monitor expiration dates, and certificate health.",
        [InfrastructureTab.BACKUP]: "Configure backup strategies, monitor backup status, and manage recovery operations."
      },
      [PrimaryTab.WORKLOADS]: {
        [WorkloadsTab.OVERVIEW]: "View workload distribution, resource usage, and application health across the cluster.",
        [WorkloadsTab.HIERARCHY]: "Explore resource relationships and dependencies between pods, services, and deployments.",
        [WorkloadsTab.PODS]: "Monitor individual pod status, logs, and debug running containers.",
        [WorkloadsTab.SERVICES]: "Manage Kubernetes services, endpoints, and load balancing configurations.",
        [WorkloadsTab.NAMESPACES]: "View namespace-specific metrics, quotas, and resource isolation."
      },
      [PrimaryTab.MESH]: {
        [MeshTab.TOPOLOGY]: "Visualize service mesh topology and inter-service communication patterns.",
        [MeshTab.SERVICES]: "Manage service mesh configurations, policies, and service registration.",
        [MeshTab.ENDPOINTS]: "Monitor service endpoints, health checks, and connectivity status.",
        [MeshTab.FLOWS]: "Analyze traffic flows, routing rules, and network policies.",
        [MeshTab.GATEWAY]: "Configure API gateway settings, analyze traffic, and manage ingress rules."
      },
      [PrimaryTab.DEPLOYMENTS]: {
        [DeploymentsTab.DEPLOYMENTS]: "Deploy new applications, view active deployments, and manage application lifecycle with GitOps.",
        [DeploymentsTab.HISTORY]: "View deployment history, perform rollbacks, and track all application deployment changes.",
        [DeploymentsTab.IMAGES]: "Browse container images, tags, and image registry information for deployments.",
        [DeploymentsTab.REGISTRIES]: "Manage container registries, authentication, and image repositories for application deployments."
      },
      [PrimaryTab.DATABASE]: {
        [DatabaseTab.BROWSER]: "Browse database schemas, tables, and execute SQL queries interactively.",
        [DatabaseTab.MONITORING]: "Monitor database performance, connections, and query execution metrics.",
        [DatabaseTab.QUERIES]: "Create, save, and execute SQL queries with syntax highlighting and results.",
        [DatabaseTab.CONNECTIONS]: "Manage database connections, credentials, and connection pooling."
      },
      [PrimaryTab.OBSERVABILITY]: {
        [ObservabilityTab.SERVICE_HEALTH]: "Monitor service health, SLA metrics, and system reliability indicators.",
        [ObservabilityTab.STREAMS]: "View real-time log streams and live system events as they occur.",
        [ObservabilityTab.LOGS]: "Search, filter, and analyze historical log data across all services.",
        [ObservabilityTab.ANALYTICS]: "Generate insights from log data with patterns, trends, and anomaly detection.",
        [ObservabilityTab.EVENTS]: "Track system events, alerts, and operational changes in timeline view."
      }
    };

    return {
      primary: primaryDescriptions[primaryTab] || "Manage system operations and monitor cluster resources.",
      secondary: secondaryDescriptions[primaryTab]?.[secondaryTab] || "View detailed information and manage specific resources."
    };
  };

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
  
  // Deployment store for secondary nav controls
  const deploymentStore = useDeploymentStore();
  
  // Database store for secondary nav controls
  const { fetchConnections, fetchStats, isLoading: databaseLoading, connections } = useDatabaseStore();
  
  // State for database monitoring refresh
  const [lastDatabaseRefresh, setLastDatabaseRefresh] = useState<Date>(new Date());

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
      case PrimaryTab.DATABASE:
        return generateDatabaseStats();
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
          case InfrastructureTab.BACKUP:
            return (
              <button
                onClick={refreshBackupData}
                disabled={backupRefreshing}
                className="flex items-center space-x-2 px-3 py-2 border border-blue-400 text-blue-400 hover:bg-blue-400 hover:text-black disabled:opacity-50 transition-colors font-mono text-sm"
              >
                <RefreshCw size={16} className={backupRefreshing ? 'animate-spin' : ''} />
                <span>REFRESH</span>
              </button>
            );
          case InfrastructureTab.NODES:
            return null;
          case InfrastructureTab.RESOURCES:
            return null;
          case InfrastructureTab.STORAGE:
            return null;
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
        if (deploymentStore.error) {
          return (
            <div className="flex items-center space-x-2">
              <span className="text-red-400 font-mono text-sm">{deploymentStore.error}</span>
              <button
                onClick={() => {
                  deploymentStore.setError(null);
                  deploymentStore.fetchRegistries();
                  deploymentStore.fetchDeployments();
                  deploymentStore.fetchNodes();
                }}
                className="px-3 py-1 border border-green-400 text-green-400 hover:bg-green-400 hover:text-black transition-colors font-mono text-sm"
              >
                RETRY
              </button>
            </div>
          );
        }
        switch (secondaryTab) {
          case DeploymentsTab.DEPLOYMENTS:
            return (
              <button
                onClick={() => setShowDeployModal(true)}
                className="flex items-center space-x-2 px-4 py-2 border border-green-400 text-green-400 hover:bg-green-400 hover:text-black transition-colors font-mono text-sm uppercase tracking-wider"
              >
                <Plus size={16} />
                <span>DEPLOY APPLICATION</span>
              </button>
            );
          case DeploymentsTab.REGISTRIES:
            return (
              <button
                className="flex items-center space-x-2 px-4 py-2 border border-green-400 text-green-400 hover:bg-green-400 hover:text-black transition-colors font-mono text-sm"
              >
                <Plus size={16} />
                <span>ADD REGISTRY</span>
              </button>
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
                  onClick={() => {
                    // Export logs functionality
                    const timestamp = new Date().toISOString().split('T')[0];
                    const exportData = {
                      timestamp: new Date().toISOString(),
                      totalEntries: 1200, // This would come from actual log data
                      exportedBy: 'Admin',
                      logSummary: {
                        errors: 45,
                        warnings: 123,
                        info: 890,
                        debug: 142
                      }
                    };
                    
                    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `logs-export-${timestamp}.json`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
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

      case PrimaryTab.DATABASE:
        switch (secondaryTab) {
          case DatabaseTab.BROWSER:
            return (
              <div className="flex items-center space-x-4">
                <span className="text-sm font-mono opacity-60">
                  {connections.length} DATABASE{connections.length !== 1 ? 'S' : ''}
                </span>
                <button
                  onClick={() => fetchConnections()}
                  disabled={databaseLoading}
                  className="flex items-center space-x-2 px-3 py-2 border border-blue-400 text-blue-400 hover:bg-blue-400 hover:text-black disabled:opacity-50 transition-colors font-mono text-sm"
                >
                  <RefreshCw size={16} className={databaseLoading ? 'animate-spin' : ''} />
                  <span>REFRESH</span>
                </button>
              </div>
            );
          case DatabaseTab.MONITORING:
            return (
              <div className="flex items-center space-x-4">
                <span className="text-xs font-mono opacity-60">
                  Last update: {lastDatabaseRefresh.toLocaleTimeString()}
                </span>
                <button
                  onClick={() => {
                    setLastDatabaseRefresh(new Date());
                    // Refresh all connected databases
                    connections
                      .filter(conn => conn.status === 'connected')
                      .forEach(conn => fetchStats(conn.id));
                  }}
                  disabled={databaseLoading}
                  className="flex items-center space-x-2 px-3 py-2 border border-blue-400 text-blue-400 hover:bg-blue-400 hover:text-black disabled:opacity-50 transition-colors font-mono text-sm"
                >
                  <RefreshCw size={16} className={databaseLoading ? 'animate-spin' : ''} />
                  <span>REFRESH</span>
                </button>
              </div>
            );
          case DatabaseTab.QUERIES:
            return (
              <div className="flex items-center space-x-4">
                <span className="text-sm font-mono opacity-60">
                  {connections.filter(conn => conn.status === 'connected').length} CONNECTION{connections.filter(conn => conn.status === 'connected').length !== 1 ? 'S' : ''}
                </span>
                <button
                  onClick={() => fetchConnections()}
                  disabled={databaseLoading}
                  className="flex items-center space-x-2 px-3 py-2 border border-blue-400 text-blue-400 hover:bg-blue-400 hover:text-black disabled:opacity-50 transition-colors font-mono text-sm"
                >
                  <RefreshCw size={16} className={databaseLoading ? 'animate-spin' : ''} />
                  <span>REFRESH</span>
                </button>
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
      {/* Tab Descriptions */}
      {showHelp && isSectionVisible(DASHBOARD_SECTIONS.SECONDARY_TABS) && (
        <div className="border-b border-white">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="space-y-2">
              <p className="text-gray-300 font-mono text-sm">
                {getTabDescriptions(activePrimaryTab, activeSecondaryTab).primary}
              </p>
              <p className="text-gray-400 font-mono text-sm">
                {getTabDescriptions(activePrimaryTab, activeSecondaryTab).secondary}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Quick Stats - show for major tabs except observability */}
      {isSectionVisible(DASHBOARD_SECTIONS.QUICK_STATS) && (activePrimaryTab === PrimaryTab.INFRASTRUCTURE || activePrimaryTab === PrimaryTab.WORKLOADS || activePrimaryTab === PrimaryTab.MESH || activePrimaryTab === PrimaryTab.DEPLOYMENTS || activePrimaryTab === PrimaryTab.DATABASE) && clusterMetrics && (
        <div className="border-b border-white">
          <div className="max-w-7xl mx-auto px-6 pt-6 pb-6">
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
        {activePrimaryTab === PrimaryTab.INFRASTRUCTURE && activeSecondaryTab === InfrastructureTab.CONFIGURATION && <ConfigurationTab />}
        {activePrimaryTab === PrimaryTab.INFRASTRUCTURE && activeSecondaryTab === InfrastructureTab.NODES && <NodeList />}
        {activePrimaryTab === PrimaryTab.INFRASTRUCTURE && activeSecondaryTab === InfrastructureTab.RESOURCES && <ResourceCharts timeRange={timeRange} />}
        {activePrimaryTab === PrimaryTab.INFRASTRUCTURE && activeSecondaryTab === InfrastructureTab.STORAGE && <StorageIOMetrics timeRange={timeRange} />}
        {activePrimaryTab === PrimaryTab.INFRASTRUCTURE && activeSecondaryTab === InfrastructureTab.NETWORK && <NetworkTraffic timeRange={timeRange} />}
        {activePrimaryTab === PrimaryTab.INFRASTRUCTURE && activeSecondaryTab === InfrastructureTab.CERTIFICATES && <CertificateHealthDashboard />}
        {activePrimaryTab === PrimaryTab.INFRASTRUCTURE && activeSecondaryTab === InfrastructureTab.BACKUP && <BackupRecoveryDashboard />}
        
        {/* Workloads Tab Content */}
        {activePrimaryTab === PrimaryTab.WORKLOADS && activeSecondaryTab === WorkloadsTab.OVERVIEW && <WorkloadsOverview timeRange={timeRange} />}
        {activePrimaryTab === PrimaryTab.WORKLOADS && activeSecondaryTab === WorkloadsTab.HIERARCHY && <ResourceTree />}
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
        {activePrimaryTab === PrimaryTab.DEPLOYMENTS && (
          <DeploymentDashboard 
            activeTab={activeSecondaryTab}
            showDeployModal={showDeployModal}
            setShowDeployModal={setShowDeployModal}
          />
        )}
        
        {/* Database Tab Content */}
        {activePrimaryTab === PrimaryTab.DATABASE && activeSecondaryTab === DatabaseTab.CONNECTIONS && (
          selectedDatabaseConnection ? (
            <DatabaseManagement 
              connectionId={selectedDatabaseConnection}
              onBack={() => setSelectedDatabaseConnection(null)}
            />
          ) : (
            <DatabaseGrid 
              onAddConnection={() => setShowAddDatabaseModal(true)}
              onViewConnection={(id) => setSelectedDatabaseConnection(id)}
            />
          )
        )}
        {activePrimaryTab === PrimaryTab.DATABASE && activeSecondaryTab === DatabaseTab.BROWSER && <DatabaseBrowser />}
        {activePrimaryTab === PrimaryTab.DATABASE && activeSecondaryTab === DatabaseTab.QUERIES && <SQLQueryInterface />}
        {activePrimaryTab === PrimaryTab.DATABASE && activeSecondaryTab === DatabaseTab.MONITORING && <DatabaseMonitoring />}
        
        {/* Observability Tab Content */}
        {activePrimaryTab === PrimaryTab.OBSERVABILITY && activeSecondaryTab === ObservabilityTab.LOGS && <EnhancedLogs />}
        {activePrimaryTab === PrimaryTab.OBSERVABILITY && activeSecondaryTab === ObservabilityTab.EVENTS && <EventTimeline timeRange={timeRange} />}
        {activePrimaryTab === PrimaryTab.OBSERVABILITY && activeSecondaryTab === ObservabilityTab.STREAMS && <LiveStreams />}
        {activePrimaryTab === PrimaryTab.OBSERVABILITY && activeSecondaryTab === ObservabilityTab.ANALYTICS && <LogAnalytics timeRange={timeRange} />}
        {activePrimaryTab === PrimaryTab.OBSERVABILITY && activeSecondaryTab === ObservabilityTab.SERVICE_HEALTH && <ServiceHealthDashboard />}
      </div>
      
      {/* Global Search Component */}
      <GlobalSearch />

      {/* Database Modals */}
      <AddDatabaseConnectionModal 
        isOpen={showAddDatabaseModal}
        onClose={() => setShowAddDatabaseModal(false)}
      />

      {/* Notification Container */}
      {isSectionVisible(DASHBOARD_SECTIONS.NOTIFICATIONS) && (
        <NotificationContainer position="bottom-right" maxNotifications={3} />
      )}
    </div>
  );
};

export default Dashboard;
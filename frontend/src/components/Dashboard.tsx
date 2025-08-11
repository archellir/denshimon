import { useEffect, useState } from 'react';
import type { FC } from 'react';
import { Activity, Server, Database, HardDrive, Cpu, MemoryStick, Network, Clock, Zap } from 'lucide-react';
import useMetricsStore from '@stores/metricsStore';
import ClusterOverview from '@components/metrics/ClusterOverview';
import ResourceCharts from '@components/metrics/ResourceCharts';
import NodeList from '@components/metrics/NodeList';
import NamespaceMetrics from '@components/metrics/NamespaceMetrics';
import NetworkTraffic from '@components/network/NetworkTraffic';
import PodsOverview from '@components/pods/PodsOverview';
import EventTimeline from '@components/events/EventTimeline';
import ServiceMesh from '@components/services/ServiceMesh';

const Dashboard: FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
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

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'resources', label: 'Resources', icon: Server },
    { id: 'network', label: 'Network', icon: Network },
    { id: 'mesh', label: 'Service Mesh', icon: Zap },
    { id: 'events', label: 'Events', icon: Clock },
    { id: 'nodes', label: 'Nodes', icon: Server },
    { id: 'pods', label: 'Pods', icon: Database },
    { id: 'namespaces', label: 'Namespaces', icon: HardDrive },
  ];

  const getQuickStats = () => {
    if (!clusterMetrics) return [];

    return [
      {
        label: 'Nodes',
        value: `${clusterMetrics.ready_nodes}/${clusterMetrics.total_nodes}`,
        icon: Server,
        status: clusterMetrics.ready_nodes === clusterMetrics.total_nodes ? 'healthy' : 'warning',
      },
      {
        label: 'Pods',
        value: `${clusterMetrics.running_pods}/${clusterMetrics.total_pods}`,
        icon: Database,
        status: clusterMetrics.running_pods > 0 ? 'healthy' : 'error',
      },
      {
        label: 'CPU',
        value: `${clusterMetrics.cpu_usage.usage_percent.toFixed(1)}%`,
        icon: Cpu,
        status: clusterMetrics.cpu_usage.usage_percent < 80 ? 'healthy' : 'warning',
      },
      {
        label: 'Memory',
        value: `${clusterMetrics.memory_usage.usage_percent.toFixed(1)}%`,
        icon: MemoryStick,
        status: clusterMetrics.memory_usage.usage_percent < 80 ? 'healthy' : 'warning',
      },
    ];
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'text-green-400 border-green-400';
      case 'warning':
        return 'text-yellow-400 border-yellow-400';
      case 'error':
        return 'text-red-400 border-red-400';
      default:
        return 'text-white border-white';
    }
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
      {/* Header */}
      <div className="border-b border-white">
        <div className="max-w-7xl mx-auto p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-mono">KUBERNETES MONITORING</h1>
            <div className="flex items-center space-x-4">
              <div className="text-sm font-mono">
                {isLoading ? (
                  <span className="text-yellow-400">LOADING...</span>
                ) : (
                  <span className="text-green-400">ONLINE</span>
                )}
              </div>
              <div className="text-xs font-mono opacity-60">
                AUTO-REFRESH: {autoRefresh ? 'ON' : 'OFF'}
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          {clusterMetrics && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {getQuickStats().map((stat) => (
                <div key={stat.label} className={`border ${getStatusColor(stat.status)} p-4`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-mono opacity-60">{stat.label}</p>
                      <p className="text-lg font-mono">{stat.value}</p>
                    </div>
                    <stat.icon size={24} className={getStatusColor(stat.status).split(' ')[0]} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Navigation Tabs */}
          <div className="flex space-x-0 border border-white">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-3 border-r border-white last:border-r-0 font-mono transition-colors ${
                  activeTab === tab.id
                    ? 'bg-white text-black'
                    : 'bg-black text-white hover:bg-white hover:text-black'
                }`}
              >
                <tab.icon size={16} />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto p-6">
        {activeTab === 'overview' && <ClusterOverview />}
        {activeTab === 'resources' && <ResourceCharts />}
        {activeTab === 'network' && <NetworkTraffic />}
        {activeTab === 'mesh' && <ServiceMesh />}
        {activeTab === 'events' && <EventTimeline />}
        {activeTab === 'nodes' && <NodeList />}
        {activeTab === 'pods' && <PodsOverview />}
        {activeTab === 'namespaces' && <NamespaceMetrics />}
      </div>
    </div>
  );
};

export default Dashboard;
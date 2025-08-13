import { useMemo, useEffect } from 'react';
import type { FC } from 'react';
import { UI_MESSAGES, TimeRange } from '@constants';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
} from 'recharts';
import { format } from 'date-fns';
import useWebSocketMetricsStore from '@stores/webSocketMetricsStore';
import SkeletonLoader from '@components/common/SkeletonLoader';

interface WorkloadsOverviewProps {
  timeRange?: string;
}

const WorkloadsOverview: FC<WorkloadsOverviewProps> = ({ timeRange = TimeRange.ONE_HOUR }) => {
  const { clusterMetrics, metricsHistory, isLoadingHistory, fetchAllMetrics } = useWebSocketMetricsStore();

  // Fetch workload metrics
  useEffect(() => {
    fetchAllMetrics().catch(error => {
      console.error('Error fetching workload metrics:', error);
    });
  }, [fetchAllMetrics]);

  // Format workload chart data focusing on pod and deployment metrics
  const workloadChartData = useMemo(() => {
    if (!metricsHistory || !metricsHistory.pods || !Array.isArray(metricsHistory.pods)) {
      return [];
    }

    try {
      const data = metricsHistory.pods.map((podPoint, index) => {
        if (!podPoint || !podPoint.timestamp || typeof podPoint.value !== 'number') {
          return null;
        }
        
        return {
          time: format(new Date(podPoint.timestamp), 'HH:mm'),
          pods: podPoint.value || 0,
          services: metricsHistory.services?.[index]?.value || 0,
          deployments: metricsHistory.deployments?.[index]?.value || 0,
        };
      }).filter(Boolean);
      
      return data;
    } catch (error) {
      console.error('Error formatting workload chart data:', error);
      return [];
    }
  }, [metricsHistory]);

  // Pod status data for workloads context
  const podStatusData = useMemo(() => {
    if (!clusterMetrics) return [];

    return [
      { name: 'RUNNING', value: clusterMetrics.running_pods, color: '#00FF00' },
      { name: 'PENDING', value: clusterMetrics.pending_pods, color: '#FFFF00' },
      { name: 'FAILED', value: clusterMetrics.failed_pods, color: '#FF0000' },
    ].filter(item => item.value > 0);
  }, [clusterMetrics]);

  // Workload types distribution (mock data for demonstration)
  const workloadTypesData = useMemo(() => {
    if (!clusterMetrics) return [];

    // This would ideally come from actual API data
    const totalPods = clusterMetrics.running_pods + clusterMetrics.pending_pods + clusterMetrics.failed_pods;
    const deploymentPods = Math.floor(totalPods * 0.6);
    const daemonsetPods = Math.floor(totalPods * 0.2);
    const statefulsetPods = Math.floor(totalPods * 0.15);
    const standalonePods = totalPods - deploymentPods - daemonsetPods - statefulsetPods;

    return [
      { name: 'Deployments', value: deploymentPods, color: '#00FF00' },
      { name: 'DaemonSets', value: daemonsetPods, color: '#FFFF00' },
      { name: 'StatefulSets', value: statefulsetPods, color: '#00FFFF' },
      { name: 'Standalone', value: standalonePods, color: '#FF00FF' },
    ].filter(item => item.value > 0);
  }, [clusterMetrics]);

  // Namespace distribution (mock data)
  const namespaceData = useMemo(() => {
    if (!clusterMetrics) return [];

    // This would ideally come from actual API data
    const totalPods = clusterMetrics.running_pods + clusterMetrics.pending_pods + clusterMetrics.failed_pods;
    
    return [
      { name: 'default', pods: Math.floor(totalPods * 0.3) },
      { name: 'kube-system', pods: Math.floor(totalPods * 0.25) },
      { name: 'monitoring', pods: Math.floor(totalPods * 0.2) },
      { name: 'ingress', pods: Math.floor(totalPods * 0.15) },
      { name: 'other', pods: Math.floor(totalPods * 0.1) },
    ].filter(item => item.pods > 0);
  }, [clusterMetrics]);

  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: any[]; label?: string }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-black border border-white p-2 font-mono text-xs">
          <p className="text-white">{`Time: ${label}`}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }}>
              {`${entry.name}: ${entry.value}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const CustomPieTooltip = ({ active, payload }: { active?: boolean; payload?: any[] }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-black border border-white p-2 font-mono text-xs">
          <p style={{ color: payload[0].payload.color }}>
            {`${payload[0].name}: ${payload[0].value}`}
          </p>
        </div>
      );
    }
    return null;
  };

  const CustomBarTooltip = ({ active, payload, label }: { active?: boolean; payload?: any[]; label?: string }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-black border border-white p-2 font-mono text-xs">
          <p className="text-white">{`Namespace: ${label}`}</p>
          <p className="text-white">{`Pods: ${payload[0].value}`}</p>
        </div>
      );
    }
    return null;
  };

  if (!clusterMetrics) {
    return (
      <div className="space-y-6">
        <SkeletonLoader variant="chart" count={1} />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SkeletonLoader variant="chart" count={1} />
          <SkeletonLoader variant="chart" count={1} />
        </div>
      </div>
    );
  }

  try {
    return (
      <div className="space-y-6">

        {/* Workloads Over Time */}
        <div className="border border-white p-4 h-96">
          <h3 className="font-mono text-sm mb-4">WORKLOADS OVER TIME</h3>
          <div className="h-80">
            {isLoadingHistory ? (
              <div className="h-full">
                <SkeletonLoader variant="chart" count={1} />
              </div>
            ) : workloadChartData.length === 0 ? (
              <div className="flex items-center justify-center h-full border border-yellow-400">
                <span className="font-mono text-sm text-yellow-400">{UI_MESSAGES.CHART_NO_DATA}</span>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={workloadChartData} key={`workload-chart-${timeRange}`} margin={{ top: 5, right: 0, left: -35, bottom: 5 }}>
                  <XAxis
                    dataKey="time"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fontFamily: 'monospace', fill: 'white' }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fontFamily: 'monospace', fill: 'white' }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="pods"
                    stackId="1"
                    stroke="#00FF00"
                    fill="#00FF0020"
                    strokeWidth={1}
                    name="Pods"
                  />
                  <Area
                    type="monotone"
                    dataKey="services"
                    stackId="2"
                    stroke="#FFFF00"
                    fill="#FFFF0020"
                    strokeWidth={1}
                    name="Services"
                  />
                  <Area
                    type="monotone"
                    dataKey="deployments"
                    stackId="3"
                    stroke="#00FFFF"
                    fill="#00FFFF20"
                    strokeWidth={1}
                    name="Deployments"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Workload Status and Types */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pod Status */}
          <div className="border border-white p-4">
            <h3 className="font-mono text-sm mb-4">POD STATUS</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={podStatusData}
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    fill="#8884d8"
                    dataKey="value"
                    stroke="#FFFFFF"
                    strokeWidth={2}
                  >
                    {podStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomPieTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 space-y-1">
              {podStatusData.map((entry) => (
                <div key={entry.name} className="flex items-center justify-between font-mono text-xs">
                  <div className="flex items-center">
                    <div
                      className="w-3 h-3 border border-white mr-2"
                      style={{ backgroundColor: entry.color }}
                    />
                    <span>{entry.name}</span>
                  </div>
                  <span>{entry.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Workload Types */}
          <div className="border border-white p-4">
            <h3 className="font-mono text-sm mb-4">WORKLOAD TYPES</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={workloadTypesData}
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    fill="#8884d8"
                    dataKey="value"
                    stroke="#FFFFFF"
                    strokeWidth={2}
                  >
                    {workloadTypesData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomPieTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 space-y-1">
              {workloadTypesData.map((entry) => (
                <div key={entry.name} className="flex items-center justify-between font-mono text-xs">
                  <div className="flex items-center">
                    <div
                      className="w-3 h-3 border border-white mr-2"
                      style={{ backgroundColor: entry.color }}
                    />
                    <span>{entry.name}</span>
                  </div>
                  <span>{entry.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Namespace Distribution */}
        <div className="border border-white p-4">
          <h3 className="font-mono text-sm mb-4">PODS BY NAMESPACE</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={namespaceData} margin={{ top: 5, right: 30, left: -35, bottom: 5 }}>
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fontFamily: 'monospace', fill: 'white' }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fontFamily: 'monospace', fill: 'white' }}
                />
                <Tooltip content={<CustomBarTooltip />} />
                <Bar dataKey="pods" fill="#00FF00" stroke="#FFFFFF" strokeWidth={1} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="border border-white p-4 text-center">
            <div className="font-mono text-2xl text-white">
              {clusterMetrics.running_pods + clusterMetrics.pending_pods + clusterMetrics.failed_pods}
            </div>
            <div className="font-mono text-xs text-gray-400">TOTAL PODS</div>
          </div>
          <div className="border border-white p-4 text-center">
            <div className="font-mono text-2xl text-white">
              {clusterMetrics.total_services || 0}
            </div>
            <div className="font-mono text-xs text-gray-400">SERVICES</div>
          </div>
          <div className="border border-white p-4 text-center">
            <div className="font-mono text-2xl text-white">
              {clusterMetrics.total_deployments || 0}
            </div>
            <div className="font-mono text-xs text-gray-400">DEPLOYMENTS</div>
          </div>
          <div className="border border-white p-4 text-center">
            <div className="font-mono text-2xl text-white">
              {clusterMetrics.total_namespaces || 0}
            </div>
            <div className="font-mono text-xs text-gray-400">NAMESPACES</div>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error('WorkloadsOverview render error:', error);
    return (
      <div className="flex items-center justify-center h-64 border border-red-400">
        <div className="text-center">
          <div className="text-xl font-mono mb-2 text-red-400">{UI_MESSAGES.RENDER_ERROR}</div>
          <div className="text-sm font-mono opacity-60">{UI_MESSAGES.COMPONENT_FAILED}</div>
          <div className="text-xs font-mono mt-2 text-gray-400">
            {UI_MESSAGES.CHECK_CONSOLE}
          </div>
        </div>
      </div>
    );
  }
};

export default WorkloadsOverview;
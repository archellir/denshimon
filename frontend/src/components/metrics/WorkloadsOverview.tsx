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
import useWebSocketMetricsStore from '@stores/webSocketMetricsStore';
import SkeletonLoader from '@components/common/SkeletonLoader';
import { ChartTooltipProps, PieChartTooltipProps } from '@/types';
import { 
  formatWorkloadChartData, 
  formatPodStatusData, 
  generateWorkloadTypesData, 
  generateNamespaceData
} from '@utils/workloadMetrics';

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
    return formatWorkloadChartData(metricsHistory);
  }, [metricsHistory]);

  // Pod status data for workloads context
  const podStatusData = useMemo(() => {
    return formatPodStatusData(clusterMetrics);
  }, [clusterMetrics]);

  // Workload types distribution (mock data for demonstration)
  const workloadTypesData = useMemo(() => {
    return generateWorkloadTypesData(clusterMetrics);
  }, [clusterMetrics]);

  // Namespace distribution (mock data)
  const namespaceData = useMemo(() => {
    return generateNamespaceData(clusterMetrics);
  }, [clusterMetrics]);

  const CustomTooltip = ({ active, payload, label }: ChartTooltipProps) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-black border border-white p-2 font-mono text-xs">
          <p className="text-white">{`Time: ${label}`}</p>
          {payload.map((entry, index: number) => (
            <p key={index} style={{ color: entry.color }}>
              {`${entry.name}: ${entry.value}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const CustomPieTooltip = ({ active, payload }: PieChartTooltipProps) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-black border border-white p-2 font-mono text-xs">
          <p style={{ color: payload[0].payload.color as string }}>
            {`${payload[0].name}: ${payload[0].value}`}
          </p>
        </div>
      );
    }
    return null;
  };

  const CustomBarTooltip = ({ active, payload, label }: ChartTooltipProps) => {
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

        {/* Workload Performance */}
        <div className="border border-white p-4 h-96">
          <h3 className="font-mono text-sm mb-4">WORKLOAD PERFORMANCE</h3>
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
                    yAxisId="left"
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fontFamily: 'monospace', fill: 'white' }}
                    yAxisId="right"
                    orientation="right"
                    tickFormatter={(value) => `${value}%`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="pods"
                    stroke="#00FF00"
                    fill="#00FF0020"
                    strokeWidth={2}
                    name="Pod Count"
                    yAxisId="left"
                  />
                  <Area
                    type="monotone"
                    dataKey="cpu"
                    stroke="#FFFF00"
                    fill="#FFFF0015"
                    strokeWidth={2}
                    name="CPU Usage %"
                    yAxisId="right"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Workload Analysis */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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

          {/* Resource Breakdown */}
          <div className="border border-white p-4">
            <h3 className="font-mono text-sm mb-4">RESOURCE UTILIZATION</h3>
            <div className="space-y-4 mt-6">
              {/* Resource bars for cluster */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="font-mono text-xs">CPU BY WORKLOADS</span>
                  <span className="font-mono text-xs">{clusterMetrics ? `${clusterMetrics.cpu_usage.usage_percent.toFixed(0)}%` : '--'}</span>
                </div>
                <div className="w-full bg-gray-800 border border-white h-3">
                  <div 
                    className="h-full bg-green-400"
                    style={{ width: `${Math.min(clusterMetrics?.cpu_usage.usage_percent || 0, 100)}%` }}
                  />
                </div>
                <div className="text-xs font-mono opacity-60 mt-1">
                  {clusterMetrics ? `${(8 - (8 * clusterMetrics.cpu_usage.usage_percent / 100)).toFixed(1)} cores free` : 'Loading...'}
                </div>
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="font-mono text-xs">MEMORY BY WORKLOADS</span>
                  <span className="font-mono text-xs">{clusterMetrics ? `${clusterMetrics.memory_usage.usage_percent.toFixed(0)}%` : '--'}</span>
                </div>
                <div className="w-full bg-gray-800 border border-white h-3">
                  <div 
                    className="h-full bg-yellow-400"
                    style={{ width: `${Math.min(clusterMetrics?.memory_usage.usage_percent || 0, 100)}%` }}
                  />
                </div>
                <div className="text-xs font-mono opacity-60 mt-1">
                  {clusterMetrics ? `${(16 - (16 * clusterMetrics.memory_usage.usage_percent / 100)).toFixed(1)}GB free` : 'Loading...'}
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="font-mono text-xs">WORKLOAD DENSITY</span>
                  <span className="font-mono text-xs">{clusterMetrics ? `${clusterMetrics.running_pods}/30` : '--'}</span>
                </div>
                <div className="w-full bg-gray-800 border border-white h-3">
                  <div 
                    className="h-full bg-cyan-400"
                    style={{ width: `${clusterMetrics ? (clusterMetrics.running_pods / 30) * 100 : 0}%` }}
                  />
                </div>
                <div className="text-xs font-mono opacity-60 mt-1">
                  {clusterMetrics ? `${30 - clusterMetrics.running_pods} slots available` : 'Loading...'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Namespace Distribution */}
        <div className="border border-white p-4">
          <h3 className="font-mono text-sm mb-4">WORKLOAD ORGANIZATION</h3>
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

        {/* Deployment Summary */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="border border-white p-4 text-center">
            <div className="font-mono text-2xl text-green-400">
              {clusterMetrics.running_pods}
            </div>
            <div className="font-mono text-xs text-gray-400">RUNNING WORKLOADS</div>
          </div>
          <div className="border border-white p-4 text-center">
            <div className="font-mono text-2xl text-white">
              {Math.floor((8 - (8 * clusterMetrics.cpu_usage.usage_percent / 100)) * 10) / 10}
            </div>
            <div className="font-mono text-xs text-gray-400">FREE CPU CORES</div>
          </div>
          <div className="border border-white p-4 text-center">
            <div className="font-mono text-2xl text-white">
              {Math.floor((16 - (16 * clusterMetrics.memory_usage.usage_percent / 100)) * 10) / 10}GB
            </div>
            <div className="font-mono text-xs text-gray-400">FREE MEMORY</div>
          </div>
          <div className="border border-white p-4 text-center">
            <div className="font-mono text-2xl text-cyan-400">
              {30 - clusterMetrics.running_pods}
            </div>
            <div className="font-mono text-xs text-gray-400">AVAILABLE SLOTS</div>
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
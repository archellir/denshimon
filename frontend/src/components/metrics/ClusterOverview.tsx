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
} from 'recharts';
import { format } from 'date-fns';
import useWebSocketMetricsStore from '@stores/webSocketMetricsStore';
import ResourceCharts from '@components/metrics/ResourceCharts';
import HealthDashboard from '@components/metrics/HealthDashboard';
import { ChartTooltipProps, PieChartTooltipProps } from '@/types/common';

interface ClusterOverviewProps {
  timeRange?: string;
}

const ClusterOverview: FC<ClusterOverviewProps> = ({ timeRange = TimeRange.ONE_HOUR }) => {
  const { clusterMetrics, metricsHistory, isLoadingHistory, fetchClusterMetrics } = useWebSocketMetricsStore();

  // Fetch initial cluster metrics only (history is fetched by Dashboard)
  useEffect(() => {
    fetchClusterMetrics().catch(error => {
      console.error('Error fetching cluster metrics:', error);
    });
  }, [fetchClusterMetrics]);


  // Format chart data
  const chartData = useMemo(() => {
    if (!metricsHistory || !metricsHistory.cpu || !Array.isArray(metricsHistory.cpu)) {
      return [];
    }

    try {
      const data = metricsHistory.cpu.map((cpuPoint, index) => {
        if (!cpuPoint || !cpuPoint.timestamp || typeof cpuPoint.value !== 'number') {
          return null;
        }
        
        return {
          time: format(new Date(cpuPoint.timestamp), 'HH:mm'),
          cpu: cpuPoint.value || 0,
          memory: metricsHistory.memory?.[index]?.value || 0,
          storage: metricsHistory.storage?.[index]?.value || 0,
          pods: metricsHistory.pods?.[index]?.value || 0,
          nodes: metricsHistory.nodes?.[index]?.value || 0,
        };
      }).filter(Boolean); // Remove null entries
      
      return data;
    } catch (error) {
      console.error('Error formatting chart data:', error);
      return [];
    }
  }, [metricsHistory]);

  // Pod status data for pie chart
  const podStatusData = useMemo(() => {
    if (!clusterMetrics) return [];

    return [
      { name: 'RUNNING', value: clusterMetrics.running_pods, color: '#00FF00' },
      { name: 'PENDING', value: clusterMetrics.pending_pods, color: '#FFFF00' },
      { name: 'FAILED', value: clusterMetrics.failed_pods, color: '#FF0000' },
    ].filter(item => item.value > 0);
  }, [clusterMetrics]);


  const CustomTooltip = ({ active, payload, label }: ChartTooltipProps) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-black border border-white p-2 font-mono text-xs">
          <p className="text-white">{`Time: ${label}`}</p>
          {payload.map((entry, index: number) => (
            <p key={index} style={{ color: entry.color }}>
              {`${entry.name}: ${Number(entry.value).toFixed(1)}${
                entry.name === 'CPU' || entry.name === 'Memory' ? '%' : ''
              }`}
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

  // Show skeleton when either clusterMetrics or metricsHistory are not available
  const isLoading = !clusterMetrics || !metricsHistory || !metricsHistory.cpu || !Array.isArray(metricsHistory.cpu);

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Resource Usage Over Time Skeleton */}
        <div className="border border-white p-4 h-96">
          <div className="h-4 bg-white/10 animate-pulse rounded w-48 mb-4" />
          <div className="h-80 bg-white/5 animate-pulse rounded flex items-end justify-around p-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div 
                key={i} 
                className="bg-white/10 animate-pulse rounded w-8"
                style={{ height: `${Math.random() * 60 + 20}%` }}
              />
            ))}
          </div>
        </div>

        {/* Status & Capacity Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Workload Distribution Skeleton */}
          <div className="border border-white p-4">
            <div className="h-4 bg-white/10 animate-pulse rounded w-32 mb-4" />
            <div className="h-64 bg-white/5 animate-pulse rounded flex items-center justify-center">
              <div className="w-32 h-32 bg-white/10 animate-pulse rounded-full" />
            </div>
            <div className="mt-4 space-y-1">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-white/10 animate-pulse rounded mr-2" />
                    <div className="h-3 bg-white/10 animate-pulse rounded w-16" />
                  </div>
                  <div className="h-3 bg-white/10 animate-pulse rounded w-8" />
                </div>
              ))}
            </div>
          </div>
          
          {/* Capacity Status Skeleton */}
          <div className="border border-white p-4">
            <div className="h-4 bg-white/10 animate-pulse rounded w-32 mb-4" />
            <div className="space-y-4 mt-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i}>
                  <div className="flex justify-between items-center mb-2">
                    <div className="h-3 bg-white/10 animate-pulse rounded w-12" />
                    <div className="h-3 bg-white/10 animate-pulse rounded w-10" />
                  </div>
                  <div className="w-full bg-gray-800 border border-white h-3">
                    <div className="h-full bg-white/10 animate-pulse rounded" style={{ width: `${Math.random() * 80 + 20}%` }} />
                  </div>
                  <div className="h-3 bg-white/10 animate-pulse rounded w-24 mt-1" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  try {
    return (
      <div className="space-y-6">
        {/* Resource Usage Over Time */}
        <div className="border border-white p-4 h-96">
          <h3 className="font-mono text-sm mb-4">RESOURCE USAGE OVER TIME</h3>
          <div className="h-80">
            {chartData.length === 0 ? (
              <div className="flex items-center justify-center h-full border border-yellow-400">
                <span className="font-mono text-sm text-yellow-400">{UI_MESSAGES.CHART_NO_DATA}</span>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} key={`chart-${timeRange}`} margin={{ top: 5, right: 0, left: -35, bottom: 5 }}>
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
                    tickFormatter={(value) => `${value}%`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="cpu"
                    stackId="1"
                    stroke="#00FF00"
                    fill="#00FF0020"
                    strokeWidth={1}
                  />
                  <Area
                    type="monotone"
                    dataKey="memory"
                    stackId="2"
                    stroke="#FFFF00"
                    fill="#FFFF0020"
                    strokeWidth={1}
                  />
                  <Area
                    type="monotone"
                    dataKey="storage"
                    stackId="3"
                    stroke="#00FFFF"
                    fill="#00FFFF20"
                    strokeWidth={1}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Status & Capacity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pod Status */}
          <div className="border border-white p-4">
            <h3 className="font-mono text-sm mb-4">WORKLOAD DISTRIBUTION</h3>
            <div className="h-64">
              {podStatusData.length > 0 ? (
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
              ) : (
                <div className="flex items-center justify-center h-full border border-yellow-400">
                  <span className="font-mono text-sm text-yellow-400">NO POD DATA AVAILABLE</span>
                </div>
              )}
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

          {/* Capacity Status */}
          <div className="border border-white p-4">
            <h3 className="font-mono text-sm mb-4">CAPACITY STATUS</h3>
            <div className="space-y-4 mt-6">
              {/* CPU Capacity */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="font-mono text-xs">CPU</span>
                  <span className="font-mono text-xs">{clusterMetrics.cpu_usage.usage_percent.toFixed(0)}%</span>
                </div>
                <div className="w-full bg-gray-800 border border-white h-3">
                  <div 
                    className="h-full bg-green-400"
                    style={{ width: `${Math.min(clusterMetrics.cpu_usage.usage_percent, 100)}%` }}
                  />
                </div>
                <div className="text-xs font-mono opacity-60 mt-1">
                  {(8 - (8 * clusterMetrics.cpu_usage.usage_percent / 100)).toFixed(1)} cores available
                </div>
              </div>
              
              {/* Memory Capacity */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="font-mono text-xs">MEMORY</span>
                  <span className="font-mono text-xs">{clusterMetrics.memory_usage.usage_percent.toFixed(0)}%</span>
                </div>
                <div className="w-full bg-gray-800 border border-white h-3">
                  <div 
                    className="h-full bg-yellow-400"
                    style={{ width: `${Math.min(clusterMetrics.memory_usage.usage_percent, 100)}%` }}
                  />
                </div>
                <div className="text-xs font-mono opacity-60 mt-1">
                  {(16 - (16 * clusterMetrics.memory_usage.usage_percent / 100)).toFixed(1)}GB available
                </div>
              </div>

              {/* Pod Capacity */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="font-mono text-xs">PODS</span>
                  <span className="font-mono text-xs">{clusterMetrics.running_pods}/{clusterMetrics.total_pods}</span>
                </div>
                <div className="w-full bg-gray-800 border border-white h-3">
                  <div 
                    className="h-full bg-cyan-400"
                    style={{ width: `${(clusterMetrics.running_pods / clusterMetrics.total_pods) * 100}%` }}
                  />
                </div>
                <div className="text-xs font-mono opacity-60 mt-1">
                  {clusterMetrics.total_pods - clusterMetrics.running_pods} slots available
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error('ClusterOverview render error:', error);
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

export default ClusterOverview;
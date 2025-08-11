import { useState, useMemo, useEffect } from 'react';
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
  BarChart,
  Bar,
  Tooltip,
} from 'recharts';
import { format } from 'date-fns';
import useWebSocketMetricsStore from '@stores/webSocketMetricsStore';
import ResourceCharts from '@components/metrics/ResourceCharts';

interface ClusterOverviewProps {
  timeRange?: string;
}

const ClusterOverview: FC<ClusterOverviewProps> = ({ timeRange = TimeRange.ONE_HOUR }) => {
  const { clusterMetrics, metricsHistory, isLoadingHistory, fetchMetricsHistory, fetchClusterMetrics } = useWebSocketMetricsStore();

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

  // Node status data
  const nodeStatusData = useMemo(() => {
    if (!clusterMetrics) return [];

    const notReady = clusterMetrics.total_nodes - clusterMetrics.ready_nodes;
    return [
      { name: 'READY', value: clusterMetrics.ready_nodes, color: '#00FF00' },
      ...(notReady > 0 ? [{ name: 'NOT READY', value: notReady, color: '#FF0000' }] : []),
    ];
  }, [clusterMetrics]);

  // Resource utilization data from cluster metrics
  const resourceData = useMemo(() => {
    if (!clusterMetrics) return [];

    return [
      {
        name: 'CPU',
        usage: Math.round(clusterMetrics.cpu_usage.usage_percent),
        available: Math.round(100 - clusterMetrics.cpu_usage.usage_percent),
      },
      {
        name: 'Memory', 
        usage: Math.round(clusterMetrics.memory_usage.usage_percent),
        available: Math.round(100 - clusterMetrics.memory_usage.usage_percent),
      },
      {
        name: 'Storage',
        usage: Math.round(clusterMetrics.storage_usage.usage_percent),
        available: Math.round(100 - clusterMetrics.storage_usage.usage_percent),
      },
    ];
  }, [clusterMetrics]);
  

  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: any[]; label?: string }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-black border border-white p-2 font-mono text-xs">
          <p className="text-white">{`Time: ${label}`}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }}>
              {`${entry.name}: ${entry.value.toFixed(1)}${
                entry.name === 'CPU' || entry.name === 'Memory' ? '%' : ''
              }`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const CustomResourceTooltip = ({ active, payload, label }: { active?: boolean; payload?: any[]; label?: string }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-black border border-white p-2 font-mono text-xs">
          <p className="text-white">{`Resource: ${label}`}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }}>
              {`${entry.name}: ${entry.value.toFixed(1)}%`}
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

  // Error boundary fallback
  if (!clusterMetrics) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-2xl font-mono mb-2">{UI_MESSAGES.LOADING}</div>
          <div className="text-sm font-mono opacity-60">{UI_MESSAGES.LOADING_METRICS}</div>
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
            {isLoadingHistory ? (
              <div className="flex items-center justify-center h-full">
                <span className="font-mono text-sm">{UI_MESSAGES.LOADING_HISTORY}</span>
              </div>
            ) : chartData.length === 0 ? (
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

      {/* Status Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pod Status */}
        <div className="border border-white p-4">
          <h3 className="font-mono text-sm mb-4">POD STATUS DISTRIBUTION</h3>
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

        {/* Node Status */}
        <div className="border border-white p-4">
          <h3 className="font-mono text-sm mb-4">NODE STATUS DISTRIBUTION</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={nodeStatusData}
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  fill="#8884d8"
                  dataKey="value"
                  stroke="#FFFFFF"
                  strokeWidth={2}
                >
                  {nodeStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomPieTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 space-y-1">
            {nodeStatusData.map((entry) => (
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

      {/* Detailed Resource Charts */}
      <ResourceCharts />
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
import { useMemo } from 'react';
import type { FC } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';
import { format } from 'date-fns';
import useWebSocketMetricsStore from '@stores/webSocketMetricsStore';
import { ChartTooltipProps } from '@/types';

interface ResourceChartsProps {
  timeRange?: string;
}

const ResourceCharts: FC<ResourceChartsProps> = ({ timeRange: _timeRange = '1h' }) => {
  const { clusterMetrics, metricsHistory, nodeMetrics } = useWebSocketMetricsStore();

  // Historical data for line charts
  const historicalData = useMemo(() => {
    if (!metricsHistory) return [];

    return metricsHistory.cpu.map((cpuPoint, index) => ({
      time: format(new Date(cpuPoint.timestamp), 'HH:mm'),
      timestamp: cpuPoint.timestamp,
      cpu: cpuPoint.value,
      memory: metricsHistory.memory[index]?.value || 0,
      pods: metricsHistory.pods[index]?.value || 0,
      nodes: metricsHistory.nodes[index]?.value || 0,
    }));
  }, [metricsHistory]);

  // Node resource distribution
  const nodeResourceData = useMemo(() => {
    if (!nodeMetrics || nodeMetrics.length === 0) return [];

    return nodeMetrics.map((node) => ({
      name: node.name, // Keep full name for display
      fullName: node.name,
      cpu: node.cpu_usage.usage_percent,
      memory: node.memory_usage.usage_percent,
      pods: node.pod_count,
    }));
  }, [nodeMetrics]);

  const CustomTooltip = ({ active, payload, label }: ChartTooltipProps) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-black border border-white p-2 font-mono text-xs">
          <p className="text-white mb-1">{`Time: ${label}`}</p>
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


  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };


  return (
    <div className="space-y-6">
      {/* Historical Trends */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* CPU/Memory Timeline */}
        <div className="border border-white p-4">
          <h3 className="font-mono text-sm mb-4">CPU & MEMORY TRENDS</h3>
          <div className="h-64">
            {historicalData.length === 0 ? (
              <div className="flex items-center justify-center h-full border border-yellow-400">
                <span className="font-mono text-sm text-yellow-400">NO CHART DATA AVAILABLE</span>
              </div>
            ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={historicalData}>
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
                  domain={[0, 100]}
                  tickFormatter={(value) => `${value}%`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  wrapperStyle={{ color: 'white', fontFamily: 'monospace', fontSize: '12px' }}
                />
                <Line
                  type="monotone"
                  dataKey="cpu"
                  stroke="#00FF00"
                  strokeWidth={2}
                  dot={false}
                  name="CPU"
                />
                <Line
                  type="monotone"
                  dataKey="memory"
                  stroke="#FFFF00"
                  strokeWidth={2}
                  dot={false}
                  name="Memory"
                />
              </LineChart>
            </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Pod Count Timeline */}
        <div className="border border-white p-4">
          <h3 className="font-mono text-sm mb-4">WORKLOAD TRENDS</h3>
          <div className="h-64">
            {historicalData.length === 0 ? (
              <div className="flex items-center justify-center h-full border border-yellow-400">
                <span className="font-mono text-sm text-yellow-400">NO CHART DATA AVAILABLE</span>
              </div>
            ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={historicalData}>
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
                  tickFormatter={(value) => `${value}`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  wrapperStyle={{ color: 'white', fontFamily: 'monospace', fontSize: '12px' }}
                />
                <Line
                  type="monotone"
                  dataKey="pods"
                  stroke="#00FFFF"
                  strokeWidth={2}
                  dot={false}
                  name="Pods"
                />
              </LineChart>
            </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>


      {/* Resource Summary */}
      {clusterMetrics && (
        <div className="border border-white p-4">
          <h3 className="font-mono text-sm mb-4">DEPLOYMENT CAPACITY</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Current State */}
            <div>
              <h4 className="font-mono text-xs mb-3 opacity-60">CURRENT USAGE</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-mono text-xs">CPU</span>
                  <span className="font-mono text-sm text-green-400">{clusterMetrics.cpu_usage.usage_percent.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-mono text-xs">Memory</span>
                  <span className="font-mono text-sm text-yellow-400">{clusterMetrics.memory_usage.usage_percent.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-mono text-xs">Pod Count</span>
                  <span className="font-mono text-sm text-cyan-400">{clusterMetrics.running_pods}</span>
                </div>
              </div>
            </div>
            
            {/* Available Capacity */}
            <div>
              <h4 className="font-mono text-xs mb-3 opacity-60">AVAILABLE CAPACITY</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-mono text-xs">CPU Cores</span>
                  <span className="font-mono text-sm">{((100 - clusterMetrics.cpu_usage.usage_percent) * 8 / 100).toFixed(1)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-mono text-xs">Memory</span>
                  <span className="font-mono text-sm">{((100 - clusterMetrics.memory_usage.usage_percent) * 16 / 100).toFixed(1)}GB</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-mono text-xs">Pod Slots</span>
                  <span className="font-mono text-sm">{Math.max(0, clusterMetrics.total_pods - clusterMetrics.running_pods)}</span>
                </div>
              </div>
            </div>
            
            {/* Deployment Capacity */}
            <div>
              <h4 className="font-mono text-xs mb-3 opacity-60">NEW DEPLOYMENTS</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-mono text-xs">Small Apps</span>
                  <span className="font-mono text-sm text-green-400">~{Math.floor((100 - clusterMetrics.cpu_usage.usage_percent) / 10)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-mono text-xs">Medium Apps</span>
                  <span className="font-mono text-sm text-yellow-400">~{Math.floor((100 - clusterMetrics.cpu_usage.usage_percent) / 25)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-mono text-xs">Large Apps</span>
                  <span className="font-mono text-sm text-red-400">~{Math.floor((100 - clusterMetrics.cpu_usage.usage_percent) / 50)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Resource Summary Table */}
      {clusterMetrics && (
        <div className="border border-white">
          <h3 className="font-mono text-sm p-4 border-b border-white">RESOURCE SUMMARY</h3>
          <div className="overflow-x-auto">
            <table className="w-full font-mono text-xs">
              <thead>
                <tr className="border-b border-white">
                  <th className="text-left p-3">RESOURCE</th>
                  <th className="text-left p-3">USED</th>
                  <th className="text-left p-3">TOTAL</th>
                  <th className="text-left p-3">AVAILABLE</th>
                  <th className="text-left p-3">USAGE %</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-white">
                  <td className="p-3">CPU</td>
                  <td className="p-3">{clusterMetrics.cpu_usage.used}m</td>
                  <td className="p-3">{clusterMetrics.cpu_usage.total}m</td>
                  <td className="p-3">{clusterMetrics.cpu_usage.available}m</td>
                  <td className="p-3">
                    <span
                      className={
                        clusterMetrics.cpu_usage.usage_percent > 80
                          ? 'text-red-400'
                          : clusterMetrics.cpu_usage.usage_percent > 60
                          ? 'text-yellow-400'
                          : 'text-green-400'
                      }
                    >
                      {clusterMetrics.cpu_usage.usage_percent.toFixed(1)}%
                    </span>
                  </td>
                </tr>
                <tr className="border-b border-white">
                  <td className="p-3">Memory</td>
                  <td className="p-3">{formatBytes(clusterMetrics.memory_usage.used)}</td>
                  <td className="p-3">{formatBytes(clusterMetrics.memory_usage.total)}</td>
                  <td className="p-3">{formatBytes(clusterMetrics.memory_usage.available)}</td>
                  <td className="p-3">
                    <span
                      className={
                        clusterMetrics.memory_usage.usage_percent > 80
                          ? 'text-red-400'
                          : clusterMetrics.memory_usage.usage_percent > 60
                          ? 'text-yellow-400'
                          : 'text-green-400'
                      }
                    >
                      {clusterMetrics.memory_usage.usage_percent.toFixed(1)}%
                    </span>
                  </td>
                </tr>
                <tr>
                  <td className="p-3">Storage</td>
                  <td className="p-3">{formatBytes(clusterMetrics.storage_usage.used)}</td>
                  <td className="p-3">{formatBytes(clusterMetrics.storage_usage.total)}</td>
                  <td className="p-3">{formatBytes(clusterMetrics.storage_usage.available)}</td>
                  <td className="p-3">
                    <span
                      className={
                        clusterMetrics.storage_usage.usage_percent > 80
                          ? 'text-red-400'
                          : clusterMetrics.storage_usage.usage_percent > 60
                          ? 'text-yellow-400'
                          : 'text-green-400'
                      }
                    >
                      {clusterMetrics.storage_usage.usage_percent.toFixed(1)}%
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResourceCharts;
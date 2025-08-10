import { useMemo } from 'react';
import type { FC } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  RadialBarChart,
  RadialBar,
  Legend,
} from 'recharts';
import { format } from 'date-fns';
import useMetricsStore from '../../stores/metricsStore';

const ResourceCharts: FC = () => {
  const { clusterMetrics, metricsHistory, nodeMetrics } = useMetricsStore();

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

  // Resource usage data for radial charts
  const resourceRadialData = useMemo(() => {
    if (!clusterMetrics) return [];

    return [
      {
        name: 'CPU',
        usage: clusterMetrics.cpu_usage.usage_percent,
        fill: '#00FF00',
      },
      {
        name: 'Memory',
        usage: clusterMetrics.memory_usage.usage_percent,
        fill: '#FFFF00',
      },
      {
        name: 'Storage',
        usage: clusterMetrics.storage_usage.usage_percent,
        fill: '#FF0000',
      },
    ];
  }, [clusterMetrics]);

  // Node resource distribution
  const nodeResourceData = useMemo(() => {
    if (!nodeMetrics || nodeMetrics.length === 0) return [];

    return nodeMetrics.map((node) => ({
      name: node.name.length > 10 ? `${node.name.substring(0, 10)}...` : node.name,
      fullName: node.name,
      cpu: node.cpu_usage.usage_percent,
      memory: node.memory_usage.usage_percent,
      pods: node.pod_count,
    }));
  }, [nodeMetrics]);

  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: any[]; label?: string }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-black border border-white p-2 font-mono text-xs">
          <p className="text-white mb-1">{`Time: ${label}`}</p>
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

  const CustomNodeTooltip = ({ active, payload }: { active?: boolean; payload?: any[] }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-black border border-white p-2 font-mono text-xs">
          <p className="text-white mb-1">{`Node: ${data.fullName}`}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }}>
              {`${entry.name}: ${entry.value.toFixed(1)}${
                entry.name === 'CPU' || entry.name === 'Memory' ? '%' : entry.name === 'Pods' ? ' pods' : ''
              }`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const CustomRadialTooltip = ({ active, payload }: { active?: boolean; payload?: any[] }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-black border border-white p-2 font-mono text-xs">
          <p style={{ color: payload[0].fill }}>
            {`${payload[0].name}: ${payload[0].value.toFixed(1)}%`}
          </p>
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
      <h2 className="text-lg font-mono border-b border-white pb-2">RESOURCE ANALYTICS</h2>

      {/* Historical Trends */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* CPU/Memory Timeline */}
        <div className="border border-white p-4">
          <h3 className="font-mono text-sm mb-4">CPU & MEMORY TRENDS</h3>
          <div className="h-64">
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
                />
                <Tooltip content={<CustomTooltip />} />
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
          </div>
        </div>

        {/* Pod/Node Count Timeline */}
        <div className="border border-white p-4">
          <h3 className="font-mono text-sm mb-4">WORKLOAD TRENDS</h3>
          <div className="h-64">
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
                />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="pods"
                  stroke="#00FFFF"
                  strokeWidth={2}
                  dot={false}
                  name="Pods"
                />
                <Line
                  type="monotone"
                  dataKey="nodes"
                  stroke="#FF00FF"
                  strokeWidth={2}
                  dot={false}
                  name="Nodes"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Current Usage Radials */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {resourceRadialData.map((resource) => (
          <div key={resource.name} className="border border-white p-4">
            <h3 className="font-mono text-sm mb-4">{resource.name} UTILIZATION</h3>
            <div className="h-48 flex flex-col items-center">
              <ResponsiveContainer width="100%" height="80%">
                <RadialBarChart
                  cx="50%"
                  cy="50%"
                  innerRadius="60%"
                  outerRadius="90%"
                  data={[resource]}
                  startAngle={90}
                  endAngle={-270}
                >
                  <RadialBar
                    dataKey="usage"
                    fill={resource.fill}
                    stroke="white"
                    strokeWidth={1}
                    background={{ fill: '#333333', stroke: 'white', strokeWidth: 1 }}
                  />
                  <Tooltip content={<CustomRadialTooltip />} />
                </RadialBarChart>
              </ResponsiveContainer>
              <div className="text-center font-mono">
                <div className="text-lg" style={{ color: resource.fill }}>
                  {resource.usage.toFixed(1)}%
                </div>
                <div className="text-xs opacity-60">USED</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Node Resource Distribution */}
      {nodeResourceData.length > 0 && (
        <div className="border border-white p-4">
          <h3 className="font-mono text-sm mb-4">NODE RESOURCE DISTRIBUTION</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={nodeResourceData}>
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fontFamily: 'monospace', fill: 'white' }}
                  angle={-45}
                  textAnchor="end"
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fontFamily: 'monospace', fill: 'white' }}
                />
                <Tooltip content={<CustomNodeTooltip />} />
                <Line
                  type="monotone"
                  dataKey="cpu"
                  stroke="#00FF00"
                  strokeWidth={2}
                  dot={{ fill: '#00FF00', strokeWidth: 1, r: 3 }}
                  name="CPU"
                />
                <Line
                  type="monotone"
                  dataKey="memory"
                  stroke="#FFFF00"
                  strokeWidth={2}
                  dot={{ fill: '#FFFF00', strokeWidth: 1, r: 3 }}
                  name="Memory"
                />
              </LineChart>
            </ResponsiveContainer>
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
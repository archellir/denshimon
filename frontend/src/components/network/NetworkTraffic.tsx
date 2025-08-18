import { useState, useMemo, useEffect } from 'react';
import type { FC } from 'react';
import { UI_MESSAGES, TimeRange, Status } from '@constants';
import { Activity } from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { format } from 'date-fns';
import { generateNetworkMetrics } from '@mocks/network/traffic';
import type { NetworkMetrics } from '@/types/network';
import SkeletonLoader from '@components/common/SkeletonLoader';
import StatCard from '@components/common/StatCard';
import { ChartTooltipProps, PieChartTooltipProps } from '@/types';

interface NetworkTrafficProps {
  timeRange?: string;
}

const NetworkTraffic: FC<NetworkTrafficProps> = ({ timeRange = TimeRange.ONE_HOUR }) => {
  const [networkData, setNetworkData] = useState<NetworkMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch network data when timeRange changes
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 300));
        const data = generateNetworkMetrics(timeRange);
        setNetworkData(data);
      } catch (error) {
        // Error fetching network data
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [timeRange]);

  // Format traffic data for charts
  const trafficChartData = useMemo(() => {
    if (!networkData?.trafficData) return [];

    return networkData.trafficData.ingress.map((point, index) => ({
      time: format(new Date(point.timestamp), 'HH:mm'),
      timestamp: point.timestamp,
      ingress: Math.round(point.value / (1024 * 1024)), // Convert to MB/s
      egress: Math.round((networkData.trafficData.egress[index]?.value || 0) / (1024 * 1024)),
      total: Math.round((networkData.trafficData.total[index]?.value || 0) / (1024 * 1024))
    }));
  }, [networkData]);

  // Format bytes to human readable format
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // Format bandwidth for display
  const formatBandwidth = (bytesPerSecond: number): string => {
    return formatBytes(bytesPerSecond) + '/s';
  };


  // Custom tooltip for traffic chart
  const CustomTrafficTooltip = ({ active, payload, label }: ChartTooltipProps) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-black border border-white p-2 font-mono text-xs">
          <p className="text-white mb-1">{`Time: ${label}`}</p>
          {payload.map((entry, index: number) => (
            <p key={index} style={{ color: entry.color }}>
              {`${entry.name}: ${entry.value} MB/s`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Custom tooltip for protocol pie chart
  const CustomProtocolTooltip = ({ active, payload }: PieChartTooltipProps) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-black border border-white p-2 font-mono text-xs">
          <p style={{ color: payload[0].payload.color as string }}>
            {`${payload[0].name}: ${formatBytes(payload[0].payload.bytes as number)}`}
          </p>
          <p className="text-white">
            {`${payload[0].payload.percentage}%`}
          </p>
        </div>
      );
    }
    return null;
  };

  if (isLoading && !networkData) {
    return <SkeletonLoader variant="infra-network" />;
  }

  return (
    <div className="space-y-6">

      {/* Current Bandwidth Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          label="CURRENT INGRESS"
          value={networkData ? formatBandwidth(networkData.totalBandwidth.ingress) : '--'}
          icon={Activity}
          status={Status.INFO}
          variant="network"
        />
        
        <StatCard
          label="CURRENT EGRESS"
          value={networkData ? formatBandwidth(networkData.totalBandwidth.egress) : '--'}
          icon={Activity}
          status={Status.INFO}
          variant="network"
        />
        
        <StatCard
          label="PEAK BANDWIDTH"
          value={networkData ? formatBandwidth(networkData.totalBandwidth.peak) : '--'}
          icon={Activity}
          status={Status.INFO}
          variant="network"
        />
        
        <StatCard
          label="ACTIVE CONNECTIONS"
          value={networkData ? networkData.connectionCount.active?.toString() || '--' : '--'}
          icon={Activity}
          status={Status.INFO}
          variant="network"
        />
      </div>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Bandwidth Over Time */}
        <div className="xl:col-span-2 border border-white p-4">
          <h3 className="font-mono text-sm mb-4">BANDWIDTH OVER TIME</h3>
          <div className="h-80">
            {isLoading ? (
              <div className="h-full">
                <SkeletonLoader variant="chart" count={1} />
              </div>
            ) : trafficChartData.length === 0 ? (
              <div className="flex items-center justify-center h-full border border-yellow-400">
                <span className="font-mono text-sm text-yellow-400">{UI_MESSAGES.NETWORK_NO_DATA}</span>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trafficChartData} margin={{ top: 5, right: 0, left: -20, bottom: 5 }}>
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
                    tickFormatter={(value) => `${value}MB/s`}
                  />
                  <Tooltip content={<CustomTrafficTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="ingress"
                    stackId="1"
                    stroke="#00FF00"
                    fill="#00FF0020"
                    strokeWidth={2}
                    name="Ingress"
                  />
                  <Area
                    type="monotone"
                    dataKey="egress"
                    stackId="2"
                    stroke="#00FFFF"
                    fill="#00FFFF20"
                    strokeWidth={2}
                    name="Egress"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Protocol Breakdown */}
        <div className="border border-white p-4">
          <h3 className="font-mono text-sm mb-4">PROTOCOL BREAKDOWN</h3>
          <div className="h-80">
            {networkData && networkData.protocolBreakdown.length > 0 ? (
              <>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={networkData.protocolBreakdown}
                        cx="50%"
                        cy="50%"
                        outerRadius={70}
                        fill="#8884d8"
                        dataKey="percentage"
                        stroke="#FFFFFF"
                        strokeWidth={1}
                      >
                        {networkData.protocolBreakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomProtocolTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2">
                  {networkData.protocolBreakdown.map((protocol) => (
                    <div key={protocol.protocol} className="flex items-center justify-between font-mono text-xs">
                      <div className="flex items-center">
                        <div
                          className="w-3 h-3 border border-white mr-2"
                          style={{ backgroundColor: protocol.color }}
                        />
                        <span>{protocol.protocol}</span>
                      </div>
                      <span>{protocol.percentage}%</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full border border-yellow-400">
                <span className="font-mono text-sm text-yellow-400">{UI_MESSAGES.PROTOCOL_NO_DATA}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Top Talkers */}
      <div className="border border-white p-4">
        <h3 className="font-mono text-sm mb-4">TOP NETWORK TALKERS</h3>
        {networkData && networkData.topTalkers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full font-mono text-xs">
              <thead>
                <tr className="border-b border-white">
                  <th className="text-left p-2">RANK</th>
                  <th className="text-left p-2">POD NAME</th>
                  <th className="text-left p-2">NAMESPACE</th>
                  <th className="text-left p-2">INGRESS</th>
                  <th className="text-left p-2">EGRESS</th>
                  <th className="text-left p-2">TOTAL</th>
                  <th className="text-left p-2">CONNECTIONS</th>
                </tr>
              </thead>
              <tbody>
                {networkData.topTalkers.slice(0, 8).map((talker, _index) => (
                  <tr key={talker.podName} className="border-b border-white hover:bg-white hover:bg-opacity-5">
                    <td className="p-2">#{talker.rank}</td>
                    <td className="p-2 text-green-400">{talker.podName}</td>
                    <td className="p-2 text-cyan-400">{talker.namespace}</td>
                    <td className="p-2">{formatBytes(talker.ingressBytes)}</td>
                    <td className="p-2">{formatBytes(talker.egressBytes)}</td>
                    <td className="p-2 text-yellow-400">{formatBytes(talker.totalBytes)}</td>
                    <td className="p-2">{talker.connections}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex items-center justify-center h-32 border border-yellow-400">
            <span className="font-mono text-sm text-yellow-400">{UI_MESSAGES.TOP_TALKERS_NO_DATA}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default NetworkTraffic;
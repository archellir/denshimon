import { useState, useMemo, useEffect } from 'react';
import type { FC } from 'react';
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
import useMetricsStore from '@stores/metricsStore';
import ResourceCharts from '@components/metrics/ResourceCharts';

const ClusterOverview: FC = () => {
  const [timeRange, setTimeRange] = useState<string>('1h');
  const { clusterMetrics, metricsHistory, isLoadingHistory, fetchMetricsHistory, fetchClusterMetrics } = useMetricsStore();

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        await fetchClusterMetrics();
        await fetchMetricsHistory(timeRange);
      } catch (error) {
        console.error('Error fetching initial data:', error);
      }
    };
    
    fetchData();
  }, [timeRange]);

  // Handle time range change
  const handleTimeRangeChange = (newRange: string) => {
    try {
      setTimeRange(newRange);
    } catch (error) {
      console.error('Error changing time range:', error);
    }
  };

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

  // Resource utilization data for bar chart - HARDCODED FOR TESTING
  const resourceData = [
    {
      name: 'CPU',
      usage: 75,
      available: 25,
    },
    {
      name: 'Memory', 
      usage: 60,
      available: 40,
    },
    {
      name: 'Storage',
      usage: 30,
      available: 70,
    },
  ];
  

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
          <div className="text-2xl font-mono mb-2">LOADING...</div>
          <div className="text-sm font-mono opacity-60">Fetching cluster metrics</div>
        </div>
      </div>
    );
  }

  try {
    return (
    <div className="space-y-6">
      {/* Time Range Selector */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-mono">CLUSTER OVERVIEW</h2>
        <div className="flex space-x-0 border border-white">
          {['15m', '1h', '6h', '24h'].map((range) => (
            <button
              key={range}
              onClick={() => handleTimeRangeChange(range)}
              disabled={isLoadingHistory}
              className={`px-3 py-1 border-r border-white last:border-r-0 font-mono text-xs transition-colors disabled:opacity-50 ${
                timeRange === range
                  ? 'bg-white text-black'
                  : 'bg-black text-white hover:bg-white hover:text-black'
              }`}
            >
              {range.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Resource Usage Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Historical Metrics */}
        <div className="border border-white p-4 h-96">
          <h3 className="font-mono text-sm mb-4">RESOURCE USAGE OVER TIME</h3>
          <div className="h-80">
            {isLoadingHistory ? (
              <div className="flex items-center justify-center h-full">
                <span className="font-mono text-sm">LOADING HISTORY...</span>
              </div>
            ) : chartData.length === 0 ? (
              <div className="flex items-center justify-center h-full border border-yellow-400">
                <span className="font-mono text-sm text-yellow-400">NO CHART DATA AVAILABLE</span>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} key={`chart-${timeRange}-${chartData.length}`} margin={{ top: 5, right: 0, left: -35, bottom: 5 }}>
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
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Current Resource Utilization */}
        <div className="border border-white p-4 h-96">
          <h3 className="font-mono text-sm mb-4">CURRENT RESOURCE UTILIZATION</h3>
          <div className="space-y-6 h-80 flex flex-col justify-center">
            {resourceData.map((resource, index) => (
              <div key={resource.name} className="space-y-2">
                <div className="flex justify-between items-center font-mono text-sm">
                  <span className="text-white">{resource.name}</span>
                </div>
                <div className="w-full h-8 bg-black border border-white relative overflow-hidden">
                  {/* Background grid pattern */}
                  <div className="absolute inset-0 opacity-20">
                    {[...Array(10)].map((_, i) => (
                      <div 
                        key={i}
                        className="absolute top-0 bottom-0 w-px bg-white"
                        style={{ left: `${(i + 1) * 10}%` }}
                      />
                    ))}
                  </div>
                  
                  {/* Usage bar with animation */}
                  <div 
                    className={`h-full transition-all duration-1000 ease-out relative ${
                      resource.usage > 80 ? 'bg-red-400' :
                      resource.usage > 60 ? 'bg-yellow-400' :
                      'bg-green-400'
                    }`}
                    style={{ 
                      width: `${resource.usage}%`,
                      animationDelay: `${index * 200}ms`
                    }}
                  >
                    {/* Scanning line effect */}
                    <div className="absolute top-0 right-0 bottom-0 w-px bg-white opacity-60 animate-pulse" />
                    
                    {/* Percentage text inside bar */}
                    {resource.usage > 15 && (
                      <span className="absolute right-2 top-1/2 transform -translate-y-1/2 font-mono text-xs text-black font-bold">
                        {resource.usage}%
                      </span>
                    )}
                  </div>
                  
                  {/* Matrix-style corner brackets */}
                  <div className="absolute top-0 left-0 w-2 h-2 border-l-2 border-t-2 border-white" />
                  <div className="absolute top-0 right-0 w-2 h-2 border-r-2 border-t-2 border-white" />
                  <div className="absolute bottom-0 left-0 w-2 h-2 border-l-2 border-b-2 border-white" />
                  <div className="absolute bottom-0 right-0 w-2 h-2 border-r-2 border-b-2 border-white" />
                </div>
                
                {/* Status indicator */}
                <div className="flex items-center space-x-2 text-xs font-mono opacity-60">
                  <div className={`w-2 h-2 ${
                    resource.usage > 80 ? 'bg-red-400' :
                    resource.usage > 60 ? 'bg-yellow-400' :
                    'bg-green-400'
                  }`} />
                  <span>
                    {resource.usage > 80 ? 'CRITICAL' :
                     resource.usage > 60 ? 'WARNING' : 'NORMAL'}
                  </span>
                  <span>•</span>
                  <span>{(100 - resource.usage).toFixed(0)}% AVAILABLE</span>
                </div>
              </div>
            ))}
          </div>
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
          <div className="text-xl font-mono mb-2 text-red-400">RENDER ERROR</div>
          <div className="text-sm font-mono opacity-60">Component failed to render</div>
          <div className="text-xs font-mono mt-2 text-gray-400">
            Check console for details
          </div>
        </div>
      </div>
    );
  }
};

export default ClusterOverview;
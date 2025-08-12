import { useState, useMemo, useEffect } from 'react';
import type { FC } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';
import { format } from 'date-fns';
import { 
  generatePodLifecycleMetrics, 
  generatePodLifecycleEvents,
  generateLifecycleTimelineEvents 
} from '@mocks/pods/lifecycle';
import type { 
  PodLifecycleMetrics, 
  PodLifecycleEvent, 
  LifecycleTimelineEvent 
} from '@/types/podLifecycle';

const PodLifecycle: FC = () => {
  const [timeRange, setTimeRange] = useState<string>('1h');
  const [activeView, setActiveView] = useState<string>('churn');
  const [lifecycleData, setLifecycleData] = useState<PodLifecycleMetrics | null>(null);
  const [lifecycleEvents, setLifecycleEvents] = useState<PodLifecycleEvent[]>([]);
  const [timelineEvents, setTimelineEvents] = useState<LifecycleTimelineEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch lifecycle data when timeRange changes
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 300));
        
        const metrics = generatePodLifecycleMetrics(timeRange);
        const events = generatePodLifecycleEvents(timeRange);
        const timeline = generateLifecycleTimelineEvents(timeRange);
        
        setLifecycleData(metrics);
        setLifecycleEvents(events);
        setTimelineEvents(timeline);
      } catch (error) {
        console.error('Error fetching lifecycle data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [timeRange]);

  // Format churn data for charts
  const churnChartData = useMemo(() => {
    if (!lifecycleData?.churnData) return [];

    return lifecycleData.churnData.map(point => ({
      time: format(new Date(point.timestamp), 'HH:mm'),
      timestamp: point.timestamp,
      created: point.created,
      terminated: point.terminated,
      failed: point.failed,
      netChange: point.netChange
    }));
  }, [lifecycleData]);

  // Format scheduling data for charts
  const schedulingChartData = useMemo(() => {
    if (!lifecycleData?.schedulingMetrics) return [];

    return lifecycleData.schedulingMetrics.map(point => ({
      time: format(new Date(point.timestamp), 'HH:mm'),
      timestamp: point.timestamp,
      pendingPods: point.pendingPods,
      schedulingDelay: point.schedulingDelay,
      failures: point.schedulingFailures,
      nodeConstraints: point.nodeResourceConstraints
    }));
  }, [lifecycleData]);

  // Format time duration
  const formatDuration = (seconds: number): string => {
    if (seconds < 60) return `${Math.round(seconds)}s`;
    if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
    if (seconds < 86400) return `${Math.round(seconds / 3600)}h`;
    return `${Math.round(seconds / 86400)}d`;
  };

  // Format bytes
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // Get severity color
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-400 border-red-400 bg-red-900/20';
      case 'high': return 'text-orange-400 border-orange-400 bg-orange-900/20';
      case 'medium': return 'text-yellow-400 border-yellow-400 bg-yellow-900/20';
      case 'low': return 'text-green-400 border-green-400 bg-green-900/20';
      default: return 'text-white border-white bg-white/5';
    }
  };

  // Handle time range change
  const handleTimeRangeChange = (newRange: string) => {
    setTimeRange(newRange);
  };

  // Custom tooltips
  const CustomChurnTooltip = ({ active, payload, label }: { active?: boolean; payload?: any[]; label?: string }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-black border border-white p-2 font-mono text-xs">
          <p className="text-white mb-1">{`Time: ${label}`}</p>
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

  const CustomFailureTooltip = ({ active, payload }: { active?: boolean; payload?: any[] }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-black border border-white p-2 font-mono text-xs">
          <p style={{ color: payload[0].payload.color }}>
            {`${payload[0].name}: ${payload[0].value} (${payload[0].payload.percentage.toFixed(1)}%)`}
          </p>
          <p className="text-white text-xs mt-1">
            Trend: {payload[0].payload.trend}
          </p>
        </div>
      );
    }
    return null;
  };

  const views = [
    { id: 'churn', label: 'Pod Churn', icon: '📊' },
    { id: 'restarts', label: 'Restarts', icon: '🔄' },
    { id: 'scheduling', label: 'Scheduling', icon: '⏱️' },
    { id: 'failures', label: 'Failures', icon: '⚠️' },
    { id: 'images', label: 'Images', icon: '📦' },
    { id: 'timeline', label: 'Timeline', icon: '📅' }
  ];

  if (isLoading && !lifecycleData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-2xl font-mono mb-2">LOADING...</div>
          <div className="text-sm font-mono opacity-60">Analyzing pod lifecycle</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Time Range Selector */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-mono">POD LIFECYCLE ANALYTICS</h2>
        <div className="flex space-x-0 border border-white">
          {['15m', '1h', '6h', '24h'].map((range) => (
            <button
              key={range}
              onClick={() => handleTimeRangeChange(range)}
              disabled={isLoading}
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

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="border border-white p-4">
          <h3 className="font-mono text-xs mb-2 opacity-60">TOTAL EVENTS</h3>
          <div className="font-mono text-lg text-green-400">
            {lifecycleData?.totalEvents || '--'}
          </div>
        </div>
        <div className="border border-white p-4">
          <h3 className="font-mono text-xs mb-2 opacity-60">CRASH LOOP PODS</h3>
          <div className="font-mono text-lg text-red-400">
            {lifecycleData?.crashLoopPods || '--'}
          </div>
        </div>
        <div className="border border-white p-4">
          <h3 className="font-mono text-xs mb-2 opacity-60">PENDING PODS</h3>
          <div className="font-mono text-lg text-yellow-400">
            {lifecycleData?.pendingPods || '--'}
          </div>
        </div>
        <div className="border border-white p-4">
          <h3 className="font-mono text-xs mb-2 opacity-60">AVG LIFESPAN</h3>
          <div className="font-mono text-lg text-cyan-400">
            {lifecycleData ? formatDuration(lifecycleData.averagePodLifespan) : '--'}
          </div>
        </div>
      </div>

      {/* View Selector */}
      <div className="flex space-x-0 border border-white">
        {views.map((view) => (
          <button
            key={view.id}
            onClick={() => setActiveView(view.id)}
            className={`flex items-center space-x-2 px-4 py-2 border-r border-white last:border-r-0 font-mono text-xs transition-colors ${
              activeView === view.id
                ? 'bg-white text-black'
                : 'bg-black text-white hover:bg-white hover:text-black'
            }`}
          >
            <span>{view.icon}</span>
            <span>{view.label}</span>
          </button>
        ))}
      </div>

      {/* Content based on active view */}
      {activeView === 'churn' && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Pod Churn Chart */}
          <div className="xl:col-span-2 border border-white p-4">
            <h3 className="font-mono text-sm mb-4">POD CHURN RATE</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={churnChartData} margin={{ top: 5, right: 0, left: -20, bottom: 5 }}>
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
                  <Tooltip content={<CustomChurnTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="created"
                    stackId="1"
                    stroke="#00FF00"
                    fill="#00FF0020"
                    strokeWidth={2}
                    name="Created"
                  />
                  <Area
                    type="monotone"
                    dataKey="terminated"
                    stackId="2"
                    stroke="#00FFFF"
                    fill="#00FFFF20"
                    strokeWidth={2}
                    name="Terminated"
                  />
                  <Area
                    type="monotone"
                    dataKey="failed"
                    stackId="3"
                    stroke="#FF4444"
                    fill="#FF444420"
                    strokeWidth={2}
                    name="Failed"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Net Change Chart */}
          <div className="border border-white p-4">
            <h3 className="font-mono text-sm mb-4">NET POD CHANGE</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={churnChartData} margin={{ top: 5, right: 0, left: -20, bottom: 5 }}>
                  <XAxis
                    dataKey="time"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 9, fontFamily: 'monospace', fill: 'white' }}
                    angle={-45}
                    textAnchor="end"
                    height={40}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fontFamily: 'monospace', fill: 'white' }}
                  />
                  <Tooltip content={<CustomChurnTooltip />} />
                  <Bar
                    dataKey="netChange"
                    fill="#FFFF00"
                    name="Net Change"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {activeView === 'restarts' && (
        <div className="space-y-6">
          {/* Container Restart Patterns */}
          <div className="border border-white p-4">
            <h3 className="font-mono text-sm mb-4">CONTAINER RESTART PATTERNS</h3>
            <div className="overflow-x-auto">
              <table className="w-full font-mono text-xs">
                <thead>
                  <tr className="border-b border-white">
                    <th className="text-left p-2">POD NAME</th>
                    <th className="text-left p-2">NAMESPACE</th>
                    <th className="text-left p-2">CONTAINER</th>
                    <th className="text-left p-2">RESTARTS</th>
                    <th className="text-left p-2">STATUS</th>
                    <th className="text-left p-2">AVG UPTIME</th>
                    <th className="text-left p-2">LAST RESTART</th>
                  </tr>
                </thead>
                <tbody>
                  {lifecycleData?.restartPatterns.slice(0, 10).map((pattern, index) => (
                    <tr key={pattern.podName} className="border-b border-white hover:bg-white hover:bg-opacity-5">
                      <td className="p-2 text-green-400">{pattern.podName}</td>
                      <td className="p-2 text-cyan-400">{pattern.namespace}</td>
                      <td className="p-2">{pattern.containerName}</td>
                      <td className="p-2 text-yellow-400">{pattern.restartCount}</td>
                      <td className="p-2">
                        <span className={pattern.crashLoopBackOff ? 'text-red-400' : 'text-green-400'}>
                          {pattern.crashLoopBackOff ? 'CRASH LOOP' : 'STABLE'}
                        </span>
                      </td>
                      <td className="p-2">{formatDuration(pattern.averageUptime)}</td>
                      <td className="p-2 opacity-60">{format(new Date(pattern.lastRestartTime), 'HH:mm')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeView === 'scheduling' && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Scheduling Delay Chart */}
          <div className="border border-white p-4">
            <h3 className="font-mono text-sm mb-4">SCHEDULING DELAYS</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={schedulingChartData} margin={{ top: 5, right: 0, left: -20, bottom: 5 }}>
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
                    tickFormatter={(value) => `${value}s`}
                  />
                  <Tooltip content={<CustomChurnTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="schedulingDelay"
                    stroke="#FFFF00"
                    strokeWidth={2}
                    dot={false}
                    name="Delay (seconds)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Pending Pods */}
          <div className="border border-white p-4">
            <h3 className="font-mono text-sm mb-4">PENDING PODS</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={schedulingChartData} margin={{ top: 5, right: 0, left: -20, bottom: 5 }}>
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
                  <Tooltip content={<CustomChurnTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="pendingPods"
                    stroke="#FF8800"
                    fill="#FF880020"
                    strokeWidth={2}
                    name="Pending Pods"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {activeView === 'failures' && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Failure Breakdown Pie Chart */}
          <div className="border border-white p-4">
            <h3 className="font-mono text-sm mb-4">FAILURE BREAKDOWN</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={lifecycleData?.failureAnalysis || []}
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    fill="#8884d8"
                    dataKey="count"
                    stroke="#FFFFFF"
                    strokeWidth={1}
                  >
                    {lifecycleData?.failureAnalysis.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomFailureTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Failure Details */}
          <div className="xl:col-span-2 border border-white p-4">
            <h3 className="font-mono text-sm mb-4">FAILURE ANALYSIS</h3>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {lifecycleData?.failureAnalysis.map((failure, index) => (
                <div key={failure.reason} className="border border-white p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      <div
                        className="w-3 h-3 border border-white"
                        style={{ backgroundColor: failure.color }}
                      />
                      <span className="font-mono text-sm text-white">{failure.reason}</span>
                    </div>
                    <div className="flex items-center space-x-4">
                      <span className="font-mono text-xs text-yellow-400">{failure.count} occurrences</span>
                      <span className={`font-mono text-xs px-2 py-1 border ${
                        failure.trend === 'increasing' ? 'text-red-400 border-red-400' :
                        failure.trend === 'decreasing' ? 'text-green-400 border-green-400' :
                        'text-white border-white'
                      }`}>
                        {failure.trend.toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div className="text-xs font-mono opacity-60">
                    Affected namespaces: {failure.affectedNamespaces.join(', ')}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeView === 'images' && (
        <div className="border border-white p-4">
          <h3 className="font-mono text-sm mb-4">IMAGE PULL METRICS</h3>
          <div className="overflow-x-auto">
            <table className="w-full font-mono text-xs">
              <thead>
                <tr className="border-b border-white">
                  <th className="text-left p-2">IMAGE</th>
                  <th className="text-left p-2">REGISTRY</th>
                  <th className="text-left p-2">PULLS</th>
                  <th className="text-left p-2">AVG PULL TIME</th>
                  <th className="text-left p-2">FAILURE RATE</th>
                  <th className="text-left p-2">SIZE</th>
                  <th className="text-left p-2">LAST PULL</th>
                </tr>
              </thead>
              <tbody>
                {lifecycleData?.imagePullMetrics.map((image, index) => (
                  <tr key={image.imageName} className="border-b border-white hover:bg-white hover:bg-opacity-5">
                    <td className="p-2 text-green-400">{image.imageName}</td>
                    <td className="p-2 text-cyan-400">{image.registry}</td>
                    <td className="p-2">{image.pullCount}</td>
                    <td className="p-2">{formatDuration(image.averagePullTime)}</td>
                    <td className="p-2">
                      <span className={image.failureRate > 10 ? 'text-red-400' : image.failureRate > 5 ? 'text-yellow-400' : 'text-green-400'}>
                        {image.failureRate.toFixed(1)}%
                      </span>
                    </td>
                    <td className="p-2">{formatBytes(image.size)}</td>
                    <td className="p-2 opacity-60">{format(new Date(image.lastPullTime), 'HH:mm')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeView === 'timeline' && (
        <div className="space-y-4">
          <div className="border border-white p-4">
            <h3 className="font-mono text-sm mb-4">LIFECYCLE TIMELINE EVENTS</h3>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {timelineEvents.map((event, index) => (
                <div key={index} className={`p-3 border ${getSeverityColor(event.severity)}`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      <span className="font-mono text-xs">
                        {format(new Date(event.timestamp), 'HH:mm:ss')}
                      </span>
                      <span className="font-mono text-sm">{event.eventType.replace('_', ' ').toUpperCase()}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-xs">{event.affectedPods} pods</span>
                      {event.duration && (
                        <span className="font-mono text-xs opacity-60">
                          {formatDuration(event.duration)}
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="font-mono text-xs opacity-80">{event.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PodLifecycle;
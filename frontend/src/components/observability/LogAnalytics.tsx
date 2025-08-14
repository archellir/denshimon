import React, { useState, useEffect } from 'react';
import { TimeRange } from '@constants';

interface LogAnalyticsProps {
  timeRange?: string;
}
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { TrendingUp, AlertTriangle, Activity, Clock, Database, Server } from 'lucide-react';

interface LogMetrics {
  totalLogs: number;
  errorRate: number;
  warningRate: number;
  avgLogsPerMinute: number;
  topSources: { source: string; count: number; percentage: number }[];
  topNamespaces: { namespace: string; count: number; percentage: number }[];
  hourlyDistribution: { hour: number; errors: number; warnings: number; info: number; debug: number }[];
  severityTrend: { time: string; errors: number; warnings: number; info: number }[];
  responseTimeDistribution: { range: string; count: number }[];
  errorPatterns: { pattern: string; count: number; trend: 'up' | 'down' | 'stable' }[];
}

const LogAnalytics: React.FC<LogAnalyticsProps> = ({ timeRange = TimeRange.TWENTY_FOUR_HOURS }) => {
  const [metrics, setMetrics] = useState<LogMetrics | null>(null);
  const [selectedMetric, setSelectedMetric] = useState<'volume' | 'errors' | 'performance' | 'patterns'>('volume');

  useEffect(() => {
    generateMockMetrics();
  }, [timeRange]);

  const generateMockMetrics = () => {
    const totalLogs = Math.floor(Math.random() * 50000) + 25000;
    const errorCount = Math.floor(Math.random() * 2000) + 500;
    const warningCount = Math.floor(Math.random() * 5000) + 1500;

    const mockMetrics: LogMetrics = {
      totalLogs,
      errorRate: (errorCount / totalLogs) * 100,
      warningRate: (warningCount / totalLogs) * 100,
      avgLogsPerMinute: Math.floor(Math.random() * 100) + 50,

      topSources: [
        { source: 'kubernetes-api', count: 12453, percentage: 32.1 },
        { source: 'nginx-ingress', count: 9876, percentage: 25.4 },
        { source: 'application-api', count: 7234, percentage: 18.6 },
        { source: 'database-mysql', count: 5432, percentage: 14.0 },
        { source: 'redis-cache', count: 3876, percentage: 9.9 }
      ],

      topNamespaces: [
        { namespace: 'production', count: 18765, percentage: 48.3 },
        { namespace: 'staging', count: 8934, percentage: 23.0 },
        { namespace: 'monitoring', count: 6234, percentage: 16.0 },
        { namespace: 'kube-system', count: 3456, percentage: 8.9 },
        { namespace: 'default', count: 1456, percentage: 3.8 }
      ],

      hourlyDistribution: Array.from({ length: 24 }, (_, hour) => ({
        hour,
        errors: Math.floor(Math.random() * 50) + 10,
        warnings: Math.floor(Math.random() * 150) + 50,
        info: Math.floor(Math.random() * 800) + 200,
        debug: Math.floor(Math.random() * 300) + 100
      })),

      severityTrend: Array.from({ length: 48 }, (_, i) => ({
        time: `${i}:00`,
        errors: Math.floor(Math.random() * 30) + 5,
        warnings: Math.floor(Math.random() * 80) + 20,
        info: Math.floor(Math.random() * 200) + 50
      })),

      responseTimeDistribution: [
        { range: '0-50ms', count: 15234 },
        { range: '50-100ms', count: 8765 },
        { range: '100-200ms', count: 4532 },
        { range: '200-500ms', count: 2341 },
        { range: '500ms+', count: 876 }
      ],

      errorPatterns: [
        { pattern: 'Connection timeout', count: 234, trend: 'up' },
        { pattern: 'Authentication failed', count: 189, trend: 'stable' },
        { pattern: 'Database connection error', count: 156, trend: 'down' },
        { pattern: 'Memory allocation failed', count: 134, trend: 'up' },
        { pattern: 'Rate limit exceeded', count: 98, trend: 'stable' }
      ]
    };

    setMetrics(mockMetrics);
  };

  const getTrendColor = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return 'text-red-500';
      case 'down': return 'text-green-500';
      case 'stable': return 'text-yellow-500';
    }
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return '↗️';
      case 'down': return '↘️';
      case 'stable': return '→';
    }
  };

  const COLORS = ['#00ff00', '#ff00ff', '#00ffff', '#ffff00', '#ff6600'];

  if (!metrics) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-white border-t-transparent rounded-full mx-auto mb-4"></div>
          <div className="font-mono text-sm">Loading analytics...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <div className="border border-white p-4">
          <div className="flex items-center justify-between mb-2">
            <Database size={20} />
            <span className="text-xs font-mono text-gray-500">VPS LOGS</span>
          </div>
          <div className="text-2xl font-mono font-bold">{metrics.totalLogs.toLocaleString()}</div>
          <div className="text-xs text-gray-500">last {timeRange}</div>
        </div>

        <div className="border border-red-500 p-4">
          <div className="flex items-center justify-between mb-2">
            <AlertTriangle size={20} className="text-red-500" />
            <span className="text-xs font-mono text-gray-500">ERROR RATE</span>
          </div>
          <div className="text-2xl font-mono font-bold text-red-500">{metrics.errorRate.toFixed(1)}%</div>
          <div className="text-xs text-gray-500">of total logs</div>
        </div>

        <div className="border border-yellow-500 p-4">
          <div className="flex items-center justify-between mb-2">
            <AlertTriangle size={20} className="text-yellow-500" />
            <span className="text-xs font-mono text-gray-500">WARNING RATE</span>
          </div>
          <div className="text-2xl font-mono font-bold text-yellow-500">{metrics.warningRate.toFixed(1)}%</div>
          <div className="text-xs text-gray-500">of total logs</div>
        </div>

        <div className="border border-white p-4">
          <div className="flex items-center justify-between mb-2">
            <Activity size={20} />
            <span className="text-xs font-mono text-gray-500">LOGS/MIN</span>
          </div>
          <div className="text-2xl font-mono font-bold">{metrics.avgLogsPerMinute}</div>
          <div className="text-xs text-gray-500">average rate</div>
        </div>

        <div className="border border-white p-4">
          <div className="flex items-center justify-between mb-2">
            <Server size={20} />
            <span className="text-xs font-mono text-gray-500">VPS SOURCES</span>
          </div>
          <div className="text-2xl font-mono font-bold">{metrics.topSources.length}</div>
          <div className="text-xs text-gray-500">VPS services</div>
        </div>

        <div className="border border-white p-4">
          <div className="flex items-center justify-between mb-2">
            <Clock size={20} />
            <span className="text-xs font-mono text-gray-500">PATTERNS</span>
          </div>
          <div className="text-2xl font-mono font-bold">{metrics.errorPatterns.length}</div>
          <div className="text-xs text-gray-500">error patterns</div>
        </div>
      </div>

      {/* Metric Selector */}
      <div className="flex gap-2">
        {[
          { id: 'volume', label: 'Log Volume', icon: Database },
          { id: 'errors', label: 'Error Analysis', icon: AlertTriangle },
          { id: 'performance', label: 'Performance', icon: TrendingUp },
          { id: 'patterns', label: 'Error Patterns', icon: Activity }
        ].map(metric => (
          <button
            key={metric.id}
            onClick={() => setSelectedMetric(metric.id as any)}
            className={`flex items-center space-x-2 px-4 py-2 font-mono text-sm transition-colors border ${
              selectedMetric === metric.id 
                ? 'bg-white text-black border-white' 
                : 'border-white/30 hover:border-white'
            }`}
          >
            <metric.icon size={16} />
            <span>{metric.label}</span>
          </button>
        ))}
      </div>

      {/* Log Volume Analytics */}
      {selectedMetric === 'volume' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Hourly Distribution */}
          <div className="border border-white p-4">
            <h3 className="font-mono text-sm mb-4">VPS HOURLY LOG DISTRIBUTION</h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={metrics.hourlyDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="hour" stroke="#666" />
                <YAxis stroke="#666" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#000', border: '1px solid #fff' }}
                  labelStyle={{ color: '#fff' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="errors" 
                  stackId="1"
                  stroke="#ef4444" 
                  fill="#ef4444" 
                  fillOpacity={0.8}
                  name="Errors"
                />
                <Area 
                  type="monotone" 
                  dataKey="warnings" 
                  stackId="1"
                  stroke="#eab308" 
                  fill="#eab308" 
                  fillOpacity={0.8}
                  name="Warnings"
                />
                <Area 
                  type="monotone" 
                  dataKey="info" 
                  stackId="1"
                  stroke="#3b82f6" 
                  fill="#3b82f6" 
                  fillOpacity={0.8}
                  name="Info"
                />
                <Area 
                  type="monotone" 
                  dataKey="debug" 
                  stackId="1"
                  stroke="#6b7280" 
                  fill="#6b7280" 
                  fillOpacity={0.8}
                  name="Debug"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Top Sources */}
          <div className="border border-white p-4">
            <h3 className="font-mono text-sm mb-4">TOP VPS LOG SOURCES</h3>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={metrics.topSources} margin={{ bottom: 80, left: 20, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis 
                  dataKey="source" 
                  stroke="#666" 
                  angle={-25} 
                  textAnchor="end"
                  height={80}
                  fontSize={10}
                  fontFamily="monospace"
                  interval={0}
                  tick={{ fontSize: 10, fontFamily: 'monospace', fill: '#666' }}
                />
                <YAxis stroke="#666" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#000', border: '1px solid #fff' }}
                  labelStyle={{ color: '#fff' }}
                />
                <Bar dataKey="count" fill="#00ff00" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Error Analysis */}
      {selectedMetric === 'errors' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Error Trend */}
          <div className="border border-white p-4">
            <h3 className="font-mono text-sm mb-4">VPS ERROR SEVERITY TREND</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={metrics.severityTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="time" stroke="#666" />
                <YAxis stroke="#666" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#000', border: '1px solid #fff' }}
                  labelStyle={{ color: '#fff' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="errors" 
                  stroke="#ef4444" 
                  strokeWidth={2}
                  dot={false}
                  name="Errors"
                />
                <Line 
                  type="monotone" 
                  dataKey="warnings" 
                  stroke="#eab308" 
                  strokeWidth={2}
                  dot={false}
                  name="Warnings"
                />
                <Line 
                  type="monotone" 
                  dataKey="info" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  dot={false}
                  name="Info"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Namespace Distribution */}
          <div className="border border-white p-4">
            <h3 className="font-mono text-sm mb-4">VPS LOGS BY NAMESPACE</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={metrics.topNamespaces}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  dataKey="count"
                  label={({ namespace, percentage }) => `${namespace} (${percentage.toFixed(1)}%)`}
                >
                  {metrics.topNamespaces.map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#000', border: '1px solid #fff' }}
                  labelStyle={{ color: '#fff' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Performance Analytics */}
      {selectedMetric === 'performance' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Response Time Distribution */}
          <div className="border border-white p-4">
            <h3 className="font-mono text-sm mb-4">RESPONSE TIME DISTRIBUTION</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={metrics.responseTimeDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="range" stroke="#666" />
                <YAxis stroke="#666" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#000', border: '1px solid #fff' }}
                  labelStyle={{ color: '#fff' }}
                />
                <Bar dataKey="count" fill="#00ffff" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Performance Summary */}
          <div className="border border-white p-4">
            <h3 className="font-mono text-sm mb-4">PERFORMANCE SUMMARY</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 border border-green-500">
                  <div className="text-2xl font-mono font-bold text-green-500">
                    {((metrics.responseTimeDistribution[0].count / metrics.totalLogs) * 100).toFixed(1)}%
                  </div>
                  <div className="text-xs text-gray-400">Fast Response (&lt;50ms)</div>
                </div>
                <div className="text-center p-4 border border-red-500">
                  <div className="text-2xl font-mono font-bold text-red-500">
                    {((metrics.responseTimeDistribution[4].count / metrics.totalLogs) * 100).toFixed(1)}%
                  </div>
                  <div className="text-xs text-gray-400">Slow Response (&gt;500ms)</div>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">P50 Response Time:</span>
                  <span className="font-mono">85ms</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">P95 Response Time:</span>
                  <span className="font-mono">250ms</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">P99 Response Time:</span>
                  <span className="font-mono">500ms</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error Patterns */}
      {selectedMetric === 'patterns' && (
        <div className="border border-white">
          <div className="border-b border-white px-4 py-2">
            <h3 className="font-mono text-sm font-bold">ERROR PATTERNS ANALYSIS</h3>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {metrics.errorPatterns.map((pattern, index) => (
                <div key={index} className="border border-white/30 p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div className="font-mono text-sm font-bold">{pattern.pattern}</div>
                    <div className={`text-sm ${getTrendColor(pattern.trend)}`}>
                      {getTrendIcon(pattern.trend)}
                    </div>
                  </div>
                  <div className="text-2xl font-mono font-bold mb-1">{pattern.count}</div>
                  <div className="text-xs text-gray-400">occurrences</div>
                  <div className="mt-2 w-full bg-gray-800 h-1">
                    <div 
                      className="h-full bg-red-500 transition-all"
                      style={{ width: `${(pattern.count / Math.max(...metrics.errorPatterns.map(p => p.count))) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LogAnalytics;
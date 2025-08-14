import { useEffect, useState } from 'react';
import type { FC } from 'react';
import { 
  Activity, 
  Database, 
  Clock, 
  Zap,
  HardDrive,
  Users,
  AlertTriangle,
  TrendingUp,
  RefreshCw,
  Eye,
  BarChart3,
  PieChart,
  Server
} from 'lucide-react';
import useDatabaseStore from '@stores/databaseStore';
import { DatabaseStatus } from '@/types/database';
import { mockDatabaseStats } from '@/mocks';

interface MetricCard {
  title: string;
  value: string;
  trend?: string;
  status: 'healthy' | 'warning' | 'critical';
  icon: any;
}

const DatabaseMonitoring: FC = () => {
  const {
    connections,
    isLoading,
    fetchConnections
  } = useDatabaseStore();

  const [selectedConnection, setSelectedConnection] = useState<string>('');
  const [refreshInterval, setRefreshInterval] = useState<number>(30);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  useEffect(() => {
    fetchConnections();
  }, [fetchConnections]);

  useEffect(() => {
    const interval = setInterval(() => {
      setLastRefresh(new Date());
    }, refreshInterval * 1000);

    return () => clearInterval(interval);
  }, [refreshInterval]);

  const connectedConnections = connections.filter(conn => 
    conn.status === DatabaseStatus.CONNECTED
  );

  const selectedConnectionObj = connectedConnections.find(c => c.id === selectedConnection);
  const stats = selectedConnection ? mockDatabaseStats[selectedConnection] : null;

  const getMetricCards = (): MetricCard[] => {
    if (!stats) return [];

    return [
      {
        title: 'Active Connections',
        value: `${stats.connections.active}/${stats.connections.maxConn}`,
        trend: '+2.3%',
        status: stats.connections.active / stats.connections.maxConn > 0.8 ? 'warning' : 'healthy',
        icon: Users
      },
      {
        title: 'Queries/Second',
        value: stats.performance.queriesPerSecond.toFixed(1),
        trend: '+15.2%',
        status: stats.performance.queriesPerSecond > 100 ? 'healthy' : 'warning',
        icon: Zap
      },
      {
        title: 'Avg Query Time',
        value: `${stats.performance.avgQueryTime.toFixed(1)}ms`,
        trend: '-5.1%',
        status: stats.performance.avgQueryTime < 50 ? 'healthy' : stats.performance.avgQueryTime < 100 ? 'warning' : 'critical',
        icon: Clock
      },
      {
        title: 'Storage Used',
        value: `${((stats.storage.usedSize / stats.storage.totalSize) * 100).toFixed(1)}%`,
        trend: '+1.2%',
        status: (stats.storage.usedSize / stats.storage.totalSize) > 0.9 ? 'critical' : (stats.storage.usedSize / stats.storage.totalSize) > 0.8 ? 'warning' : 'healthy',
        icon: HardDrive
      },
      {
        title: 'Cache Hit Ratio',
        value: `${stats.performance.cacheHitRatio.toFixed(1)}%`,
        trend: '+0.8%',
        status: stats.performance.cacheHitRatio > 85 ? 'healthy' : stats.performance.cacheHitRatio > 70 ? 'warning' : 'critical',
        icon: TrendingUp
      },
      {
        title: 'Slow Queries',
        value: stats.performance.slowQueries.toString(),
        trend: '-25%',
        status: stats.performance.slowQueries === 0 ? 'healthy' : stats.performance.slowQueries < 5 ? 'warning' : 'critical',
        icon: AlertTriangle
      }
    ];
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'border-green-400 text-green-400';
      case 'warning':
        return 'border-yellow-400 text-yellow-400';
      case 'critical':
        return 'border-red-400 text-red-400';
      default:
        return 'border-white';
    }
  };

  const formatBytes = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h2 className="text-xl font-mono">DATABASE MONITORING</h2>
          <div className="text-sm font-mono opacity-60">
            Real-time performance metrics and health monitoring
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-xs font-mono opacity-60">
            Last update: {lastRefresh.toLocaleTimeString()}
          </span>
          <button
            onClick={() => setLastRefresh(new Date())}
            disabled={isLoading}
            className="flex items-center space-x-2 px-3 py-2 border border-blue-400 text-blue-400 hover:bg-blue-400 hover:text-black transition-colors font-mono text-sm disabled:opacity-50"
          >
            <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
            <span>REFRESH</span>
          </button>
        </div>
      </div>

      {/* Connection Selection */}
      <div className="flex items-center justify-between p-4 border border-white/20">
        <div className="flex items-center space-x-4">
          <Database size={16} />
          <label className="font-mono text-sm">DATABASE CONNECTION:</label>
          <select
            value={selectedConnection}
            onChange={(e) => setSelectedConnection(e.target.value)}
            className="bg-black border border-white text-white px-3 py-2 font-mono text-sm focus:outline-none focus:border-green-400"
          >
            <option value="">Select Connection to Monitor</option>
            {connectedConnections.map(conn => (
              <option key={conn.id} value={conn.id}>
                {conn.name} ({conn.type.toUpperCase()})
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center space-x-2">
          <label className="font-mono text-sm">REFRESH INTERVAL:</label>
          <select
            value={refreshInterval}
            onChange={(e) => setRefreshInterval(parseInt(e.target.value))}
            className="bg-black border border-white text-white px-2 py-1 font-mono text-sm focus:outline-none focus:border-green-400"
          >
            <option value={10}>10s</option>
            <option value={30}>30s</option>
            <option value={60}>1m</option>
            <option value={300}>5m</option>
          </select>
        </div>
      </div>

      {selectedConnection && selectedConnectionObj && stats ? (
        <div className="space-y-6">
          {/* Connection Info */}
          <div className="grid grid-cols-4 gap-4">
            <div className="border border-white p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Database size={16} />
                <span className="font-mono text-sm">CONNECTION</span>
              </div>
              <div className="font-mono text-lg">{selectedConnectionObj.name}</div>
              <div className="font-mono text-xs opacity-60">{selectedConnectionObj.type.toUpperCase()}</div>
            </div>
            <div className="border border-white p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Server size={16} />
                <span className="font-mono text-sm">HOST</span>
              </div>
              <div className="font-mono text-lg">
                {selectedConnectionObj.host || selectedConnectionObj.filePath}
              </div>
              <div className="font-mono text-xs opacity-60">
                {selectedConnectionObj.host ? `Port ${selectedConnectionObj.port}` : 'SQLite File'}
              </div>
            </div>
            <div className="border border-white p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Activity size={16} />
                <span className="font-mono text-sm">STATUS</span>
              </div>
              <div className="font-mono text-lg text-green-400">CONNECTED</div>
              <div className="font-mono text-xs opacity-60">Online</div>
            </div>
            <div className="border border-white p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Clock size={16} />
                <span className="font-mono text-sm">UPTIME</span>
              </div>
              <div className="font-mono text-lg">48h 23m</div>
              <div className="font-mono text-xs opacity-60">Since restart</div>
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="grid grid-cols-3 gap-4">
            {getMetricCards().map((metric, i) => (
              <div key={i} className={`border p-4 ${getStatusColor(metric.status)}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-sm opacity-80">{metric.title}</span>
                  <metric.icon size={16} />
                </div>
                <div className="flex items-end justify-between">
                  <div className="font-mono text-2xl">{metric.value}</div>
                  {metric.trend && (
                    <div className={`font-mono text-xs ${
                      metric.trend.startsWith('+') ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {metric.trend}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Storage Breakdown */}
          <div className="grid grid-cols-2 gap-6">
            <div className="border border-white">
              <div className="bg-white/5 p-3 border-b border-white">
                <h4 className="font-mono text-sm">STORAGE USAGE</h4>
              </div>
              <div className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm">Total Size</span>
                  <span className="font-mono text-sm">{formatBytes(stats.storage.totalSize)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm">Used Space</span>
                  <span className="font-mono text-sm">{formatBytes(stats.storage.usedSize)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm">Free Space</span>
                  <span className="font-mono text-sm">{formatBytes(stats.storage.freeSize)}</span>
                </div>
                <div className="w-full bg-gray-700 h-2">
                  <div 
                    className="bg-blue-400 h-2"
                    style={{ width: `${(stats.storage.usedSize / stats.storage.totalSize) * 100}%` }}
                  />
                </div>
                <div className="text-center font-mono text-xs opacity-60">
                  {((stats.storage.usedSize / stats.storage.totalSize) * 100).toFixed(1)}% Used
                </div>
              </div>
            </div>

            <div className="border border-white">
              <div className="bg-white/5 p-3 border-b border-white">
                <h4 className="font-mono text-sm">CONNECTION POOL</h4>
              </div>
              <div className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm">Active</span>
                  <span className="font-mono text-sm text-green-400">{stats.connections.active}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm">Idle</span>
                  <span className="font-mono text-sm text-yellow-400">{stats.connections.idle}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm">Total</span>
                  <span className="font-mono text-sm">{stats.connections.total}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm">Max Connections</span>
                  <span className="font-mono text-sm">{stats.connections.maxConn}</span>
                </div>
                <div className="w-full bg-gray-700 h-2">
                  <div 
                    className="bg-green-400 h-2"
                    style={{ width: `${(stats.connections.active / stats.connections.maxConn) * 100}%` }}
                  />
                </div>
                <div className="text-center font-mono text-xs opacity-60">
                  {((stats.connections.active / stats.connections.maxConn) * 100).toFixed(1)}% Utilization
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="border border-white">
            <div className="bg-white/5 p-3 border-b border-white">
              <h4 className="font-mono text-sm">RECENT ACTIVITY</h4>
            </div>
            <div className="p-4">
              <div className="space-y-2">
                {[
                  { time: '14:23:45', event: 'Query executed', details: 'SELECT * FROM users WHERE active = true', duration: '12.3ms' },
                  { time: '14:23:42', event: 'Connection opened', details: 'New client connection from 192.168.1.100', duration: '2.1ms' },
                  { time: '14:23:40', event: 'Index scan', details: 'Table: user_sessions, Index: idx_session_expires', duration: '45.7ms' },
                  { time: '14:23:38', event: 'Cache miss', details: 'Query result not found in cache', duration: '89.2ms' },
                  { time: '14:23:35', event: 'Query executed', details: 'UPDATE user_sessions SET last_seen = NOW()', duration: '8.9ms' }
                ].map((activity, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-white/10 last:border-b-0">
                    <div className="flex items-center space-x-4">
                      <span className="font-mono text-xs opacity-60 w-16">{activity.time}</span>
                      <span className="font-mono text-sm">{activity.event}</span>
                      <span className="font-mono text-xs opacity-80">{activity.details}</span>
                    </div>
                    <span className="font-mono text-xs opacity-60">{activity.duration}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-center space-x-4">
            <button className="flex items-center space-x-2 px-4 py-2 border border-blue-400 text-blue-400 hover:bg-blue-400 hover:text-black transition-colors font-mono text-sm">
              <Eye size={16} />
              <span>VIEW DETAILED METRICS</span>
            </button>
            <button className="flex items-center space-x-2 px-4 py-2 border border-green-400 text-green-400 hover:bg-green-400 hover:text-black transition-colors font-mono text-sm">
              <BarChart3 size={16} />
              <span>PERFORMANCE ANALYSIS</span>
            </button>
            <button className="flex items-center space-x-2 px-4 py-2 border border-white hover:bg-white hover:text-black transition-colors font-mono text-sm">
              <PieChart size={16} />
              <span>EXPORT REPORT</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="border border-white/20 p-12 text-center">
          <Database size={64} className="mx-auto opacity-40 mb-4" />
          <h3 className="text-lg font-mono mb-2">SELECT A DATABASE TO MONITOR</h3>
          <p className="text-sm font-mono opacity-60 mb-6">
            Choose a connected database to view real-time performance metrics and health status
          </p>
          {connectedConnections.length === 0 && (
            <p className="text-sm font-mono text-yellow-400">
              No connected databases found. Please connect to a database first.
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default DatabaseMonitoring;
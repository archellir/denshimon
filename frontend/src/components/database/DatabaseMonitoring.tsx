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
  Eye,
  BarChart3,
  PieChart,
  Server
} from 'lucide-react';
import useDatabaseStore from '@stores/databaseStore';
import { DatabaseStatus } from '@/types/database';
import { mockDatabaseStats } from '@mocks/database';
import useWebSocket from '@hooks/useWebSocket';
import CustomSelector from '@components/common/CustomSelector';

interface MetricCard {
  title: string;
  value: string;
  trend?: string;
  status: 'healthy' | 'warning' | 'critical';
  icon: React.ComponentType<{ className?: string; size?: number }>;
}

const DatabaseMonitoring: FC = () => {
  const {
    connections,
    stats,
    fetchConnections
  } = useDatabaseStore();

  const [selectedConnection, setSelectedConnection] = useState<string>('');
  const [realTimeStats, setRealTimeStats] = useState<any>(null);
  const [, setDatabases] = useState<any[]>([]);

  // WebSocket integration for real-time database updates
  const { lastMessage, isConnected } = useWebSocket();

  useEffect(() => {
    fetchConnections();
  }, [fetchConnections]);

  // Handle WebSocket messages for database updates
  useEffect(() => {
    if (lastMessage && lastMessage.data) {
      try {
        const messageData = typeof lastMessage.data === 'string' ? JSON.parse(lastMessage.data) : lastMessage.data;
        
        if (messageData.type === 'database_stats') {
          setRealTimeStats(messageData.data.stats);
          // setStats is not available, we'll use realTimeStats directly
        } else if (messageData.type === 'database') {
          setDatabases(messageData.data.databases || []);
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    }
  }, [lastMessage]);


  const connectedConnections = connections.filter(conn => 
    conn.status === DatabaseStatus.CONNECTED
  );

  const selectedConnectionObj = connectedConnections.find(c => c.id === selectedConnection);
  // Prioritize real-time WebSocket data, fallback to store data or mock data
  const currentStats = realTimeStats || stats || (selectedConnection ? mockDatabaseStats[selectedConnection] : null);

  const getMetricCards = (): MetricCard[] => {
    if (!currentStats) return [];

    return [
      {
        title: 'Active Connections',
        value: `${currentStats.connections.active}/${currentStats.connections.maxConn}`,
        trend: '+2.3%',
        status: currentStats.connections.active / currentStats.connections.maxConn > 0.8 ? 'warning' : 'healthy',
        icon: Users
      },
      {
        title: 'Queries/Second',
        value: currentStats.performance.queriesPerSecond.toFixed(1),
        trend: '+15.2%',
        status: currentStats.performance.queriesPerSecond > 100 ? 'healthy' : 'warning',
        icon: Zap
      },
      {
        title: 'Avg Query Time',
        value: `${currentStats.performance.avgQueryTime.toFixed(1)}ms`,
        trend: '-5.1%',
        status: currentStats.performance.avgQueryTime < 50 ? 'healthy' : currentStats.performance.avgQueryTime < 100 ? 'warning' : 'critical',
        icon: Clock
      },
      {
        title: 'Storage Used',
        value: `${((currentStats.storage.usedSize / currentStats.storage.totalSize) * 100).toFixed(1)}%`,
        trend: '+1.2%',
        status: (currentStats.storage.usedSize / currentStats.storage.totalSize) > 0.9 ? 'critical' : (currentStats.storage.usedSize / currentStats.storage.totalSize) > 0.8 ? 'warning' : 'healthy',
        icon: HardDrive
      },
      {
        title: 'Cache Hit Ratio',
        value: `${currentStats.performance.cacheHitRatio.toFixed(1)}%`,
        trend: '+0.8%',
        status: currentStats.performance.cacheHitRatio > 85 ? 'healthy' : currentStats.performance.cacheHitRatio > 70 ? 'warning' : 'critical',
        icon: TrendingUp
      },
      {
        title: 'Slow Queries',
        value: currentStats.performance.slowQueries.toString(),
        trend: '-25%',
        status: currentStats.performance.slowQueries === 0 ? 'healthy' : currentStats.performance.slowQueries < 5 ? 'warning' : 'critical',
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

      {/* Connection Selection */}
      <div className="flex items-center justify-between p-4 border border-white/20">
        <div className="flex items-center space-x-4">
          <Database size={16} />
          <label className="font-mono text-sm">DATABASE CONNECTION:</label>
          <CustomSelector
            value={selectedConnection}
            options={connectedConnections.map(conn => ({
              value: conn.id,
              label: `${conn.name} (${conn.type.toUpperCase()})`
            }))}
            onChange={(value) => {
              setSelectedConnection(value);
            }}
            placeholder="Select Connection to Monitor"
            icon={Zap}
            size="md"
            className="min-w-72"
          />
        </div>
      </div>

      {selectedConnection && selectedConnectionObj && currentStats ? (
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
                  <span className="font-mono text-sm">{formatBytes(currentStats.storage.totalSize)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm">Used Space</span>
                  <span className="font-mono text-sm">{formatBytes(currentStats.storage.usedSize)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm">Free Space</span>
                  <span className="font-mono text-sm">{formatBytes(currentStats.storage.freeSize)}</span>
                </div>
                <div className="w-full bg-gray-700 h-2">
                  <div 
                    className="bg-blue-400 h-2"
                    style={{ width: `${(currentStats.storage.usedSize / currentStats.storage.totalSize) * 100}%` }}
                  />
                </div>
                <div className="text-center font-mono text-xs opacity-60">
                  {((currentStats.storage.usedSize / currentStats.storage.totalSize) * 100).toFixed(1)}% Used
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
                  <span className="font-mono text-sm text-green-400">{currentStats.connections.active}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm">Idle</span>
                  <span className="font-mono text-sm text-yellow-400">{currentStats.connections.idle}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm">Total</span>
                  <span className="font-mono text-sm">{currentStats.connections.total}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm">Max Connections</span>
                  <span className="font-mono text-sm">{currentStats.connections.maxConn}</span>
                </div>
                <div className="w-full bg-gray-700 h-2">
                  <div 
                    className="bg-green-400 h-2"
                    style={{ width: `${(currentStats.connections.active / currentStats.connections.maxConn) * 100}%` }}
                  />
                </div>
                <div className="text-center font-mono text-xs opacity-60">
                  {((currentStats.connections.active / currentStats.connections.maxConn) * 100).toFixed(1)}% Utilization
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
            <button 
              onClick={() => {
                // Real-time metrics are automatically updated via WebSocket
                console.log('Real-time metrics are displayed above');
              }}
              className="flex items-center space-x-2 px-4 py-2 border border-blue-400 text-blue-400 hover:bg-blue-400 hover:text-black transition-colors font-mono text-sm"
            >
              <Eye size={16} />
              <span>VIEW DETAILED METRICS</span>
            </button>
            <button 
              onClick={() => {
                // Navigate to performance analysis view (could integrate with observability tab)
                console.log('Performance analysis for connection:', selectedConnection);
              }}
              className="flex items-center space-x-2 px-4 py-2 border border-green-400 text-green-400 hover:bg-green-400 hover:text-black transition-colors font-mono text-sm"
            >
              <BarChart3 size={16} />
              <span>PERFORMANCE ANALYSIS</span>
            </button>
            <button 
              onClick={() => {
                if (currentStats) {
                  const reportData = {
                    connection: selectedConnectionObj?.name,
                    timestamp: new Date().toISOString(),
                    metrics: currentStats
                  };
                  const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `database-report-${selectedConnectionObj?.name}-${Date.now()}.json`;
                  a.click();
                  URL.revokeObjectURL(url);
                }
              }}
              className="flex items-center space-x-2 px-4 py-2 border border-white hover:bg-white hover:text-black transition-colors font-mono text-sm"
            >
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
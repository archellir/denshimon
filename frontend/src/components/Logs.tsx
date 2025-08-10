import { useState, useEffect, useMemo } from 'react';
import type { FC } from 'react';
import { Search, Filter, Download, RefreshCw, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

interface LogEntry {
  id: string;
  timestamp: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  source: string;
  message: string;
  metadata?: Record<string, any>;
  user?: string;
  action?: string;
}

const Logs: FC = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [selectedSource, setSelectedSource] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Generate mock log data
  useEffect(() => {
    generateMockLogs();
  }, []);

  // Auto-refresh effect
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      generateMockLogs();
    }, 5000);

    return () => clearInterval(interval);
  }, [autoRefresh]);

  const generateMockLogs = () => {
    const levels: LogEntry['level'][] = ['debug', 'info', 'warn', 'error'];
    const sources = ['auth', 'api', 'k8s', 'gitops', 'metrics', 'database'];
    const users = ['admin', 'operator', 'viewer', 'system'];
    const actions = ['login', 'logout', 'create', 'update', 'delete', 'sync', 'deploy'];
    
    const messages = [
      'User authentication successful',
      'Failed to connect to Kubernetes cluster',
      'GitOps repository sync completed',
      'High memory usage detected on node worker-1',
      'Application deployment started',
      'Database connection established',
      'Token validation failed',
      'Metrics collection updated',
      'Pod restart triggered',
      'Configuration updated',
      'Backup process initiated',
      'Alert threshold exceeded',
      'Service health check passed',
      'Resource quota reached',
      'Network policy applied',
    ];

    const newLogs: LogEntry[] = Array.from({ length: 100 }, (_, i) => {
      const level = levels[Math.floor(Math.random() * levels.length)];
      const source = sources[Math.floor(Math.random() * sources.length)];
      const message = messages[Math.floor(Math.random() * messages.length)];
      const user = users[Math.floor(Math.random() * users.length)];
      const action = actions[Math.floor(Math.random() * actions.length)];
      
      return {
        id: `log-${Date.now()}-${i}`,
        timestamp: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString(),
        level,
        source,
        message,
        user: Math.random() > 0.3 ? user : undefined,
        action: Math.random() > 0.4 ? action : undefined,
        metadata: {
          ip: `192.168.1.${Math.floor(Math.random() * 255)}`,
          duration: Math.floor(Math.random() * 5000),
          ...(level === 'error' && { error_code: `ERR_${Math.floor(Math.random() * 9999)}` }),
        },
      };
    }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    setLogs(newLogs);
  };

  // Filter logs based on search and filters
  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const matchesSearch = searchQuery === '' || 
        log.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.source.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.user?.toLowerCase().includes(searchQuery.toLowerCase());
        
      const matchesLevel = selectedLevel === 'all' || log.level === selectedLevel;
      const matchesSource = selectedSource === 'all' || log.source === selectedSource;
      
      return matchesSearch && matchesLevel && matchesSource;
    });
  }, [logs, searchQuery, selectedLevel, selectedSource]);

  const getLogLevelIcon = (level: LogEntry['level']) => {
    switch (level) {
      case 'error': return <X size={14} className="text-red-400" />;
      case 'warn': return <AlertTriangle size={14} className="text-yellow-400" />;
      case 'info': return <Info size={14} className="text-blue-400" />;
      case 'debug': return <AlertCircle size={14} className="text-gray-400" />;
      default: return <Info size={14} className="text-white" />;
    }
  };

  const getLogLevelColor = (level: LogEntry['level']) => {
    switch (level) {
      case 'error': return 'text-red-400 border-red-400';
      case 'warn': return 'text-yellow-400 border-yellow-400';
      case 'info': return 'text-blue-400 border-blue-400';
      case 'debug': return 'text-gray-400 border-gray-400';
      default: return 'text-white border-white';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('en-US', {
      year: '2-digit',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
  };

  const exportLogs = () => {
    const csvContent = [
      'Timestamp,Level,Source,User,Action,Message',
      ...filteredLogs.map(log => 
        `"${log.timestamp}","${log.level}","${log.source}","${log.user || ''}","${log.action || ''}","${log.message}"`
      )
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', `denshimon-logs-${new Date().toISOString().split('T')[0]}.csv`);
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const refreshLogs = () => {
    setIsLoading(true);
    setTimeout(() => {
      generateMockLogs();
      setIsLoading(false);
    }, 1000);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedLevel('all');
    setSelectedSource('all');
  };

  const uniqueSources = Array.from(new Set(logs.map(log => log.source))).sort();

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-mono">SYSTEM LOGS</h1>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="auto-refresh"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="w-4 h-4"
            />
            <label htmlFor="auto-refresh" className="font-mono text-sm">
              AUTO-REFRESH
            </label>
          </div>
          
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center space-x-2 px-3 py-1 border font-mono text-sm transition-colors ${
              showFilters ? 'bg-white text-black border-white' : 'text-white border-white hover:bg-white hover:text-black'
            }`}
          >
            <Filter size={14} />
            <span>FILTERS</span>
          </button>
          
          <button
            onClick={exportLogs}
            className="flex items-center space-x-2 px-3 py-1 border border-white text-white hover:bg-white hover:text-black transition-colors font-mono text-sm"
          >
            <Download size={14} />
            <span>EXPORT</span>
          </button>
          
          <button
            onClick={refreshLogs}
            disabled={isLoading}
            className="flex items-center space-x-2 px-3 py-1 border border-white text-white hover:bg-white hover:text-black transition-colors font-mono text-sm disabled:opacity-50"
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
            <span>REFRESH</span>
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search logs..."
            className="w-full pl-10 pr-4 py-2 bg-black border border-white font-mono text-sm focus:outline-none focus:border-green-400"
          />
        </div>
        
        {showFilters && (
          <div className="border border-white p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-mono mb-2">LOG LEVEL</label>
                <select
                  value={selectedLevel}
                  onChange={(e) => setSelectedLevel(e.target.value)}
                  className="w-full bg-black border border-white p-2 font-mono text-sm focus:outline-none focus:border-green-400"
                >
                  <option value="all">ALL LEVELS</option>
                  <option value="error">ERROR</option>
                  <option value="warn">WARN</option>
                  <option value="info">INFO</option>
                  <option value="debug">DEBUG</option>
                </select>
              </div>
              
              <div>
                <label className="block text-xs font-mono mb-2">SOURCE</label>
                <select
                  value={selectedSource}
                  onChange={(e) => setSelectedSource(e.target.value)}
                  className="w-full bg-black border border-white p-2 font-mono text-sm focus:outline-none focus:border-green-400"
                >
                  <option value="all">ALL SOURCES</option>
                  {uniqueSources.map(source => (
                    <option key={source} value={source}>{source.toUpperCase()}</option>
                  ))}
                </select>
              </div>
              
              <div className="flex items-end">
                <button
                  onClick={clearFilters}
                  className="px-4 py-2 border border-white text-white hover:bg-white hover:text-black transition-colors font-mono text-sm"
                >
                  CLEAR FILTERS
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Log Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="border border-white p-3 text-center">
          <div className="text-lg font-mono">{filteredLogs.length}</div>
          <div className="text-xs font-mono opacity-60">TOTAL</div>
        </div>
        {(['error', 'warn', 'info', 'debug'] as const).map(level => {
          const count = filteredLogs.filter(log => log.level === level).length;
          return (
            <div key={level} className={`border p-3 text-center ${getLogLevelColor(level)}`}>
              <div className="text-lg font-mono">{count}</div>
              <div className="text-xs font-mono opacity-60">{level.toUpperCase()}</div>
            </div>
          );
        })}
      </div>

      {/* Log Entries */}
      <div className="border border-white">
        <div className="max-h-96 overflow-y-auto">
          {filteredLogs.length === 0 ? (
            <div className="p-8 text-center">
              <div className="text-lg font-mono mb-2">NO LOGS FOUND</div>
              <div className="text-sm font-mono opacity-60">
                No log entries match your current filters
              </div>
            </div>
          ) : (
            <div className="divide-y divide-white">
              {filteredLogs.map((log) => (
                <div key={log.id} className="p-4 hover:bg-gray-900/20 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      {getLogLevelIcon(log.level)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-4 mb-1">
                          <span className="font-mono text-xs text-gray-400">
                            {formatTimestamp(log.timestamp)}
                          </span>
                          <span className={`font-mono text-xs px-2 py-1 border ${getLogLevelColor(log.level)}`}>
                            {log.level.toUpperCase()}
                          </span>
                          <span className="font-mono text-xs text-blue-400">
                            {log.source.toUpperCase()}
                          </span>
                          {log.user && (
                            <span className="font-mono text-xs text-yellow-400">
                              {log.user}
                            </span>
                          )}
                          {log.action && (
                            <span className="font-mono text-xs text-green-400">
                              {log.action.toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div className="font-mono text-sm">
                          {log.message}
                        </div>
                        {log.metadata && (
                          <div className="mt-2 font-mono text-xs text-gray-400">
                            {Object.entries(log.metadata)
                              .filter(([key]) => key !== 'duration')
                              .map(([key, value]) => (
                                <span key={key} className="mr-4">
                                  {key}: {JSON.stringify(value)}
                                </span>
                              ))}
                          </div>
                        )}
                      </div>
                    </div>
                    {log.metadata?.duration && (
                      <span className="font-mono text-xs text-gray-400">
                        {log.metadata.duration}ms
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Logs;
import React, { useEffect, useState, useRef, useMemo } from 'react';
import { Terminal, Package, AlertCircle, Info, AlertTriangle, Bug, Download, RefreshCw, Filter, Search, X } from 'lucide-react';
import { generateMockLogs, mockApiResponse, MOCK_ENABLED } from '@mocks/index';
import type { LogEntry } from '@/types/logs';
import { useLogsWebSocket } from '@hooks/useWebSocket';

const EnhancedLogs: React.FC = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [selectedSource, setSelectedSource] = useState<string>('all');
  const [selectedNamespace, setSelectedNamespace] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(5000);

  // WebSocket for real-time log updates
  const { data: newLogEntry, isConnected } = useLogsWebSocket();

  // Load logs
  useEffect(() => {
    loadLogs();
  }, []);

  // Handle real-time log entries
  useEffect(() => {
    if (newLogEntry && isConnected) {
      setLogs(prev => [newLogEntry, ...prev.slice(0, 999)]); // Keep max 1000 logs
    }
  }, [newLogEntry, isConnected]);

  // Auto-refresh
  useEffect(() => {
    let intervalId: number;
    if (autoRefresh) {
      intervalId = setInterval(loadLogs, refreshInterval) as unknown as number;
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [autoRefresh, refreshInterval]);

  const loadLogs = async () => {
    setIsLoading(true);
    if (MOCK_ENABLED) {
      const mockLogs = await mockApiResponse(generateMockLogs(200));
      setLogs(mockLogs);
    } else {
      setLogs([]);
    }
    setIsLoading(false);
  };

  // Filter logs
  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const matchesSearch = searchQuery === '' || 
        log.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.source.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.user?.toLowerCase().includes(searchQuery.toLowerCase());
        
      const matchesLevel = selectedLevel === 'all' || log.level === selectedLevel;
      const matchesSource = selectedSource === 'all' || log.source === selectedSource;
      
      // Extract namespace from metadata if available
      const logNamespace = log.metadata?.namespace || 'default';
      const matchesNamespace = selectedNamespace === 'all' || logNamespace === selectedNamespace;
      
      return matchesSearch && matchesLevel && matchesSource && matchesNamespace;
    });
  }, [logs, searchQuery, selectedLevel, selectedSource, selectedNamespace]);

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'error': return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'warn': return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'info': return <Info className="w-4 h-4 text-blue-500" />;
      case 'debug': return <Bug className="w-4 h-4 text-gray-500" />;
      default: return null;
    }
  };

  const getLogLevelColor = (level: string) => {
    switch (level) {
      case 'error': return 'text-red-400 border-red-400 bg-red-900/10';
      case 'warn': return 'text-yellow-400 border-yellow-400 bg-yellow-900/10';
      case 'info': return 'text-blue-400 border-blue-400 bg-blue-900/10';
      case 'debug': return 'text-gray-400 border-gray-400 bg-gray-900/10';
      default: return 'text-white border-white bg-white/5';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('en-US', {
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
      'Timestamp,Level,Source,Namespace,User,Action,Message',
      ...filteredLogs.map(log => 
        `"${log.timestamp}","${log.level}","${log.source}","${log.metadata?.namespace || 'default'}","${log.user || ''}","${log.action || ''}","${log.message}"`
      )
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', `logs-${new Date().toISOString().split('T')[0]}.csv`);
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedLevel('all');
    setSelectedSource('all');
    setSelectedNamespace('all');
  };

  const uniqueSources = Array.from(new Set(logs.map(log => log.source))).sort();
  const uniqueNamespaces = Array.from(new Set(logs.map(log => log.metadata?.namespace || 'default'))).sort();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-mono">APPLICATION & SYSTEM LOGS</h2>
          <p className="text-sm text-gray-400 font-mono">
            Centralized log aggregation and analysis
            {isConnected && <span className="text-green-400 ml-2">• LIVE</span>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 text-sm font-mono">
            <span className="text-gray-500">Auto Refresh:</span>
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`px-2 py-1 border text-xs transition-colors ${
                autoRefresh ? 'bg-green-500 text-black border-green-500' : 'border-white/30 hover:border-white'
              }`}
            >
              {autoRefresh ? 'ON' : 'OFF'}
            </button>
            {autoRefresh && (
              <select
                value={refreshInterval}
                onChange={(e) => setRefreshInterval(Number(e.target.value))}
                className="bg-black border border-white/30 px-2 py-1 text-xs font-mono"
              >
                <option value={2000}>2s</option>
                <option value={5000}>5s</option>
                <option value={10000}>10s</option>
                <option value={30000}>30s</option>
              </select>
            )}
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
            onClick={loadLogs}
            disabled={isLoading}
            className="flex items-center space-x-2 px-3 py-1 border border-white text-white hover:bg-white hover:text-black transition-colors font-mono text-sm disabled:opacity-50"
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
            <span>REFRESH</span>
          </button>
          
          <button
            onClick={exportLogs}
            className="flex items-center space-x-2 px-3 py-1 border border-white text-white hover:bg-white hover:text-black transition-colors font-mono text-sm"
          >
            <Download size={14} />
            <span>EXPORT</span>
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <div className="border border-white p-3 text-center">
          <div className="text-lg font-mono">{filteredLogs.length}</div>
          <div className="text-xs font-mono opacity-60">TOTAL</div>
        </div>
        {(['error', 'warn', 'info', 'debug'] as const).map(level => {
          const count = filteredLogs.filter(log => log.level === level).length;
          const percentage = filteredLogs.length > 0 ? ((count / filteredLogs.length) * 100).toFixed(1) : '0';
          return (
            <div key={level} className={`border p-3 text-center ${getLogLevelColor(level)}`}>
              <div className="text-lg font-mono">{count}</div>
              <div className="text-xs font-mono opacity-60">{level.toUpperCase()}</div>
              <div className="text-xs font-mono opacity-40">{percentage}%</div>
            </div>
          );
        })}
        <div className="border border-white p-3 text-center">
          <div className="text-lg font-mono">{uniqueSources.length}</div>
          <div className="text-xs font-mono opacity-60">SOURCES</div>
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
            placeholder="Search logs, sources, users, actions..."
            className="w-full pl-10 pr-4 py-2 bg-black border border-white font-mono text-sm focus:outline-none focus:border-green-400"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-3 text-gray-400 hover:text-white"
            >
              <X size={16} />
            </button>
          )}
        </div>
        
        {showFilters && (
          <div className="border border-white p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-mono mb-2 text-gray-400">LOG LEVEL</label>
                <select
                  value={selectedLevel}
                  onChange={(e) => setSelectedLevel(e.target.value)}
                  className="w-full bg-black border border-white/30 p-2 font-mono text-sm focus:outline-none focus:border-green-400"
                >
                  <option value="all">ALL LEVELS</option>
                  <option value="error">ERROR</option>
                  <option value="warn">WARN</option>
                  <option value="info">INFO</option>
                  <option value="debug">DEBUG</option>
                </select>
              </div>
              
              <div>
                <label className="block text-xs font-mono mb-2 text-gray-400">SOURCE</label>
                <select
                  value={selectedSource}
                  onChange={(e) => setSelectedSource(e.target.value)}
                  className="w-full bg-black border border-white/30 p-2 font-mono text-sm focus:outline-none focus:border-green-400"
                >
                  <option value="all">ALL SOURCES</option>
                  {uniqueSources.map(source => (
                    <option key={source} value={source}>{source.toUpperCase()}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-xs font-mono mb-2 text-gray-400">NAMESPACE</label>
                <select
                  value={selectedNamespace}
                  onChange={(e) => setSelectedNamespace(e.target.value)}
                  className="w-full bg-black border border-white/30 p-2 font-mono text-sm focus:outline-none focus:border-green-400"
                >
                  <option value="all">ALL NAMESPACES</option>
                  {uniqueNamespaces.map(namespace => (
                    <option key={namespace} value={namespace}>{namespace.toUpperCase()}</option>
                  ))}
                </select>
              </div>
              
              <div className="flex items-end">
                <button
                  onClick={clearFilters}
                  className="px-4 py-2 border border-white/30 text-white hover:bg-white hover:text-black transition-colors font-mono text-sm"
                >
                  CLEAR FILTERS
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Log Entries */}
      <div className="border border-white">
        <div className="max-h-[600px] overflow-y-auto">
          {filteredLogs.length === 0 ? (
            <div className="p-8 text-center">
              <Package className="w-12 h-12 mx-auto mb-4 text-gray-500" />
              <div className="text-lg font-mono mb-2">NO LOGS FOUND</div>
              <div className="text-sm font-mono opacity-60">
                {searchQuery || selectedLevel !== 'all' || selectedSource !== 'all' || selectedNamespace !== 'all' 
                  ? 'No log entries match your current filters'
                  : 'No log entries available'
                }
              </div>
            </div>
          ) : (
            <div className="divide-y divide-white/10">
              {filteredLogs.map((log) => (
                <div key={log.id} className={`p-4 hover:bg-white/5 transition-colors border-l-4 ${
                  log.level === 'error' ? 'border-l-red-500' :
                  log.level === 'warn' ? 'border-l-yellow-500' :
                  log.level === 'info' ? 'border-l-blue-500' :
                  log.level === 'debug' ? 'border-l-gray-500' :
                  'border-l-transparent'
                }`}>
                  <div className="flex items-start space-x-3">
                    {getLevelIcon(log.level)}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="font-mono text-xs text-gray-400">
                          {formatTimestamp(log.timestamp)}
                        </span>
                        <span className={`font-mono text-xs px-2 py-1 border ${getLogLevelColor(log.level)}`}>
                          {log.level.toUpperCase()}
                        </span>
                        <span className="font-mono text-xs text-blue-400 bg-blue-900/20 px-2 py-1">
                          {log.source}
                        </span>
                        {log.metadata?.namespace && (
                          <span className="font-mono text-xs text-purple-400 bg-purple-900/20 px-2 py-1">
                            {log.metadata.namespace}
                          </span>
                        )}
                        {log.user && (
                          <span className="font-mono text-xs text-yellow-400 bg-yellow-900/20 px-2 py-1">
                            {log.user}
                          </span>
                        )}
                        {log.action && (
                          <span className="font-mono text-xs text-green-400 bg-green-900/20 px-2 py-1">
                            {log.action}
                          </span>
                        )}
                      </div>
                      <div className="font-mono text-sm leading-relaxed">
                        {log.message}
                      </div>
                      {log.metadata && Object.keys(log.metadata).length > 1 && (
                        <div className="mt-2 font-mono text-xs text-gray-400 bg-gray-900/20 p-2 rounded">
                          {Object.entries(log.metadata)
                            .filter(([key]) => !['namespace', 'duration'].includes(key))
                            .map(([key, value]) => (
                              <span key={key} className="mr-4">
                                <span className="text-gray-500">{key}:</span> {JSON.stringify(value)}
                              </span>
                            ))}
                        </div>
                      )}
                    </div>
                    {log.metadata?.duration && (
                      <span className="font-mono text-xs text-gray-400 bg-gray-900/20 px-2 py-1">
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

export default EnhancedLogs;
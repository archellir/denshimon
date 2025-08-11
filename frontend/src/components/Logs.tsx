import React, { useEffect, useState, useRef, useMemo } from 'react';
import { Terminal, Activity, Package, AlertCircle, Info, AlertTriangle, Bug, TrendingUp, TrendingDown, Minus, Download, RefreshCw, Table, X, Filter, Search } from 'lucide-react';
import { LiveTerminalData, TerminalFilter } from '@/types/liveTerminal';
import { startLiveTerminalUpdates, stopLiveTerminalUpdates } from '@/mocks/terminal/liveData';
import { generateMockLogs, mockApiResponse, MOCK_ENABLED } from '@mocks/index';
import type { LogEntry } from '@types/logs';

const Logs: React.FC = () => {
  // Live terminal state
  const [liveData, setLiveData] = useState<LiveTerminalData | null>(null);
  const [liveFilter, setLiveFilter] = useState<TerminalFilter>({
    maxLines: 100
  });
  const [autoScroll, setAutoScroll] = useState(true);
  const logsEndRef = useRef<HTMLDivElement>(null);
  
  // Static logs state
  const [staticLogs, setStaticLogs] = useState<LogEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [selectedSource, setSelectedSource] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  
  // View selection
  const [selectedView, setSelectedView] = useState<'static' | 'live' | 'pods' | 'deployments'>('static');

  // Load static logs
  useEffect(() => {
    loadStaticLogs();
  }, []);

  // Live terminal updates
  useEffect(() => {
    let unsubscribe: (() => void) | null = null;
    
    if (selectedView === 'live' || selectedView === 'pods' || selectedView === 'deployments') {
      unsubscribe = startLiveTerminalUpdates(setLiveData);
    }
    
    return () => {
      if (unsubscribe) {
        unsubscribe();
        stopLiveTerminalUpdates();
      }
    };
  }, [selectedView]);

  // Auto-scroll for live logs
  useEffect(() => {
    if (autoScroll && logsEndRef.current && selectedView === 'live') {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [liveData?.logs, autoScroll, selectedView]);

  const loadStaticLogs = async () => {
    setIsLoading(true);
    if (MOCK_ENABLED) {
      const mockLogs = await mockApiResponse(generateMockLogs());
      setStaticLogs(mockLogs);
    } else {
      setStaticLogs([]);
    }
    setIsLoading(false);
  };

  const refreshStaticLogs = () => {
    loadStaticLogs();
  };

  // Filter static logs
  const filteredStaticLogs = useMemo(() => {
    return staticLogs.filter(log => {
      const matchesSearch = searchQuery === '' || 
        log.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.source.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.user?.toLowerCase().includes(searchQuery.toLowerCase());
        
      const matchesLevel = selectedLevel === 'all' || log.level === selectedLevel;
      const matchesSource = selectedSource === 'all' || log.source === selectedSource;
      
      return matchesSearch && matchesLevel && matchesSource;
    });
  }, [staticLogs, searchQuery, selectedLevel, selectedSource]);

  // Filter live logs
  const filteredLiveLogs = liveData ? liveData.logs.filter(log => {
    if (liveFilter.level && !liveFilter.level.includes(log.level)) return false;
    if (liveFilter.source && !log.source.includes(liveFilter.source)) return false;
    if (liveFilter.search && !log.message.toLowerCase().includes(liveFilter.search.toLowerCase())) return false;
    return true;
  }).slice(0, liveFilter.maxLines || 100) : [];

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
      case 'error': return 'text-red-400 border-red-400';
      case 'warn': return 'text-yellow-400 border-yellow-400';
      case 'info': return 'text-blue-400 border-blue-400';
      case 'debug': return 'text-gray-400 border-gray-400';
      default: return 'text-white border-white';
    }
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return <TrendingUp className="w-4 h-4 text-red-500" />;
      case 'down': return <TrendingDown className="w-4 h-4 text-green-500" />;
      case 'stable': return <Minus className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'complete': return 'text-green-500';
      case 'progressing': return 'text-blue-500';
      case 'failed': return 'text-red-500';
      default: return 'text-gray-500';
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
    let csvContent = '';
    
    if (selectedView === 'static') {
      csvContent = [
        'Timestamp,Level,Source,User,Action,Message',
        ...filteredStaticLogs.map(log => 
          `"${log.timestamp}","${log.level}","${log.source}","${log.user || ''}","${log.action || ''}","${log.message}"`
        )
      ].join('\n');
    } else {
      csvContent = [
        'Timestamp,Level,Source,Message,Namespace,Pod,Node',
        ...filteredLiveLogs.map(log => 
          `"${log.timestamp}","${log.level}","${log.source}","${log.message}","${log.metadata?.namespace || ''}","${log.metadata?.pod || ''}","${log.metadata?.node || ''}"`
        )
      ].join('\n');
    }
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', `denshimon-logs-${new Date().toISOString().split('T')[0]}.csv`);
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedLevel('all');
    setSelectedSource('all');
  };

  const uniqueSources = Array.from(new Set(staticLogs.map(log => log.source))).sort();

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-mono">SYSTEM LOGS</h1>
        <div className="flex items-center gap-4">
          {/* Live Stats (only show when in live/pods/deployments view) */}
          {liveData && (selectedView === 'live' || selectedView === 'pods' || selectedView === 'deployments') && (
            <div className="flex gap-4">
              <div className="text-sm font-mono">
                <span className="text-gray-500">LOGS/SEC:</span>
                <span className="ml-2">{liveData.stats.logsPerSecond.toFixed(1)}</span>
              </div>
              <div className="text-sm font-mono">
                <span className="text-gray-500">STREAMS:</span>
                <span className="ml-2">{liveData.stats.activeStreams}</span>
              </div>
              <div className="text-sm font-mono text-red-500">
                <span className="text-gray-500">ERROR:</span>
                <span className="ml-2">{liveData.stats.errorRate.toFixed(1)}%</span>
              </div>
              <div className="text-sm font-mono text-yellow-500">
                <span className="text-gray-500">WARN:</span>
                <span className="ml-2">{liveData.stats.warningRate.toFixed(1)}%</span>
              </div>
            </div>
          )}
          
          {/* Actions for static view */}
          {selectedView === 'static' && (
            <>
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
                onClick={refreshStaticLogs}
                disabled={isLoading}
                className="flex items-center space-x-2 px-3 py-1 border border-white text-white hover:bg-white hover:text-black transition-colors font-mono text-sm disabled:opacity-50"
              >
                <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
                <span>REFRESH</span>
              </button>
            </>
          )}
          
          {(selectedView === 'static' || selectedView === 'live') && (
            <button
              onClick={exportLogs}
              className="flex items-center space-x-2 px-3 py-1 border border-white text-white hover:bg-white hover:text-black transition-colors font-mono text-sm"
            >
              <Download size={14} />
              <span>EXPORT</span>
            </button>
          )}
        </div>
      </div>

      {/* View Tabs */}
      <div className="flex gap-2 border-b border-white pb-2">
        <button
          onClick={() => setSelectedView('static')}
          className={`px-4 py-2 font-mono text-sm transition-colors ${
            selectedView === 'static' ? 'bg-white text-black' : 'text-white hover:bg-white/10'
          }`}
        >
          <Table className="w-4 h-4 inline mr-2" />
          TABLE VIEW
        </button>
        <button
          onClick={() => setSelectedView('live')}
          className={`px-4 py-2 font-mono text-sm transition-colors ${
            selectedView === 'live' ? 'bg-white text-black' : 'text-white hover:bg-white/10'
          }`}
        >
          <Terminal className="w-4 h-4 inline mr-2" />
          LIVE STREAM
        </button>
        <button
          onClick={() => setSelectedView('pods')}
          className={`px-4 py-2 font-mono text-sm transition-colors ${
            selectedView === 'pods' ? 'bg-white text-black' : 'text-white hover:bg-white/10'
          }`}
        >
          <Activity className="w-4 h-4 inline mr-2" />
          TOP PODS
        </button>
        <button
          onClick={() => setSelectedView('deployments')}
          className={`px-4 py-2 font-mono text-sm transition-colors ${
            selectedView === 'deployments' ? 'bg-white text-black' : 'text-white hover:bg-white/10'
          }`}
        >
          <Package className="w-4 h-4 inline mr-2" />
          DEPLOYMENTS
        </button>
      </div>

      {/* Static Logs View */}
      {selectedView === 'static' && (
        <div className="space-y-4">
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
              <div className="text-lg font-mono">{filteredStaticLogs.length}</div>
              <div className="text-xs font-mono opacity-60">TOTAL</div>
            </div>
            {(['error', 'warn', 'info', 'debug'] as const).map(level => {
              const count = filteredStaticLogs.filter(log => log.level === level).length;
              return (
                <div key={level} className={`border p-3 text-center ${getLogLevelColor(level)}`}>
                  <div className="text-lg font-mono">{count}</div>
                  <div className="text-xs font-mono opacity-60">{level.toUpperCase()}</div>
                </div>
              );
            })}
          </div>

          {/* Log Entries Table */}
          <div className="border border-white">
            <div className="max-h-[500px] overflow-y-auto">
              {filteredStaticLogs.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="text-lg font-mono mb-2">NO LOGS FOUND</div>
                  <div className="text-sm font-mono opacity-60">
                    No log entries match your current filters
                  </div>
                </div>
              ) : (
                <div className="divide-y divide-white">
                  {filteredStaticLogs.map((log) => (
                    <div key={log.id} className="p-4 hover:bg-gray-900/20 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3 flex-1">
                          {getLevelIcon(log.level)}
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
      )}

      {/* Live Stream View */}
      {selectedView === 'live' && liveData && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex gap-2 items-center">
            <input
              type="text"
              placeholder="Search logs..."
              className="bg-black border border-white px-3 py-1 font-mono text-sm flex-1"
              onChange={(e) => setLiveFilter({ ...liveFilter, search: e.target.value })}
            />
            <div className="flex gap-2">
              {['error', 'warn', 'info', 'debug'].map(level => (
                <button
                  key={level}
                  onClick={() => {
                    const currentLevels = liveFilter.level || [];
                    const newLevels = currentLevels.includes(level as any)
                      ? currentLevels.filter(l => l !== level)
                      : [...currentLevels, level as any];
                    setLiveFilter({ ...liveFilter, level: newLevels.length > 0 ? newLevels : undefined });
                  }}
                  className={`px-3 py-1 font-mono text-xs border transition-colors ${
                    liveFilter.level?.includes(level as any) 
                      ? 'bg-white text-black border-white' 
                      : 'border-white/30 hover:border-white'
                  }`}
                >
                  {level.toUpperCase()}
                </button>
              ))}
            </div>
            <button
              onClick={() => setAutoScroll(!autoScroll)}
              className={`px-3 py-1 font-mono text-xs border transition-colors ${
                autoScroll ? 'bg-white text-black border-white' : 'border-white/30 hover:border-white'
              }`}
            >
              AUTO SCROLL
            </button>
          </div>

          {/* Terminal Output */}
          <div className="bg-black border border-white p-4 h-[500px] overflow-y-auto font-mono text-xs">
            <div className="space-y-1">
              {filteredLiveLogs.map((log, index) => (
                <div key={index} className="flex items-start gap-2 hover:bg-white/5">
                  <span className="text-gray-500 min-w-[140px]">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                  {getLevelIcon(log.level)}
                  <span className="text-cyan-500 min-w-[120px]">[{log.source}]</span>
                  <span className="flex-1">{log.message}</span>
                  {log.metadata && (
                    <span className="text-gray-500 text-xs">
                      {log.metadata.namespace}/{log.metadata.pod}
                    </span>
                  )}
                </div>
              ))}
              <div ref={logsEndRef} />
            </div>
          </div>
        </div>
      )}

      {/* Top Pods View */}
      {selectedView === 'pods' && liveData && (
        <div className="bg-black border border-white overflow-hidden">
          <table className="w-full font-mono text-sm">
            <thead>
              <tr className="border-b border-white">
                <th className="text-left p-3">POD</th>
                <th className="text-left p-3">NAMESPACE</th>
                <th className="text-right p-3">CPU %</th>
                <th className="text-center p-3">TREND</th>
                <th className="text-right p-3">MEMORY MB</th>
                <th className="text-center p-3">TREND</th>
                <th className="text-left p-3">LAST UPDATE</th>
              </tr>
            </thead>
            <tbody>
              {liveData.topPods.map((pod) => (
                <tr key={`${pod.namespace}-${pod.name}`} className="border-b border-white/20 hover:bg-white/5">
                  <td className="p-3">
                    <span className="text-cyan-500">{pod.name}</span>
                  </td>
                  <td className="p-3">{pod.namespace}</td>
                  <td className="p-3 text-right">
                    <span className={pod.cpu > 80 ? 'text-red-500' : pod.cpu > 60 ? 'text-yellow-500' : ''}>
                      {pod.cpu.toFixed(1)}
                    </span>
                  </td>
                  <td className="p-3 text-center">{getTrendIcon(pod.cpuTrend)}</td>
                  <td className="p-3 text-right">
                    <span className={pod.memory > 3000 ? 'text-red-500' : pod.memory > 2000 ? 'text-yellow-500' : ''}>
                      {pod.memory.toFixed(0)}
                    </span>
                  </td>
                  <td className="p-3 text-center">{getTrendIcon(pod.memoryTrend)}</td>
                  <td className="p-3 text-gray-500">
                    {new Date(pod.lastUpdate).toLocaleTimeString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Deployments View */}
      {selectedView === 'deployments' && liveData && (
        <div className="space-y-4">
          {liveData.deployments.map((deployment) => (
            <div key={`${deployment.namespace}-${deployment.name}`} className="bg-black border border-white p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="text-lg font-mono">
                    <span className="text-cyan-500">{deployment.name}</span>
                    <span className="text-gray-500 text-sm ml-2">({deployment.namespace})</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Strategy: {deployment.strategy} | Started: {new Date(deployment.startTime).toLocaleTimeString()}
                  </div>
                </div>
                <div className={`font-mono text-sm ${getStatusColor(deployment.status)}`}>
                  {deployment.status.toUpperCase()}
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Replicas: {deployment.replicas.current}/{deployment.replicas.desired}</span>
                  <span>Ready: {deployment.replicas.ready}</span>
                  <span>Updated: {deployment.replicas.updated}</span>
                </div>
                
                <div className="relative h-4 bg-black border border-white">
                  <div 
                    className={`absolute top-0 left-0 h-full transition-all duration-500 ${
                      deployment.status === 'failed' ? 'bg-red-500' : 
                      deployment.status === 'complete' ? 'bg-green-500' : 'bg-blue-500'
                    }`}
                    style={{ width: `${deployment.progress}%` }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center text-xs font-mono">
                    {deployment.progress.toFixed(0)}%
                  </div>
                </div>
                
                <div className="text-xs text-gray-500">
                  {deployment.message}
                  {deployment.estimatedCompletion && (
                    <span className="ml-2">
                      ETA: {new Date(deployment.estimatedCompletion).toLocaleTimeString()}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Logs;
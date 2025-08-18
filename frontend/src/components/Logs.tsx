import React, { useEffect, useState, useRef, useMemo } from 'react';
import { Terminal, Activity, Package, TrendingUp, TrendingDown, Minus, Download, RefreshCw, Table, Filter, Search } from 'lucide-react';
import { LiveTerminalData, TerminalFilter, PodResourceUsage, DeploymentProgress } from '@/types/liveTerminal';
import { generateMockLogs, mockApiResponse, MOCK_ENABLED } from '@mocks/index';
import type { LogEntry } from '@/types/logs';
import { Pod } from '@stores/workloadsStore';
import VirtualizedLogViewer from '@components/common/VirtualizedLogViewer';
import VirtualizedTable, { Column } from '@components/common/VirtualizedTable';
import { useWebSocket, useLogsWebSocket } from '@hooks/useWebSocket';
import { WebSocketEventType, PodStatus, LogsViewMode } from '@constants';
import { TrendDirection } from '@utils/status';

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
  const [selectedView, setSelectedView] = useState<LogsViewMode>(LogsViewMode.STATIC);

  // Load static logs
  useEffect(() => {
    loadStaticLogs();
  }, []);

  // WebSocket connections for real-time data
  const { data: podsData } = useWebSocket<{
    pods: PodResourceUsage[];
    timestamp: string;
  }>(WebSocketEventType.PODS);

  const { data: deploymentsData } = useWebSocket<{
    deployments: DeploymentProgress[];
    timestamp: string;
  }>(WebSocketEventType.DEPLOYMENTS);

  const { data: liveLogEntry } = useLogsWebSocket();

  // Handle WebSocket data to build LiveTerminalData
  useEffect(() => {
    if (!MOCK_ENABLED && (podsData || deploymentsData)) {
      setLiveData(prevData => {
        const transformedData: LiveTerminalData = {
          topPods: podsData ? podsData.pods.slice(0, 10).map((pod: PodResourceUsage) => ({
            name: pod.name,
            namespace: pod.namespace,
            cpu: pod.cpu || Math.random() * 100,
            cpuTrend: pod.cpuTrend || TrendDirection.STABLE,
            memory: pod.memory || Math.random() * 4000,
            memoryTrend: pod.memoryTrend || TrendDirection.STABLE,
            status: pod.status || PodStatus.RUNNING,
            lastUpdate: pod.lastUpdate || new Date().toISOString(),
          })) : (prevData?.topPods || []),
          deployments: deploymentsData ? deploymentsData.deployments.map((deployment: DeploymentProgress) => ({
            name: deployment.name,
            namespace: deployment.namespace,
            status: deployment.status,
            progress: deployment.progress,
            strategy: deployment.strategy,
            startTime: deployment.startTime,
            estimatedCompletion: deployment.estimatedCompletion,
            replicas: deployment.replicas,
            message: deployment.message,
          })) : (prevData?.deployments || []),
          logs: prevData?.logs || [],
          stats: {
            logsPerSecond: 10 + Math.random() * 50,
            activeStreams: 3 + Math.round(Math.random() * 7),
            errorRate: 0.5 + Math.random() * 2,
            warningRate: 2 + Math.random() * 5
          },
          lastUpdate: podsData?.timestamp || deploymentsData?.timestamp || new Date().toISOString(),
        };
        return transformedData;
      });
    }
  }, [podsData, deploymentsData]);

  // Handle incoming live log entries
  useEffect(() => {
    if (liveLogEntry && !MOCK_ENABLED) {
      setLiveData(prevData => {
        if (!prevData) return null;
        
        const newLog = {
          timestamp: liveLogEntry.timestamp,
          level: liveLogEntry.level as 'info' | 'warn' | 'error' | 'debug',
          source: liveLogEntry.source,
          message: liveLogEntry.message,
          metadata: liveLogEntry.metadata
        };
        
        return {
          ...prevData,
          logs: [newLog, ...prevData.logs.slice(0, 999)] // Keep max 1000 logs
        };
      });
    }
  }, [liveLogEntry]);

  // Fallback to mock data when MOCK_ENABLED
  useEffect(() => {
    if (MOCK_ENABLED && (selectedView === LogsViewMode.LIVE || selectedView === LogsViewMode.PODS || selectedView === LogsViewMode.DEPLOYMENTS)) {
      const { startLiveTerminalUpdates, stopLiveTerminalUpdates } = require('@mocks/terminal/liveData');
      const unsubscribe = startLiveTerminalUpdates(setLiveData);
      
      return () => {
        unsubscribe?.();
        stopLiveTerminalUpdates?.();
      };
    }
  }, [selectedView]);

  // Auto-scroll for live logs
  useEffect(() => {
    if (autoScroll && logsEndRef.current && selectedView === LogsViewMode.LIVE) {
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

  const exportLogs = () => {
    let csvContent = '';
    
    if (selectedView === LogsViewMode.STATIC) {
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

  // Convert logs to match VirtualizedLogViewer format
  const virtualizedLogs = useMemo(() => {
    return staticLogs.map(log => ({
      id: log.id,
      timestamp: log.timestamp,
      level: log.level as 'error' | 'warn' | 'info' | 'debug',
      source: log.source,
      message: log.message,
      metadata: log.metadata
    }));
  }, [staticLogs]);

  const liveLogs = useMemo(() => {
    return filteredLiveLogs.map(log => ({
      id: `live-${log.timestamp}-${Math.random()}`,
      timestamp: log.timestamp,
      level: log.level as 'error' | 'warn' | 'info' | 'debug',
      source: log.source,
      message: log.message,
      metadata: log.metadata
    }));
  }, [filteredLiveLogs]);

  // Pod table columns for top pods view
  const podColumns: Column[] = [
    {
      key: 'name',
      title: 'POD',
      minWidth: 200,
      render: (pod: Pod) => (
        <span className="text-cyan-500 font-mono text-sm">{pod.name}</span>
      ),
    },
    {
      key: 'namespace',
      title: 'NAMESPACE',
      width: 140,
      render: (pod: Pod) => (
        <span className="font-mono text-sm">{pod.namespace}</span>
      ),
    },
    {
      key: 'cpu',
      title: 'CPU %',
      width: 80,
      align: 'right' as const,
      render: (pod: Pod) => (
        <span className={`font-mono text-sm ${
          (pod.cpu || 0) > 80 ? 'text-red-500' : (pod.cpu || 0) > 60 ? 'text-yellow-500' : ''
        }`}>
          {(pod.cpu || 0).toFixed(1)}
        </span>
      ),
    },
    {
      key: 'cpuTrend',
      title: 'TREND',
      width: 60,
      align: 'center' as const,
      render: (pod: any) => getTrendIcon(pod.cpuTrend),
    },
    {
      key: 'memory',
      title: 'MEMORY MB',
      width: 100,
      align: 'right' as const,
      render: (pod: Pod) => (
        <span className={`font-mono text-sm ${
          (pod.memory || 0) > 3000 ? 'text-red-500' : (pod.memory || 0) > 2000 ? 'text-yellow-500' : ''
        }`}>
          {(pod.memory || 0).toFixed(0)}
        </span>
      ),
    },
    {
      key: 'memoryTrend',
      title: 'TREND',
      width: 60,
      align: 'center' as const,
      render: (pod: any) => getTrendIcon(pod.memoryTrend),
    },
    {
      key: 'lastUpdate',
      title: 'LAST UPDATE',
      width: 120,
      render: (pod: Pod) => (
        <span className="text-gray-500 font-mono text-sm">
          {pod.lastUpdate ? new Date(pod.lastUpdate).toLocaleTimeString() : 'N/A'}
        </span>
      ),
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-mono">LIVE STREAMS</h1>
        <div className="flex items-center gap-4">
          {/* Live Stats (only show when in live/pods/deployments view) */}
          {liveData && (selectedView === LogsViewMode.LIVE || selectedView === LogsViewMode.PODS || selectedView === LogsViewMode.DEPLOYMENTS) && (
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
          {selectedView === LogsViewMode.STATIC && (
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
          
          {(selectedView === LogsViewMode.STATIC || selectedView === LogsViewMode.LIVE) && (
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
          onClick={() => setSelectedView(LogsViewMode.STATIC)}
          className={`px-4 py-2 font-mono text-sm transition-colors ${
            selectedView === LogsViewMode.STATIC ? 'bg-white text-black' : 'text-white hover:bg-white/10'
          }`}
        >
          <Table className="w-4 h-4 inline mr-2" />
          TABLE VIEW
        </button>
        <button
          onClick={() => setSelectedView(LogsViewMode.LIVE)}
          className={`px-4 py-2 font-mono text-sm transition-colors ${
            selectedView === LogsViewMode.LIVE ? 'bg-white text-black' : 'text-white hover:bg-white/10'
          }`}
        >
          <Terminal className="w-4 h-4 inline mr-2" />
          LIVE STREAM
        </button>
        <button
          onClick={() => setSelectedView(LogsViewMode.PODS)}
          className={`px-4 py-2 font-mono text-sm transition-colors ${
            selectedView === LogsViewMode.PODS ? 'bg-white text-black' : 'text-white hover:bg-white/10'
          }`}
        >
          <Activity className="w-4 h-4 inline mr-2" />
          TOP PODS
        </button>
        <button
          onClick={() => setSelectedView(LogsViewMode.DEPLOYMENTS)}
          className={`px-4 py-2 font-mono text-sm transition-colors ${
            selectedView === LogsViewMode.DEPLOYMENTS ? 'bg-white text-black' : 'text-white hover:bg-white/10'
          }`}
        >
          <Package className="w-4 h-4 inline mr-2" />
          DEPLOYMENTS
        </button>
      </div>

      {/* Static Logs View */}
      {selectedView === LogsViewMode.STATIC && (
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

          {/* Virtualized Log Entries */}
          <VirtualizedLogViewer
            logs={virtualizedLogs.filter(log => {
              const matchesSearch = searchQuery === '' || 
                log.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
                log.source.toLowerCase().includes(searchQuery.toLowerCase());
              const matchesLevel = selectedLevel === 'all' || log.level === selectedLevel;
              const matchesSource = selectedSource === 'all' || log.source === selectedSource;
              return matchesSearch && matchesLevel && matchesSource;
            })}
            height={500}
            searchTerm={searchQuery}
            filterLevel={selectedLevel === 'all' ? undefined : [selectedLevel as any]}
            className="w-full"
          />
        </div>
      )}

      {/* Live Stream View */}
      {selectedView === LogsViewMode.LIVE && liveData && (
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

          {/* Live Log Stream */}
          <VirtualizedLogViewer
            logs={liveLogs}
            height={500}
            autoScroll={autoScroll}
            searchTerm={liveFilter.search}
            filterLevel={liveFilter.level}
            maxLogs={liveFilter.maxLines || 100}
            className="w-full"
          />
        </div>
      )}

      {/* Top Pods View */}
      {selectedView === LogsViewMode.PODS && liveData && (
        <VirtualizedTable
          data={liveData.topPods}
          columns={podColumns}
          containerHeight={500}
          rowHeight={48}
          className="w-full"
          emptyMessage="NO PODS DATA AVAILABLE"
        />
      )}

      {/* Deployments View */}
      {selectedView === LogsViewMode.DEPLOYMENTS && liveData && (
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
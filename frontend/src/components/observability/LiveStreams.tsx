import React, { useEffect, useState, useRef } from 'react';
import { Terminal, Activity, Package, TrendingUp, TrendingDown, Minus, Play, Pause, Square, Settings } from 'lucide-react';
import { LiveTerminalData, TerminalFilter } from '@/types/liveTerminal';
import { startLiveTerminalUpdates, stopLiveTerminalUpdates } from '@/mocks/terminal/liveData';

const LiveStreams: React.FC = () => {
  const [liveData, setLiveData] = useState<LiveTerminalData | null>(null);
  const [filter, setFilter] = useState<TerminalFilter>({ maxLines: 100 });
  const [autoScroll, setAutoScroll] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [viewMode, setViewMode] = useState<'terminal' | 'pods' | 'deployments'>('terminal');
  const logsEndRef = useRef<HTMLDivElement>(null);

  // Live terminal updates
  useEffect(() => {
    let unsubscribe: (() => void) | null = null;
    
    if (!isPaused) {
      unsubscribe = startLiveTerminalUpdates(setLiveData);
    }
    
    return () => {
      if (unsubscribe) {
        unsubscribe();
        stopLiveTerminalUpdates();
      }
    };
  }, [isPaused]);

  // Auto-scroll for live logs
  useEffect(() => {
    if (autoScroll && logsEndRef.current && viewMode === 'terminal') {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [liveData?.logs, autoScroll, viewMode]);

  // Filter live logs
  const filteredLogs = liveData ? liveData.logs.filter(log => {
    if (filter.level && !filter.level.includes(log.level)) return false;
    if (filter.source && !log.source.includes(filter.source)) return false;
    if (filter.search && !log.message.toLowerCase().includes(filter.search.toLowerCase())) return false;
    return true;
  }).slice(0, filter.maxLines || 100) : [];

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'error': return '❌';
      case 'warn': return '⚠️';
      case 'info': return 'ℹ️';
      case 'debug': return '🐛';
      default: return '📝';
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

  const toggleStream = () => {
    setIsPaused(!isPaused);
  };

  const clearTerminal = () => {
    if (liveData) {
      setLiveData({ ...liveData, logs: [] });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-mono">LIVE STREAMS</h2>
          <p className="text-sm text-gray-400 font-mono">Real-time monitoring and log streaming</p>
        </div>
        
        {liveData && (
          <div className="flex items-center gap-4">
            {/* Live Stats */}
            <div className="flex gap-4 text-sm font-mono">
              <div>
                <span className="text-gray-500">LOGS/SEC:</span>
                <span className="ml-2 text-green-400">{liveData.stats.logsPerSecond.toFixed(1)}</span>
              </div>
              <div>
                <span className="text-gray-500">STREAMS:</span>
                <span className="ml-2 text-blue-400">{liveData.stats.activeStreams}</span>
              </div>
              <div>
                <span className="text-gray-500">ERROR:</span>
                <span className="ml-2 text-red-400">{liveData.stats.errorRate.toFixed(1)}%</span>
              </div>
              <div>
                <span className="text-gray-500">WARN:</span>
                <span className="ml-2 text-yellow-400">{liveData.stats.warningRate.toFixed(1)}%</span>
              </div>
            </div>
            
            {/* Stream Controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={toggleStream}
                className={`flex items-center space-x-1 px-3 py-1 border font-mono text-sm transition-colors ${
                  isPaused 
                    ? 'border-green-500 text-green-400 hover:bg-green-500 hover:text-black' 
                    : 'border-yellow-500 text-yellow-400 hover:bg-yellow-500 hover:text-black'
                }`}
              >
                {isPaused ? <Play size={14} /> : <Pause size={14} />}
                <span>{isPaused ? 'RESUME' : 'PAUSE'}</span>
              </button>
              
              <button
                onClick={clearTerminal}
                className="flex items-center space-x-1 px-3 py-1 border border-red-500 text-red-400 hover:bg-red-500 hover:text-black transition-colors font-mono text-sm"
              >
                <Square size={14} />
                <span>CLEAR</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* View Mode Tabs */}
      <div className="flex gap-2 border-b border-white pb-2">
        <button
          onClick={() => setViewMode('terminal')}
          className={`px-4 py-2 font-mono text-sm transition-colors ${
            viewMode === 'terminal' ? 'bg-white text-black' : 'text-white hover:bg-white/10'
          }`}
        >
          <Terminal className="w-4 h-4 inline mr-2" />
          TERMINAL
        </button>
        <button
          onClick={() => setViewMode('pods')}
          className={`px-4 py-2 font-mono text-sm transition-colors ${
            viewMode === 'pods' ? 'bg-white text-black' : 'text-white hover:bg-white/10'
          }`}
        >
          <Activity className="w-4 h-4 inline mr-2" />
          TOP PODS
        </button>
        <button
          onClick={() => setViewMode('deployments')}
          className={`px-4 py-2 font-mono text-sm transition-colors ${
            viewMode === 'deployments' ? 'bg-white text-black' : 'text-white hover:bg-white/10'
          }`}
        >
          <Package className="w-4 h-4 inline mr-2" />
          DEPLOYMENTS
        </button>
      </div>

      {/* Terminal View */}
      {viewMode === 'terminal' && (
        <div className="space-y-4">
          {/* Terminal Filters */}
          <div className="flex gap-2 items-center bg-black border border-white/20 p-3">
            <input
              type="text"
              placeholder="Filter logs..."
              className="bg-black border border-white/30 px-3 py-1 font-mono text-sm flex-1 focus:outline-none focus:border-green-400"
              onChange={(e) => setFilter({ ...filter, search: e.target.value })}
            />
            <div className="flex gap-2">
              {['error', 'warn', 'info', 'debug'].map(level => (
                <button
                  key={level}
                  onClick={() => {
                    const currentLevels = filter.level || [];
                    const newLevels = currentLevels.includes(level as any)
                      ? currentLevels.filter(l => l !== level)
                      : [...currentLevels, level as any];
                    setFilter({ ...filter, level: newLevels.length > 0 ? newLevels : undefined });
                  }}
                  className={`px-3 py-1 font-mono text-xs border transition-colors ${
                    filter.level?.includes(level as any) 
                      ? 'bg-white text-black border-white' 
                      : 'border-white/30 hover:border-white'
                  }`}
                >
                  {level.toUpperCase()}
                </button>
              ))}
            </div>
            <div className="flex gap-2 items-center">
              <button
                onClick={() => setAutoScroll(!autoScroll)}
                className={`px-3 py-1 font-mono text-xs border transition-colors ${
                  autoScroll ? 'bg-white text-black border-white' : 'border-white/30 hover:border-white'
                }`}
              >
                AUTO SCROLL
              </button>
              <select
                value={filter.maxLines || 100}
                onChange={(e) => setFilter({ ...filter, maxLines: Number(e.target.value) })}
                className="bg-black border border-white/30 px-2 py-1 text-xs font-mono focus:outline-none focus:border-green-400"
              >
                <option value={50}>50 lines</option>
                <option value={100}>100 lines</option>
                <option value={200}>200 lines</option>
                <option value={500}>500 lines</option>
                <option value={1000}>1000 lines</option>
              </select>
            </div>
          </div>

          {/* Terminal Output */}
          <div className="bg-black border border-white">
            <div className="border-b border-white/20 px-4 py-2 flex items-center justify-between">
              <span className="font-mono text-sm">LIVE TERMINAL OUTPUT</span>
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${isPaused ? 'bg-yellow-500 animate-pulse' : 'bg-green-500'}`}></div>
                <span className="font-mono text-xs text-gray-400">
                  {isPaused ? 'PAUSED' : 'STREAMING'}
                </span>
              </div>
            </div>
            <div className="p-4 h-[500px] overflow-y-auto font-mono text-xs bg-black">
              <div className="space-y-1">
                {filteredLogs.length === 0 ? (
                  <div className="text-center py-20 text-gray-500">
                    {isPaused ? 'Stream paused - click RESUME to continue' : 'Waiting for log entries...'}
                  </div>
                ) : (
                  filteredLogs.map((log, index) => (
                    <div key={index} className="flex items-start gap-2 hover:bg-white/5 px-2 py-1 rounded">
                      <span className="text-gray-500 min-w-[140px] shrink-0">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                      <span className="text-xs">{getLevelIcon(log.level)}</span>
                      <span className="text-cyan-400 min-w-[120px] shrink-0">[{log.source}]</span>
                      <span className="flex-1 break-all">{log.message}</span>
                      {log.metadata && (
                        <span className="text-gray-500 text-xs shrink-0">
                          {log.metadata.namespace && `${log.metadata.namespace}/`}{log.metadata.pod}
                        </span>
                      )}
                    </div>
                  ))
                )}
                <div ref={logsEndRef} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Top Pods View */}
      {viewMode === 'pods' && liveData && (
        <div className="border border-white">
          <div className="border-b border-white px-4 py-2">
            <h3 className="font-mono text-sm font-bold">TOP RESOURCE CONSUMING PODS</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full font-mono text-sm">
              <thead>
                <tr className="border-b border-white/20">
                  <th className="text-left p-3">POD</th>
                  <th className="text-left p-3">NAMESPACE</th>
                  <th className="text-right p-3">CPU %</th>
                  <th className="text-center p-3">TREND</th>
                  <th className="text-right p-3">MEMORY MB</th>
                  <th className="text-center p-3">TREND</th>
                  <th className="text-left p-3">STATUS</th>
                  <th className="text-left p-3">LAST UPDATE</th>
                </tr>
              </thead>
              <tbody>
                {liveData.topPods.map((pod) => (
                  <tr key={`${pod.namespace}-${pod.name}`} className="border-b border-white/10 hover:bg-white/5">
                    <td className="p-3">
                      <span className="text-cyan-400 font-bold">{pod.name}</span>
                    </td>
                    <td className="p-3">
                      <span className="text-purple-400">{pod.namespace}</span>
                    </td>
                    <td className="p-3 text-right">
                      <span className={`font-bold ${
                        pod.cpu > 80 ? 'text-red-500' : 
                        pod.cpu > 60 ? 'text-yellow-500' : 
                        'text-green-500'
                      }`}>
                        {pod.cpu.toFixed(1)}%
                      </span>
                    </td>
                    <td className="p-3 text-center">{getTrendIcon(pod.cpuTrend)}</td>
                    <td className="p-3 text-right">
                      <span className={`font-bold ${
                        pod.memory > 3000 ? 'text-red-500' : 
                        pod.memory > 2000 ? 'text-yellow-500' : 
                        'text-green-500'
                      }`}>
                        {pod.memory.toFixed(0)}
                      </span>
                    </td>
                    <td className="p-3 text-center">{getTrendIcon(pod.memoryTrend)}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 text-xs ${
                        pod.status === 'Running' ? 'bg-green-500 text-black' :
                        pod.status === 'Pending' ? 'bg-yellow-500 text-black' :
                        'bg-red-500 text-white'
                      }`}>
                        {pod.status}
                      </span>
                    </td>
                    <td className="p-3 text-gray-400">
                      {new Date(pod.lastUpdate).toLocaleTimeString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Live Deployments View */}
      {viewMode === 'deployments' && liveData && (
        <div className="space-y-4">
          <div className="border border-white px-4 py-2">
            <h3 className="font-mono text-sm font-bold">ACTIVE DEPLOYMENTS</h3>
          </div>
          {liveData.deployments.map((deployment) => (
            <div key={`${deployment.namespace}-${deployment.name}`} className="border border-white p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="text-lg font-mono">
                    <span className="text-cyan-400 font-bold">{deployment.name}</span>
                    <span className="text-gray-500 text-sm ml-2">({deployment.namespace})</span>
                  </div>
                  <div className="text-xs text-gray-400 mt-1 space-x-4">
                    <span>Strategy: <span className="text-blue-400">{deployment.strategy}</span></span>
                    <span>Started: <span className="text-green-400">{new Date(deployment.startTime).toLocaleTimeString()}</span></span>
                    {deployment.estimatedCompletion && (
                      <span>ETA: <span className="text-yellow-400">{new Date(deployment.estimatedCompletion).toLocaleTimeString()}</span></span>
                    )}
                  </div>
                </div>
                <div className={`font-mono text-sm px-3 py-1 border ${getStatusColor(deployment.status)}`}>
                  {deployment.status.toUpperCase()}
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between text-sm font-mono">
                  <span>Replicas: <span className="text-cyan-400">{deployment.replicas.current}/{deployment.replicas.desired}</span></span>
                  <span>Ready: <span className="text-green-400">{deployment.replicas.ready}</span></span>
                  <span>Updated: <span className="text-blue-400">{deployment.replicas.updated}</span></span>
                  <span>Available: <span className="text-purple-400">{deployment.replicas.available || 0}</span></span>
                </div>
                
                <div className="relative h-6 bg-black border border-white">
                  <div 
                    className={`absolute top-0 left-0 h-full transition-all duration-1000 ${
                      deployment.status === 'failed' ? 'bg-red-500' : 
                      deployment.status === 'complete' ? 'bg-green-500' : 'bg-blue-500'
                    }`}
                    style={{ width: `${deployment.progress}%` }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center text-xs font-mono font-bold">
                    {deployment.progress.toFixed(0)}%
                  </div>
                </div>
                
                <div className="text-sm font-mono text-gray-300 bg-gray-900/20 p-2 border-l-4 border-l-blue-500">
                  {deployment.message}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LiveStreams;
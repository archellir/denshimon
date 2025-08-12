import React, { useEffect, useState, useRef } from 'react';
import { Terminal, Activity, Package, TrendingUp, TrendingDown, Minus, Play, Pause, Square, FileText } from 'lucide-react';
import { LiveTerminalData, TerminalFilter } from '@/types/liveTerminal';
import { startLiveTerminalUpdates, stopLiveTerminalUpdates } from '@/mocks/terminal/liveData';
import RealtimeLogViewer from './RealtimeLogViewer';

const LiveStreams: React.FC = () => {
  const [liveData, setLiveData] = useState<LiveTerminalData | null>(null);
  const [filter, setFilter] = useState<TerminalFilter>({ maxLines: 100 });
  const [autoScroll, setAutoScroll] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [viewMode, setViewMode] = useState<'pods' | 'logs' | 'deployments'>('pods');
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
    if (autoScroll && logsEndRef.current && viewMode === 'logs') {
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
      {/* Header with integrated tabs and controls */}
      <div className="flex items-center justify-between">
        {/* View Mode Tabs */}
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('pods')}
            className={`px-4 py-2 font-mono text-sm transition-colors ${
              viewMode === 'pods' ? 'bg-white text-black' : 'text-white hover:bg-white/10'
            }`}
          >
            <Activity className="w-4 h-4 inline mr-2" />
            Top Pods
          </button>
          <button
            onClick={() => setViewMode('logs')}
            className={`px-4 py-2 font-mono text-sm transition-colors ${
              viewMode === 'logs' ? 'bg-white text-black' : 'text-white hover:bg-white/10'
            }`}
          >
            <FileText className="w-4 h-4 inline mr-2" />
            Logs
          </button>
          <button
            onClick={() => setViewMode('deployments')}
            className={`px-4 py-2 font-mono text-sm transition-colors ${
              viewMode === 'deployments' ? 'bg-white text-black' : 'text-white hover:bg-white/10'
            }`}
          >
            <TrendingUp className="w-4 h-4 inline mr-2" />
            Deployments
          </button>
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

      {/* Logs View - Combined streaming logs */}
      {viewMode === 'logs' && (
        <div className="h-[600px]">
          <RealtimeLogViewer maxLogs={1000} autoScroll={true} />
        </div>
      )}

      {/* Deployments View */}
      {viewMode === 'deployments' && liveData && (
        <div className="space-y-4">
          <div className="border border-white px-4 py-2">
            <h3 className="font-mono text-sm font-bold">Active Deployments</h3>
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
import React, { useEffect, useState, useRef } from 'react';
import { Activity, TrendingUp, TrendingDown, Minus, Play, Pause, Square, FileText } from 'lucide-react';
import { LiveTerminalData, TerminalFilter, PodResourceUsage, DeploymentProgress } from '@/types/liveTerminal';
import { startLiveTerminalUpdates, stopLiveTerminalUpdates } from '@mocks/terminal/liveData';
import { useWebSocket } from '@hooks/useWebSocket';
import { WebSocketState, LiveStreamViewMode, DeploymentProgressStatus, PodStatus, UI_LABELS, UI_MESSAGES, WebSocketEventType } from '@constants';
import { MOCK_ENABLED } from '@/mocks';
import RealtimeLogViewer from './RealtimeLogViewer';

const LiveStreams: React.FC = () => {
  const [liveData, setLiveData] = useState<LiveTerminalData | null>(null);
  const [_filter] = useState<TerminalFilter>({ maxLines: 100 });
  const [autoScroll] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [viewMode, setViewMode] = useState<LiveStreamViewMode>(LiveStreamViewMode.PODS);
  const logsEndRef = useRef<HTMLDivElement>(null);

  // WebSocket connections for real-time data
  const { data: podsData, connectionState } = useWebSocket<{
    pods: PodResourceUsage[];
    timestamp: string;
  }>(WebSocketEventType.PODS);


  const { data: deploymentsData } = useWebSocket<{
    deployments: DeploymentProgress[];
    timestamp: string;
  }>(WebSocketEventType.DEPLOYMENTS);

  // Handle WebSocket data
  useEffect(() => {
    if ((podsData || deploymentsData) && !MOCK_ENABLED) {
      // Transform WebSocket data to LiveTerminalData format
      const transformedData: LiveTerminalData = {
        topPods: podsData ? podsData.pods.slice(0, 10).map((pod: PodResourceUsage) => ({
          name: pod.name,
          namespace: pod.namespace,
          cpu: pod.cpu || Math.random() * 100,
          cpuTrend: pod.cpuTrend || 'stable',
          memory: pod.memory || Math.random() * 4000,
          memoryTrend: pod.memoryTrend || 'stable',
          status: pod.status || PodStatus.RUNNING,
          lastUpdate: pod.lastUpdate || new Date().toISOString(),
        })) : [],
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
        })) : [],
        logs: [],
        stats: {
          logsPerSecond: 10 + Math.random() * 50,
          activeStreams: 3 + Math.round(Math.random() * 7),
          errorRate: 0.5 + Math.random() * 2,
          warningRate: 2 + Math.random() * 5
        },
        lastUpdate: podsData?.timestamp || deploymentsData?.timestamp || new Date().toISOString(),
      };
      setLiveData(transformedData);
    }
  }, [podsData, deploymentsData]);

  // Use mock data only when MOCK_ENABLED
  useEffect(() => {
    let unsubscribe: (() => void) | null = null;
    
    if (MOCK_ENABLED && !isPaused) {
      unsubscribe = startLiveTerminalUpdates(setLiveData);
    }
    
    return () => {
      if (unsubscribe) {
        unsubscribe();
        stopLiveTerminalUpdates();
      }
    };
  }, [isPaused]);

  // Show data from WebSocket when available, otherwise show mock data if enabled
  const displayData = (!MOCK_ENABLED && liveData) || (MOCK_ENABLED && liveData) || null;

  // Auto-scroll for live logs
  useEffect(() => {
    if (autoScroll && logsEndRef.current && viewMode === LiveStreamViewMode.LOGS) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [displayData?.logs, autoScroll, viewMode]);

  // Filter live logs
  // const filteredLogs = liveData ? liveData.logs.filter(log => {
  //   if (filter.level && !filter.level.includes(log.level)) return false;
  //   if (filter.source && !log.source.includes(filter.source)) return false;
  //   if (filter.search && !log.message.toLowerCase().includes(filter.search.toLowerCase())) return false;
  //   return true;
  // }).slice(0, filter.maxLines || 100) : [];

  // const _getLevelIcon = (level: string) => {
  //   switch (level) {
  //     case 'error': return '❌';
  //     case 'warn': return '⚠️';
  //     case 'info': return 'ℹ️';
  //     case 'debug': return '🐛';
  //     default: return '📝';
  //   }
  // };

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return <TrendingUp className="w-4 h-4 text-red-500" />;
      case 'down': return <TrendingDown className="w-4 h-4 text-green-500" />;
      case 'stable': return <Minus className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case DeploymentProgressStatus.COMPLETE: return 'text-green-500';
      case DeploymentProgressStatus.PROGRESSING: return 'text-blue-500';
      case DeploymentProgressStatus.FAILED: return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const toggleStream = () => {
    setIsPaused(!isPaused);
  };

  const clearTerminal = () => {
    if (displayData) {
      setLiveData({ ...displayData, logs: [] });
    }
  };

  const isConnected = connectionState.state === WebSocketState.CONNECTED;

  return (
    <div className="space-y-6">
      {/* Header with integrated tabs and controls */}
      <div className="flex items-center justify-between">
        {/* View Mode Tabs */}
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode(LiveStreamViewMode.PODS)}
            className={`px-4 py-2 font-mono text-sm transition-colors ${
              viewMode === LiveStreamViewMode.PODS ? 'bg-white text-black' : 'text-white hover:bg-white/10'
            }`}
          >
            <Activity className="w-4 h-4 inline mr-2" />
            {UI_LABELS.CONTAINER_PODS}
          </button>
          <button
            onClick={() => setViewMode(LiveStreamViewMode.LOGS)}
            className={`px-4 py-2 font-mono text-sm transition-colors ${
              viewMode === LiveStreamViewMode.LOGS ? 'bg-white text-black' : 'text-white hover:bg-white/10'
            }`}
          >
            <FileText className="w-4 h-4 inline mr-2" />
            {UI_LABELS.CONTAINER_LOGS}
          </button>
          <button
            onClick={() => setViewMode(LiveStreamViewMode.DEPLOYMENTS)}
            className={`px-4 py-2 font-mono text-sm transition-colors ${
              viewMode === LiveStreamViewMode.DEPLOYMENTS ? 'bg-white text-black' : 'text-white hover:bg-white/10'
            }`}
          >
            <TrendingUp className="w-4 h-4 inline mr-2" />
            {UI_LABELS.CONTAINER_DEPLOYMENTS}
          </button>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Stream Controls - Only show on logs tab */}
          {displayData && viewMode === LiveStreamViewMode.LOGS && (
            <div className="flex items-center gap-2">
              <button
                onClick={toggleStream}
                disabled={!isConnected}
                className={`flex items-center space-x-2 px-4 py-2 border font-mono text-xs transition-all w-28 justify-center ${
                  !isConnected
                    ? 'border-gray-500 text-gray-500 cursor-not-allowed opacity-50'
                    : isPaused 
                      ? 'border-green-500 text-green-400 hover:bg-green-500 hover:text-black' 
                      : 'border-yellow-500 text-yellow-400 hover:bg-yellow-500 hover:text-black'
                }`}
              >
                {isPaused ? <Play size={16} fill="currentColor" /> : <Pause size={16} fill="currentColor" />}
                <span>{isPaused ? UI_MESSAGES.RESUME : UI_MESSAGES.PAUSE}</span>
              </button>
              
              <button
                onClick={clearTerminal}
                className="flex items-center space-x-2 px-4 py-2 border border-red-500 text-red-400 hover:bg-red-500 hover:text-black transition-all font-mono text-xs w-28 justify-center"
              >
                <Square size={16} />
                <span>{UI_MESSAGES.CLEAR}</span>
              </button>
            </div>
          )}

        </div>
      </div>


      {/* Top Pods View */}
      {viewMode === LiveStreamViewMode.PODS && displayData && (
        <div className="border border-white">
          <div className="overflow-x-auto">
            <table className="w-full font-mono text-sm">
              <thead>
                <tr className="border-b border-white/20">
                  <th className="text-left p-3">POD</th>
                  <th className="text-left p-3">NAMESPACE</th>
                  <th className="text-right p-3">{UI_LABELS.CPU} %</th>
                  <th className="text-center p-3">{UI_LABELS.TREND}</th>
                  <th className="text-right p-3">{UI_LABELS.MEMORY} MB</th>
                  <th className="text-center p-3">{UI_LABELS.TREND}</th>
                  <th className="text-left p-3">STATUS</th>
                  <th className="text-left p-3">{UI_LABELS.LAST_UPDATE}</th>
                </tr>
              </thead>
              <tbody>
                {displayData.topPods.map((pod) => (
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
                        pod.status === PodStatus.RUNNING ? 'bg-green-500 text-black' :
                        pod.status === PodStatus.PENDING ? 'bg-yellow-500 text-black' :
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
      {viewMode === LiveStreamViewMode.LOGS && (
        <div className="h-[600px]">
          <RealtimeLogViewer maxLogs={1000} autoScroll={true} />
        </div>
      )}

      {/* Deployments View */}
      {viewMode === LiveStreamViewMode.DEPLOYMENTS && displayData && (
        <div className="space-y-4">
          {displayData.deployments.map((deployment) => (
            <div key={`${deployment.namespace}-${deployment.name}`} className="border border-white p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="text-lg font-mono">
                    <span className="text-cyan-400 font-bold">{deployment.name}</span>
                    <span className="text-gray-500 text-sm ml-2">({deployment.namespace})</span>
                  </div>
                  <div className="text-xs text-gray-400 mt-1 space-x-4">
                    <span>{UI_LABELS.STRATEGY}: <span className="text-blue-400">{deployment.strategy}</span></span>
                    <span>{UI_LABELS.STARTED}: <span className="text-green-400">{new Date(deployment.startTime).toLocaleTimeString()}</span></span>
                    {deployment.estimatedCompletion && (
                      <span>{UI_LABELS.ETA}: <span className="text-yellow-400">{new Date(deployment.estimatedCompletion).toLocaleTimeString()}</span></span>
                    )}
                  </div>
                </div>
                <div className={`font-mono text-sm px-3 py-1 border ${getStatusColor(deployment.status)}`}>
                  {deployment.status.toUpperCase()}
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between text-sm font-mono">
                  <span>{UI_LABELS.REPLICAS}: <span className="text-cyan-400">{deployment.replicas.current}/{deployment.replicas.desired}</span></span>
                  <span>{UI_LABELS.READY}: <span className="text-green-400">{deployment.replicas.ready}</span></span>
                  <span>{UI_LABELS.UPDATED}: <span className="text-blue-400">{deployment.replicas.updated}</span></span>
                  <span>{UI_LABELS.AVAILABLE}: <span className="text-purple-400">{deployment.replicas.available || 0}</span></span>
                </div>
                
                <div className="relative h-6 bg-black border border-white">
                  <div 
                    className={`absolute top-0 left-0 h-full transition-all duration-1000 ${
                      deployment.status === DeploymentProgressStatus.FAILED ? 'bg-red-500' : 
                      deployment.status === DeploymentProgressStatus.COMPLETE ? 'bg-green-500' : 'bg-blue-500'
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
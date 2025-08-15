import React, { useEffect, useState, useRef } from 'react';
import { Activity, TrendingUp, TrendingDown, Minus, Play, Pause, Square, FileText, Wifi, WifiOff, RotateCcw, AlertCircle } from 'lucide-react';
import { LiveTerminalData, TerminalFilter } from '@/types/liveTerminal';
import { startLiveTerminalUpdates, stopLiveTerminalUpdates } from '@/mocks/terminal/liveData';
import { getWebSocketInstance } from '@services/websocket';
import { WebSocketState, LiveStreamViewMode, DeploymentProgressStatus, PodStatus, UI_LABELS, UI_MESSAGES, API_ENDPOINTS } from '@/constants';
import { MOCK_ENABLED } from '@/mocks';
import { KubernetesPodAPI, Deployment } from '@/types';
import RealtimeLogViewer from './RealtimeLogViewer';

const LiveStreams: React.FC = () => {
  const [liveData, setLiveData] = useState<LiveTerminalData | null>(null);
  const [_filter] = useState<TerminalFilter>({ maxLines: 100 });
  const [autoScroll] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [viewMode, setViewMode] = useState<LiveStreamViewMode>(LiveStreamViewMode.PODS);
  const [connectionState, setConnectionState] = useState<WebSocketState>(WebSocketState.DISCONNECTED);
  const logsEndRef = useRef<HTMLDivElement>(null);

  // WebSocket connection status
  useEffect(() => {
    const ws = getWebSocketInstance();
    if (!ws) return;

    // Subscribe to connection status
    const connectionSubId = ws.subscribe('connection', (state) => {
      setConnectionState(state.state);
    });

    // Initial connection state
    setConnectionState(ws.getConnectionState() as WebSocketState);

    return () => {
      ws.unsubscribe(connectionSubId);
    };
  }, []);

  // Live data updates - API or mock
  useEffect(() => {
    let unsubscribe: (() => void) | null = null;
    let intervalId: NodeJS.Timeout | null = null;
    
    if (!isPaused) {
      if (MOCK_ENABLED) {
        unsubscribe = startLiveTerminalUpdates(setLiveData);
      } else {
        // Real API calls for live data
        const fetchLiveData = async () => {
          try {
            const token = localStorage.getItem('auth_token');
            const headers: Record<string, string> = {};
            if (token) {
              headers['Authorization'] = `Bearer ${token}`;
            }
            
            // Fetch pods metrics
            const podsResponse = await fetch(API_ENDPOINTS.KUBERNETES.PODS, { headers });
            const deploymentsResponse = await fetch(API_ENDPOINTS.KUBERNETES.DEPLOYMENTS, { headers });
            
            if (podsResponse.ok && deploymentsResponse.ok) {
              const podsData = await podsResponse.json();
              const deploymentsData = await deploymentsResponse.json();
              
              // Transform API data to LiveTerminalData format
              const transformedData: LiveTerminalData = {
                topPods: podsData.data?.slice(0, 10).map((pod: KubernetesPodAPI) => ({
                  name: pod.name,
                  namespace: pod.namespace,
                  cpu: pod.metrics?.cpuUsage || Math.random() * 100,
                  cpuTrend: Math.random() > 0.5 ? 'up' : Math.random() > 0.5 ? 'down' : 'stable',
                  memory: pod.metrics?.memoryUsage || Math.random() * 4000,
                  memoryTrend: Math.random() > 0.5 ? 'up' : Math.random() > 0.5 ? 'down' : 'stable',
                  status: pod.status || PodStatus.RUNNING,
                  lastUpdate: new Date().toISOString(),
                })) || [],
                deployments: deploymentsData.data?.filter((dep: Deployment) => dep.status === 'updating' || dep.status === 'progressing').map((dep: Deployment) => ({
                  name: dep.name,
                  namespace: dep.namespace,
                  status: dep.status === 'updating' ? DeploymentProgressStatus.PROGRESSING : DeploymentProgressStatus.PROGRESSING,
                  progress: dep.availableReplicas ? (dep.availableReplicas / dep.replicas) * 100 : Math.random() * 100,
                  strategy: dep.strategy?.type || 'RollingUpdate',
                  startTime: dep.updatedAt || new Date().toISOString(),
                  estimatedCompletion: new Date(Date.now() + Math.random() * 300000).toISOString(),
                  replicas: {
                    current: dep.availableReplicas || 0,
                    desired: dep.replicas || 1,
                    ready: dep.readyReplicas || 0,
                    updated: dep.updatedReplicas || 0,
                    available: dep.availableReplicas || 0,
                  },
                  message: `Updating ${dep.name} deployment...`,
                })) || [],
                logs: [],
                stats: {
                  logsPerSecond: 10 + Math.random() * 50,
                  activeStreams: 3 + Math.round(Math.random() * 7),
                  errorRate: 0.5 + Math.random() * 2,
                  warningRate: 2 + Math.random() * 5
                },
                lastUpdate: new Date().toISOString(),
              };
              
              setLiveData(transformedData);
            } else {
              // Fallback to mock data on API error
              const mockUnsubscribe = startLiveTerminalUpdates(setLiveData);
              return () => mockUnsubscribe && mockUnsubscribe();
            }
          } catch (error) {
            console.error('Failed to fetch live data:', error);
            // Fallback to mock data on error
            const mockUnsubscribe = startLiveTerminalUpdates(setLiveData);
            return () => mockUnsubscribe && mockUnsubscribe();
          }
        };
        
        // Initial fetch
        fetchLiveData();
        
        // Set up interval for periodic updates
        intervalId = setInterval(fetchLiveData, 5000); // Update every 5 seconds
      }
    }
    
    return () => {
      if (unsubscribe) {
        unsubscribe();
        stopLiveTerminalUpdates();
      }
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isPaused]);

  // Auto-scroll for live logs
  useEffect(() => {
    if (autoScroll && logsEndRef.current && viewMode === LiveStreamViewMode.LOGS) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [liveData?.logs, autoScroll, viewMode]);

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
    if (liveData) {
      setLiveData({ ...liveData, logs: [] });
    }
  };

  // Connection status helpers (matching WebSocketStatus component)
  const getStatusIcon = () => {
    switch (connectionState) {
      case WebSocketState.CONNECTED:
        return <Wifi size={16} className="text-green-500" />;
      case WebSocketState.CONNECTING:
        return <RotateCcw size={16} className="text-yellow-500 animate-spin" />;
      case WebSocketState.DISCONNECTED:
        return <WifiOff size={16} className="text-gray-500" />;
      case WebSocketState.ERROR:
        return <AlertCircle size={16} className="text-red-500" />;
      default:
        return <WifiOff size={16} className="text-gray-500" />;
    }
  };

  const getConnectionColor = () => {
    switch (connectionState) {
      case WebSocketState.CONNECTED:
        return 'border-green-500 text-green-500';
      case WebSocketState.CONNECTING:
        return 'border-yellow-500 text-yellow-500';
      case WebSocketState.DISCONNECTED:
        return 'border-gray-500 text-gray-500';
      case WebSocketState.ERROR:
        return 'border-red-500 text-red-500';
      default:
        return 'border-gray-500 text-gray-500';
    }
  };

  const getStatusText = () => {
    switch (connectionState) {
      case WebSocketState.CONNECTED:
        return UI_MESSAGES.LIVE;
      case WebSocketState.CONNECTING:
        return UI_MESSAGES.CONNECTING;
      case WebSocketState.DISCONNECTED:
        return UI_MESSAGES.OFFLINE;
      case WebSocketState.ERROR:
        return UI_MESSAGES.ERROR;
      default:
        return UI_MESSAGES.UNKNOWN;
    }
  };

  const isConnected = connectionState === WebSocketState.CONNECTED;

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
            {UI_LABELS.VPS_PODS}
          </button>
          <button
            onClick={() => setViewMode(LiveStreamViewMode.LOGS)}
            className={`px-4 py-2 font-mono text-sm transition-colors ${
              viewMode === LiveStreamViewMode.LOGS ? 'bg-white text-black' : 'text-white hover:bg-white/10'
            }`}
          >
            <FileText className="w-4 h-4 inline mr-2" />
            {UI_LABELS.VPS_LOGS}
          </button>
          <button
            onClick={() => setViewMode(LiveStreamViewMode.DEPLOYMENTS)}
            className={`px-4 py-2 font-mono text-sm transition-colors ${
              viewMode === LiveStreamViewMode.DEPLOYMENTS ? 'bg-white text-black' : 'text-white hover:bg-white/10'
            }`}
          >
            <TrendingUp className="w-4 h-4 inline mr-2" />
            {UI_LABELS.VPS_DEPLOYMENTS}
          </button>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Stream Controls - Only show on logs tab */}
          {liveData && viewMode === LiveStreamViewMode.LOGS && (
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

          {/* Connection Status - Far Right */}
          <div className="relative group ml-auto">
            <div className={`flex items-center space-x-2 px-4 py-2 border font-mono text-xs transition-all w-28 justify-center ${getConnectionColor()}`}>
              {getStatusIcon()}
              <span>{getStatusText()}</span>
            </div>
            
            {/* Tooltip */}
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-black border border-white text-xs font-mono whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
              {UI_MESSAGES.REAL_TIME_UPDATES} {connectionState}
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-white"></div>
            </div>

            {/* Pulse effect when connecting */}
            {connectionState === WebSocketState.CONNECTING && (
              <div className="absolute inset-0 border border-yellow-500 animate-pulse pointer-events-none"></div>
            )}
          </div>
        </div>
      </div>


      {/* Top Pods View */}
      {viewMode === LiveStreamViewMode.PODS && liveData && (
        <div className="border border-white">
          <div className="border-b border-white px-4 py-2">
            <h3 className="font-mono text-sm font-bold">{UI_LABELS.TOP_VPS_RESOURCE_CONSUMING_PODS}</h3>
          </div>
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
      {viewMode === LiveStreamViewMode.DEPLOYMENTS && liveData && (
        <div className="space-y-4">
          <div className="border border-white px-4 py-2">
            <h3 className="font-mono text-sm font-bold">{UI_LABELS.ACTIVE_VPS_DEPLOYMENTS}</h3>
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
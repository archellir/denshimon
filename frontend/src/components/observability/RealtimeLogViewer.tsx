import { useState, useEffect, useRef, FC } from 'react';
import { Play, Pause, Trash2, Download, Filter, AlertCircle, Info, AlertTriangle, Bug } from 'lucide-react';
import { getWebSocketInstance } from '@services/websocket';

interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  source: string;
  namespace: string;
  message: string;
  metadata?: {
    pod?: string;
    namespace?: string;
    node?: string;
  };
}

interface RealtimeLogViewerProps {
  maxLogs?: number;
  autoScroll?: boolean;
}

const RealtimeLogViewer: FC<RealtimeLogViewerProps> = ({ 
  maxLogs = 1000, 
  autoScroll = true 
}) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const [filter, setFilter] = useState({
    level: 'all',
    namespace: 'all',
    search: ''
  });
  const [isConnected, setIsConnected] = useState(false);
  const logContainerRef = useRef<HTMLDivElement>(null);
  const subscriptionIdRef = useRef<string | null>(null);

  // Subscribe to WebSocket logs
  useEffect(() => {
    const ws = getWebSocketInstance();
    if (!ws) return;

    // Subscribe to connection status
    const connectionSubId = ws.subscribe('connection', (state) => {
      setIsConnected(state.state === 'connected');
    });

    // Subscribe to logs
    if (!isPaused) {
      subscriptionIdRef.current = ws.subscribe('logs', (logData) => {
        const newLog: LogEntry = {
          id: logData.id || Date.now().toString(),
          timestamp: logData.timestamp,
          level: logData.level,
          source: logData.source,
          namespace: logData.namespace,
          message: logData.message,
          metadata: logData.metadata
        };

        setLogs(prevLogs => {
          const updated = [newLog, ...prevLogs];
          // Keep only the latest maxLogs entries
          return updated.slice(0, maxLogs);
        });
      });
    }

    return () => {
      if (subscriptionIdRef.current) {
        ws.unsubscribe(subscriptionIdRef.current);
      }
      ws.unsubscribe(connectionSubId);
    };
  }, [isPaused, maxLogs]);

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (autoScroll && !isPaused && logContainerRef.current) {
      // Keep scroll at top since we're adding logs at the top
      logContainerRef.current.scrollTop = 0;
    }
  }, [logs, autoScroll, isPaused]);

  // Filter logs
  const filteredLogs = logs.filter(log => {
    if (filter.level !== 'all' && log.level !== filter.level) return false;
    if (filter.namespace !== 'all' && log.namespace !== filter.namespace) return false;
    if (filter.search && !log.message.toLowerCase().includes(filter.search.toLowerCase())) return false;
    return true;
  });

  // Get unique namespaces from logs
  const namespaces = Array.from(new Set(logs.map(log => log.namespace)));

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'error': return <AlertCircle className="text-red-500" size={14} />;
      case 'warn': return <AlertTriangle className="text-yellow-500" size={14} />;
      case 'debug': return <Bug className="text-blue-500" size={14} />;
      default: return <Info className="text-green-500" size={14} />;
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'error': return 'text-red-400 border-red-500/30';
      case 'warn': return 'text-yellow-400 border-yellow-500/30';
      case 'debug': return 'text-blue-400 border-blue-500/30';
      default: return 'text-green-400 border-green-500/30';
    }
  };

  const handleClear = () => {
    setLogs([]);
  };

  const handleExport = () => {
    const logText = filteredLogs.map(log => 
      `[${log.timestamp}] [${log.level.toUpperCase()}] [${log.namespace}] ${log.source}: ${log.message}`
    ).join('\n');
    
    const blob = new Blob([logText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `logs-${new Date().toISOString()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Controls */}
      <div className="border-b border-white/20 p-4">

        {/* Filters */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Filter size={14} />
              <span className="text-xs font-mono">FILTER:</span>
            </div>

            {/* Level Filter */}
          <select
            value={filter.level}
            onChange={(e) => setFilter({ ...filter, level: e.target.value })}
            className="bg-black border border-white/30 px-2 py-1 text-xs font-mono focus:outline-none focus:border-green-400"
          >
            <option value="all">ALL LEVELS</option>
            <option value="info">INFO</option>
            <option value="warn">WARN</option>
            <option value="error">ERROR</option>
            <option value="debug">DEBUG</option>
          </select>

          {/* Namespace Filter */}
          <select
            value={filter.namespace}
            onChange={(e) => setFilter({ ...filter, namespace: e.target.value })}
            className="bg-black border border-white/30 px-2 py-1 text-xs font-mono focus:outline-none focus:border-green-400"
          >
            <option value="all">ALL NAMESPACES</option>
            {namespaces.map(ns => (
              <option key={ns} value={ns}>{ns}</option>
            ))}
          </select>

          {/* Search */}
          <input
            type="text"
            placeholder="Search logs..."
            value={filter.search}
            onChange={(e) => setFilter({ ...filter, search: e.target.value })}
            className="bg-black border border-white/30 px-2 py-1 text-xs font-mono placeholder-gray-500 focus:outline-none focus:border-green-400"
          />
          </div>

          {/* Live Stats */}
          <div className="flex gap-8 text-sm font-mono">
            <div className="w-32">
              <span className="text-gray-500">LOGS/SEC:</span>
              <span className="ml-2 text-green-400">{logs.length > 0 ? '8.0' : '0.0'}</span>
            </div>
            <div className="w-28">
              <span className="text-gray-500">STREAMS:</span>
              <span className="ml-2 text-blue-400">12</span>
            </div>
            <div className="w-24">
              <span className="text-gray-500">ERROR:</span>
              <span className="ml-2 text-red-400">{((logs.filter(l => l.level === 'error').length / Math.max(logs.length, 1)) * 100).toFixed(1)}%</span>
            </div>
            <div className="w-24">
              <span className="text-gray-500">WARN:</span>
              <span className="ml-2 text-yellow-400">{((logs.filter(l => l.level === 'warn').length / Math.max(logs.length, 1)) * 100).toFixed(1)}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Log Stream */}
      <div 
        ref={logContainerRef}
        className="flex-1 overflow-y-auto font-mono text-xs p-4 space-y-1"
        style={{ 
          maxHeight: 'calc(100vh - 300px)',
          backgroundColor: '#0a0a0a'
        }}
      >
        {filteredLogs.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {isPaused ? 'Streaming paused' : 'Waiting for logs...'}
          </div>
        ) : (
          filteredLogs.map(log => (
            <div 
              key={log.id}
              className={`flex items-start space-x-2 py-1 px-2 border-l-2 hover:bg-white/5 ${getLevelColor(log.level)}`}
            >
              {/* Level Icon */}
              <div className="flex-shrink-0 mt-0.5">
                {getLevelIcon(log.level)}
              </div>

              {/* Timestamp */}
              <div className="flex-shrink-0 text-gray-500">
                {new Date(log.timestamp).toLocaleTimeString('en-US', { 
                  hour12: false,
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                  fractionalSecondDigits: 3
                } as any)}
              </div>

              {/* Namespace */}
              <div className="flex-shrink-0 text-purple-400">
                [{log.namespace}]
              </div>

              {/* Source */}
              <div className="flex-shrink-0 text-cyan-400">
                {log.source}
              </div>

              {/* Message */}
              <div className="flex-1 text-white/90 break-all">
                {log.message}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Stats Bar */}
      <div className="border-t border-white/20 p-2 flex items-center justify-between text-xs font-mono">
        <div className="flex items-center space-x-4">
          <span className="text-green-400">INFO: {logs.filter(l => l.level === 'info').length}</span>
          <span className="text-yellow-400">WARN: {logs.filter(l => l.level === 'warn').length}</span>
          <span className="text-red-400">ERROR: {logs.filter(l => l.level === 'error').length}</span>
          <span className="text-blue-400">DEBUG: {logs.filter(l => l.level === 'debug').length}</span>
        </div>
        <div className="text-gray-500">
          {isPaused ? 'PAUSED' : `STREAMING (${logs.length} total)`}
        </div>
      </div>
    </div>
  );
};

export default RealtimeLogViewer;
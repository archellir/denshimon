import React, { useEffect, useState, useMemo } from 'react';
import { Package, AlertCircle, Info, AlertTriangle, Bug, Layers, FileText, Globe } from 'lucide-react';
import { generateMockLogs, mockApiResponse, MOCK_ENABLED } from '@mocks/index';
import type { LogEntry } from '@/types/logs';
import { useLogsWebSocket } from '@hooks/useWebSocket';
import { 
  LogLevel, 
  UI_LABELS, 
  UI_MESSAGES,
  API_ENDPOINTS,
  Status 
} from '@constants';
import CustomSelector from '@components/common/CustomSelector';
import StatCard from '@components/common/StatCard';

const LogData: React.FC = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [selectedSource, setSelectedSource] = useState<string>('all');
  const [selectedNamespace, setSelectedNamespace] = useState<string>('all');

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


  const loadLogs = async () => {
    try {
      if (MOCK_ENABLED) {
        const mockLogs = await mockApiResponse(generateMockLogs(200));
        setLogs(mockLogs);
      } else {
        // Load from API
        const token = localStorage.getItem('auth_token');
        const response = await fetch(`${API_ENDPOINTS.OBSERVABILITY.LOG_DATA}?limit=200`, {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
        
        if (response.ok) {
          const data = await response.json();
          setLogs(data.logs || []);
        } else {
          // Fallback to mock data on API failure
          const mockLogs = await mockApiResponse(generateMockLogs(200));
          setLogs(mockLogs);
        }
      }
    } catch (error) {
      console.error('Failed to load logs:', error);
      // Fallback to mock data on error
      const mockLogs = await mockApiResponse(generateMockLogs(200));
      setLogs(mockLogs);
    }
  };

  // Filter logs
  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const matchesLevel = selectedLevel === 'all' || log.level === selectedLevel;
      const matchesSource = selectedSource === 'all' || log.source === selectedSource;
      
      // Extract namespace from metadata if available
      const logNamespace = log.metadata?.namespace || 'default';
      const matchesNamespace = selectedNamespace === 'all' || logNamespace === selectedNamespace;
      
      return matchesLevel && matchesSource && matchesNamespace;
    });
  }, [logs, selectedLevel, selectedSource, selectedNamespace]);

  const getLevelIcon = (level: LogLevel) => {
    switch (level) {
      case LogLevel.ERROR: return <AlertCircle className="w-4 h-4 text-red-500" />;
      case LogLevel.WARN: return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case LogLevel.INFO: return <Info className="w-4 h-4 text-blue-500" />;
      case LogLevel.DEBUG: return <Bug className="w-4 h-4 text-gray-500" />;
      default: return null;
    }
  };

  const getLogLevelColor = (level: LogLevel) => {
    switch (level) {
      case LogLevel.ERROR: return 'text-red-400 border-red-400 bg-red-900/10';
      case LogLevel.WARN: return 'text-yellow-400 border-yellow-400 bg-yellow-900/10';
      case LogLevel.INFO: return 'text-blue-400 border-blue-400 bg-blue-900/10';
      case LogLevel.DEBUG: return 'text-gray-400 border-gray-400 bg-gray-900/10';
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


  const clearFilters = () => {
    setSelectedLevel('all');
    setSelectedSource('all');
    setSelectedNamespace('all');
  };


  const uniqueSources = Array.from(new Set(logs.map(log => log.source))).sort();
  const uniqueNamespaces = Array.from(new Set(logs.map(log => log.metadata?.namespace || 'default'))).sort();

  return (
    <div className="space-y-6">

      {/* Log Stats */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <StatCard
          label={UI_LABELS.CONTAINER_LOGS}
          value={filteredLogs.length.toString()}
          icon={FileText}
          status={Status.HEALTHY}
          variant="centered"
        />
        {([LogLevel.ERROR, LogLevel.WARN, LogLevel.INFO, LogLevel.DEBUG] as const).map(level => {
          const count = filteredLogs.filter(log => log.level === level).length;
          const percentage = filteredLogs.length > 0 ? ((count / filteredLogs.length) * 100).toFixed(1) : '0';
          const getIconForLevel = (level: LogLevel) => {
            switch (level) {
              case LogLevel.ERROR: return AlertCircle;
              case LogLevel.WARN: return AlertTriangle;
              case LogLevel.INFO: return Info;
              case LogLevel.DEBUG: return Bug;
              default: return Info;
            }
          };
          const getStatusForLevel = (level: LogLevel) => {
            switch (level) {
              case LogLevel.ERROR: return Status.CRITICAL;
              case LogLevel.WARN: return Status.WARNING;
              case LogLevel.INFO: return Status.INFO;
              case LogLevel.DEBUG: return Status.INFO;
              default: return Status.HEALTHY;
            }
          };
          return (
            <StatCard
              key={level}
              label={level.toUpperCase()}
              value={count.toString()}
              icon={getIconForLevel(level)}
              status={getStatusForLevel(level)}
              variant="centered"
              description={`${percentage}%`}
            />
          );
        })}
        <StatCard
          label={UI_LABELS.CONTAINER_SERVICES}
          value={uniqueSources.length.toString()}
          icon={Globe}
          status={Status.HEALTHY}
          variant="centered"
        />
      </div>

      {/* Filters */}
      <div className="space-y-4">
        <div className="border border-white p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-mono mb-2 text-gray-400">LOG LEVEL</label>
                <CustomSelector
                  value={selectedLevel}
                  options={[
                    { value: 'all', label: UI_LABELS.ALL_LEVELS },
                    { value: LogLevel.ERROR, label: UI_LABELS.ERROR },
                    { value: LogLevel.WARN, label: UI_LABELS.WARN },
                    { value: LogLevel.INFO, label: UI_LABELS.INFO },
                    { value: LogLevel.DEBUG, label: UI_LABELS.DEBUG }
                  ]}
                  onChange={(value) => setSelectedLevel(value)}
                  placeholder="Select Level"
                  icon={Layers}
                  size="sm"
                />
              </div>
              
              <div>
                <label className="block text-xs font-mono mb-2 text-gray-400">SOURCE</label>
                <CustomSelector
                  value={selectedSource}
                  options={[
                    { value: 'all', label: UI_LABELS.ALL_SOURCES },
                    ...uniqueSources.map(source => ({
                      value: source,
                      label: source.toUpperCase()
                    }))
                  ]}
                  onChange={(value) => setSelectedSource(value)}
                  placeholder="Select Source"
                  icon={FileText}
                  size="sm"
                />
              </div>
              
              <div>
                <label className="block text-xs font-mono mb-2 text-gray-400">NAMESPACE</label>
                <CustomSelector
                  value={selectedNamespace}
                  options={[
                    { value: 'all', label: UI_LABELS.ALL_NAMESPACES },
                    ...uniqueNamespaces.map(namespace => ({
                      value: namespace,
                      label: namespace.toUpperCase()
                    }))
                  ]}
                  onChange={(value) => setSelectedNamespace(value)}
                  placeholder="Select Namespace"
                  icon={Globe}
                  size="sm"
                />
              </div>
              
              <div className="flex items-end">
                <button
                  onClick={clearFilters}
                  className="px-4 py-2 border border-white/30 text-white hover:bg-white hover:text-black transition-colors font-mono text-sm"
                >
{UI_MESSAGES.CLEAR_FILTERS}
                </button>
              </div>
            </div>
          </div>
      </div>

      {/* Log Entries */}
      <div className="border border-white">
        <div className="max-h-[600px] overflow-y-auto">
          {filteredLogs.length === 0 ? (
            <div className="p-8 text-center">
              <Package className="w-12 h-12 mx-auto mb-4 text-gray-500" />
              <div className="text-lg font-mono mb-2">{UI_MESSAGES.NO_CONTAINER_LOGS}</div>
              <div className="text-sm font-mono opacity-60">
                {selectedLevel !== 'all' || selectedSource !== 'all' || selectedNamespace !== 'all' 
                  ? 'No log entries match your current filters'
                  : 'No log entries available'
                }
              </div>
            </div>
          ) : (
            <div className="divide-y divide-white/10">
              {filteredLogs.map((log) => (
                <div key={log.id} className={`p-4 hover:bg-white/5 transition-colors border-l-4 ${
                  log.level === LogLevel.ERROR ? 'border-l-red-500' :
                  log.level === LogLevel.WARN ? 'border-l-yellow-500' :
                  log.level === LogLevel.INFO ? 'border-l-blue-500' :
                  log.level === LogLevel.DEBUG ? 'border-l-gray-500' :
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

export default LogData;
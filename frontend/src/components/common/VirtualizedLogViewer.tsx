import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import type { FC } from 'react';
import { AlertCircle, AlertTriangle, Info, Bug } from 'lucide-react';

export interface LogEntry {
  id?: string;
  timestamp: string;
  level: 'error' | 'warn' | 'info' | 'debug';
  source: string;
  message: string;
  metadata?: Record<string, any>;
}

export interface VirtualizedLogViewerProps {
  logs: LogEntry[];
  height?: number;
  lineHeight?: number;
  overscan?: number;
  autoScroll?: boolean;
  showTimestamp?: boolean;
  showLevel?: boolean;
  showSource?: boolean;
  className?: string;
  onLogClick?: (log: LogEntry, index: number) => void;
  filterLevel?: string[];
  searchTerm?: string;
  maxLogs?: number;
}

const VirtualizedLogViewer: FC<VirtualizedLogViewerProps> = ({
  logs,
  height = 400,
  lineHeight = 24,
  overscan = 10,
  autoScroll = true,
  showTimestamp = true,
  showLevel = true,
  showSource = true,
  className = '',
  onLogClick,
  filterLevel,
  searchTerm,
  maxLogs = 1000,
}) => {
  const [scrollTop, setScrollTop] = useState(0);
  const scrollElementRef = useRef<HTMLDivElement>(null);
  const isUserScrolling = useRef(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Filter and limit logs
  const filteredLogs = useMemo(() => {
    let filtered = [...logs];

    // Apply level filter
    if (filterLevel && filterLevel.length > 0) {
      filtered = filtered.filter(log => filterLevel.includes(log.level));
    }

    // Apply search filter
    if (searchTerm && searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(log => 
        log.message.toLowerCase().includes(term) ||
        log.source.toLowerCase().includes(term) ||
        (log.metadata && JSON.stringify(log.metadata).toLowerCase().includes(term))
      );
    }

    // Limit to max logs for performance
    return filtered.slice(-maxLogs);
  }, [logs, filterLevel, searchTerm, maxLogs]);

  const totalHeight = filteredLogs.length * lineHeight;
  const visibleCount = Math.ceil(height / lineHeight);
  
  const startIndex = Math.max(0, Math.floor(scrollTop / lineHeight) - overscan);
  const endIndex = Math.min(filteredLogs.length - 1, startIndex + visibleCount + 2 * overscan);

  const visibleLogs = useMemo(() => {
    return filteredLogs.slice(startIndex, endIndex + 1);
  }, [filteredLogs, startIndex, endIndex]);

  const handleScroll = useCallback((e: Event) => {
    const target = e.target as HTMLDivElement;
    setScrollTop(target.scrollTop);
    
    // Track user scrolling
    isUserScrolling.current = true;
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    scrollTimeoutRef.current = setTimeout(() => {
      isUserScrolling.current = false;
    }, 150);
  }, []);

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (autoScroll && !isUserScrolling.current && scrollElementRef.current) {
      const scrollElement = scrollElementRef.current;
      scrollElement.scrollTop = scrollElement.scrollHeight;
    }
  }, [filteredLogs, autoScroll]);

  useEffect(() => {
    const scrollElement = scrollElementRef.current;
    if (scrollElement) {
      scrollElement.addEventListener('scroll', handleScroll);
      return () => scrollElement.removeEventListener('scroll', handleScroll);
    }
  }, [handleScroll]);

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'error': return <AlertCircle className="w-3 h-3 text-red-400 flex-shrink-0" />;
      case 'warn': return <AlertTriangle className="w-3 h-3 text-yellow-400 flex-shrink-0" />;
      case 'info': return <Info className="w-3 h-3 text-blue-400 flex-shrink-0" />;
      case 'debug': return <Bug className="w-3 h-3 text-gray-400 flex-shrink-0" />;
      default: return <div className="w-3 h-3 flex-shrink-0" />;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const highlightSearchTerm = (text: string, term: string) => {
    if (!term || !term.trim()) return text;
    
    const regex = new RegExp(`(${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <span key={index} className="bg-yellow-400 text-black px-1">
          {part}
        </span>
      ) : part
    );
  };

  if (filteredLogs.length === 0) {
    return (
      <div className={`bg-black border border-white p-4 font-mono ${className}`} style={{ height }}>
        <div className="flex items-center justify-center h-full">
          <div className="text-center text-gray-400">
            <div className="text-sm mb-2">NO LOGS AVAILABLE</div>
            <div className="text-xs opacity-60">
              {logs.length > 0 ? 'No logs match current filters' : 'Waiting for log entries...'}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-black border border-white overflow-hidden font-mono ${className}`}>
      {/* Header */}
      <div className="border-b border-white/20 px-4 py-2 text-xs text-gray-400 flex items-center justify-between">
        <div>
          {filteredLogs.length.toLocaleString()} entries
          {logs.length !== filteredLogs.length && ` (${logs.length.toLocaleString()} total)`}
        </div>
        <div className="flex items-center space-x-4">
          {autoScroll && (
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span>AUTO SCROLL</span>
            </div>
          )}
        </div>
      </div>

      {/* Log content */}
      <div
        ref={scrollElementRef}
        className="overflow-auto text-xs"
        style={{ height: height - 32 }} // Account for header
      >
        {/* Virtual scroll container */}
        <div style={{ height: totalHeight, position: 'relative' }}>
          {/* Visible log lines */}
          <div style={{ transform: `translateY(${startIndex * lineHeight}px)` }}>
            {visibleLogs.map((log, virtualIndex) => {
              const actualIndex = startIndex + virtualIndex;
              const logId = log.id || `log-${actualIndex}`;
              
              return (
                <div
                  key={logId}
                  className={`flex items-start gap-2 px-4 py-1 hover:bg-white/5 transition-colors ${
                    onLogClick ? 'cursor-pointer' : ''
                  }`}
                  style={{ height: lineHeight, minHeight: lineHeight }}
                  onClick={onLogClick ? () => onLogClick(log, actualIndex) : undefined}
                >
                  {/* Timestamp */}
                  {showTimestamp && (
                    <span className="text-gray-500 font-mono text-xs min-w-[80px] flex-shrink-0">
                      {formatTimestamp(log.timestamp)}
                    </span>
                  )}
                  
                  {/* Level icon */}
                  {showLevel && (
                    <div className="flex items-center min-w-[16px] flex-shrink-0">
                      {getLevelIcon(log.level)}
                    </div>
                  )}
                  
                  {/* Source */}
                  {showSource && (
                    <span className="text-cyan-400 font-mono text-xs min-w-[100px] max-w-[100px] truncate flex-shrink-0">
                      [{log.source}]
                    </span>
                  )}
                  
                  {/* Message */}
                  <span className="flex-1 min-w-0 font-mono text-xs leading-tight">
                    {searchTerm ? highlightSearchTerm(log.message, searchTerm) : log.message}
                  </span>
                  
                  {/* Metadata */}
                  {log.metadata && (
                    <span className="text-gray-500 font-mono text-xs max-w-[200px] truncate flex-shrink-0">
                      {Object.entries(log.metadata)
                        .slice(0, 2)
                        .map(([key, value]) => `${key}:${value}`)
                        .join(' ')}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VirtualizedLogViewer;
import React from 'react';
import { AlertCircle, Info, AlertTriangle, Bug } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { LogLevel } from '@constants';
import type { LogEntry } from '@/types/logs';

/**
 * Gets the appropriate icon for a log level
 */
export const getLogLevelIcon = (level: LogLevel): React.ReactElement | null => {
  switch (level) {
    case LogLevel.ERROR:
      return React.createElement(AlertCircle, { className: "w-4 h-4 text-red-500" });
    case LogLevel.WARN:
      return React.createElement(AlertTriangle, { className: "w-4 h-4 text-yellow-500" });
    case LogLevel.INFO:
      return React.createElement(Info, { className: "w-4 h-4 text-blue-500" });
    case LogLevel.DEBUG:
      return React.createElement(Bug, { className: "w-4 h-4 text-gray-500" });
    default:
      return null;
  }
};

/**
 * Gets the CSS classes for log level styling
 */
export const getLogLevelColor = (level: LogLevel): string => {
  switch (level) {
    case LogLevel.ERROR:
      return 'text-red-400 border-red-400 bg-red-900/10';
    case LogLevel.WARN:
      return 'text-yellow-400 border-yellow-400 bg-yellow-900/10';
    case LogLevel.INFO:
      return 'text-blue-400 border-blue-400 bg-blue-900/10';
    case LogLevel.DEBUG:
      return 'text-gray-400 border-gray-400 bg-gray-900/10';
    default:
      return 'text-white border-white bg-white/5';
  }
};

/**
 * Gets the icon component class for a log level (for StatCard usage)
 */
export const getLogLevelIconComponent = (level: LogLevel): LucideIcon => {
  switch (level) {
    case LogLevel.ERROR:
      return AlertCircle;
    case LogLevel.WARN:
      return AlertTriangle;
    case LogLevel.INFO:
      return Info;
    case LogLevel.DEBUG:
      return Bug;
    default:
      return Info;
  }
};

/**
 * Formats log timestamp for display
 */
export const formatLogTimestamp = (timestamp: string): string => {
  return new Date(timestamp).toLocaleString('en-US', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
};

/**
 * Filters logs by level, source, and namespace
 */
export const filterLogs = (
  logs: LogEntry[],
  selectedLevel: string = 'all',
  selectedSource: string = 'all',
  selectedNamespace: string = 'all'
): LogEntry[] => {
  return logs.filter(log => {
    const matchesLevel = selectedLevel === 'all' || log.level === selectedLevel;
    const matchesSource = selectedSource === 'all' || log.source === selectedSource;
    
    // Extract namespace from metadata if available
    const logNamespace = log.metadata?.namespace || 'default';
    const matchesNamespace = selectedNamespace === 'all' || logNamespace === selectedNamespace;
    
    return matchesLevel && matchesSource && matchesNamespace;
  });
};

/**
 * Gets unique sources from log entries
 */
export const getUniqueSources = (logs: LogEntry[]): string[] => {
  return Array.from(new Set(logs.map(log => log.source))).sort();
};

/**
 * Gets unique namespaces from log entries
 */
export const getUniqueNamespaces = (logs: LogEntry[]): string[] => {
  return Array.from(new Set(logs.map(log => log.metadata?.namespace || 'default'))).sort();
};

/**
 * Calculates log statistics by level
 */
export const getLogStatistics = (logs: LogEntry[]) => {
  const total = logs.length;
  const stats = {
    total,
    error: logs.filter(log => log.level === LogLevel.ERROR).length,
    warn: logs.filter(log => log.level === LogLevel.WARN).length,
    info: logs.filter(log => log.level === LogLevel.INFO).length,
    debug: logs.filter(log => log.level === LogLevel.DEBUG).length,
  };

  return {
    ...stats,
    errorRate: total > 0 ? (stats.error / total) * 100 : 0,
    warnRate: total > 0 ? (stats.warn / total) * 100 : 0,
    infoRate: total > 0 ? (stats.info / total) * 100 : 0,
    debugRate: total > 0 ? (stats.debug / total) * 100 : 0,
  };
};

/**
 * Groups logs by time intervals
 */
export const groupLogsByTimeInterval = (
  logs: LogEntry[],
  intervalMinutes: number = 60
): { [key: string]: LogEntry[] } => {
  const groups: { [key: string]: LogEntry[] } = {};
  
  logs.forEach(log => {
    const date = new Date(log.timestamp);
    const intervalStart = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      Math.floor(date.getHours() / (intervalMinutes / 60)) * (intervalMinutes / 60)
    );
    
    const key = intervalStart.toISOString();
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(log);
  });
  
  return groups;
};

/**
 * Gets unique sources from logs for selectors
 */
export const getUniqueLogSources = (logs: LogEntry[]): string[] => {
  return Array.from(new Set(logs.map(log => log.source))).sort();
};

/**
 * Gets unique namespaces from logs for selectors
 */
export const getUniqueLogNamespaces = (logs: LogEntry[]): string[] => {
  return Array.from(new Set(logs.map(log => log.metadata?.namespace || 'default'))).sort();
};

/**
 * Formats log timestamp for display
 */
export const formatLogTimestampDisplay = (timestamp: string): string => {
  return new Date(timestamp).toLocaleString('en-US', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
};
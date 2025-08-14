import { LogLevel, LogSource } from '@/constants';

export interface LogEntry {
  id: string;
  timestamp: string;
  level: LogLevel;
  source: LogSource | string;
  message: string;
  user?: string;
  action?: string;
  metadata?: {
    namespace?: string;
    pod?: string;
    node?: string;
    ip?: string;
    duration?: number;
    error_code?: string;
    [key: string]: unknown;
  };
}

export interface LogsStore {
  logs: LogEntry[];
  isLoading: boolean;
  error: string | null;
  
  // Filters
  searchQuery: string;
  levelFilter: string;
  sourceFilter: string;
  
  // Actions
  fetchLogs: (filters?: LogFilters) => Promise<void>;
  setLogs: (logs: LogEntry[]) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  setSearchQuery: (query: string) => void;
  setLevelFilter: (level: string) => void;
  setSourceFilter: (source: string) => void;
  clearLogs: () => void;
}

export interface LogFilters {
  search?: string;
  level?: string;
  source?: string;
  startTime?: string;
  endTime?: string;
  limit?: number;
}
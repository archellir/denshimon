// Re-export all types from their respective files
export * from './components';
export * from './gitops';
export * from './logs';
export * from './metrics';
export * from './network';
export * from './podLifecycle';

// Re-export enums from constants
export { 
  HealthStatus, 
  SyncStatus, 
  PodStatus, 
  NodeStatus, 
  ConnectionStatus, 
  AlertSeverity,
  SortDirection,
  TimeRange,
  HttpMethod,
  WebSocketEventType,
  ChartType,
  ViewType,
  LogLevel
} from '@/constants';

// Common UI types
export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export interface SelectOption {
  value: string;
  label: string;
}

import { SortDirection } from '@/constants';

export interface FilterState {
  search: string;
  sortBy: string;
  sortOrder: SortDirection;
}

// API response types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasNext: boolean;
  hasPrev: boolean;
}
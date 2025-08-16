import { Status, EventCategory } from '@constants';
export { EventCategory };

export interface SystemChangeEvent {
  id: string;
  timestamp: string;
  category: EventCategory;
  severity: Status;
  title: string;
  description: string;
  source: {
    type: string;
    name: string;
    namespace?: string;
  };
  impact?: {
    affected: number;
    total: number;
    unit: string;
  };
  duration?: number;
  resolved?: boolean;
  relatedEvents?: string[];
  metadata?: Record<string, any>;
}

export interface SystemChangeGroup {
  hour: string;
  events: SystemChangeEvent[];
  summary: {
    critical: number;
    warning: number;
    info: number;
    success: number;
  };
}

export interface SystemChangesTimelineData {
  events: SystemChangeEvent[];
  groups: SystemChangeGroup[];
  statistics: {
    total: number;
    bySeverity: Partial<Record<Status, number>>;
    byCategory: Record<EventCategory, number>;
    recentTrend: 'increasing' | 'decreasing' | 'stable';
    averageResolutionTime: number;
    unresolvedCritical: number;
  };
  filters: {
    categories: EventCategory[];
    severities: Status[];
    timeRange: string;
    search?: string;
  };
}
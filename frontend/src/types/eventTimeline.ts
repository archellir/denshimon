import { Status, EventCategory } from '@constants';
export { EventCategory };

export interface TimelineEvent {
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

export interface EventGroup {
  hour: string;
  events: TimelineEvent[];
  summary: {
    critical: number;
    warning: number;
    info: number;
    success: number;
  };
}

export interface EventTimelineData {
  events: TimelineEvent[];
  groups: EventGroup[];
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
import { EventSeverity, EventCategory } from '@/constants';
export { EventSeverity, EventCategory };

export interface TimelineEvent {
  id: string;
  timestamp: string;
  category: EventCategory;
  severity: EventSeverity;
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
    unit: string; // pods, nodes, services, etc.
  };
  duration?: number; // in milliseconds
  resolved?: boolean;
  relatedEvents?: string[]; // IDs of related events
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
    bySeverity: Record<EventSeverity, number>;
    byCategory: Record<EventCategory, number>;
    recentTrend: 'increasing' | 'decreasing' | 'stable';
    averageResolutionTime: number; // in minutes
    unresolvedCritical: number;
  };
  filters: {
    categories: EventCategory[];
    severities: EventSeverity[];
    timeRange: string;
    search?: string;
  };
}
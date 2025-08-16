import React from 'react';
import { AlertTriangle, AlertCircle, Info, CheckCircle, Activity, Server, Package, Shield, Network, HardDrive, Settings } from 'lucide-react';
import { Status, EventCategory } from '@constants';
import type { SystemChange } from '@/types/systemChangesTimeline';

/**
 * Gets the appropriate icon for system change severity
 */
export const getSeverityIcon = (severity: Status): React.ReactElement => {
  switch (severity) {
    case Status.CRITICAL: return React.createElement(AlertCircle, { className: "w-4 h-4 text-red-500" });
    case Status.WARNING: return React.createElement(AlertTriangle, { className: "w-4 h-4 text-yellow-500" });
    case Status.INFO: return React.createElement(Info, { className: "w-4 h-4 text-blue-500" });
    case Status.SUCCESS: return React.createElement(CheckCircle, { className: "w-4 h-4 text-green-500" });
    default: return React.createElement(Info, { className: "w-4 h-4 text-blue-500" });
  }
};

/**
 * Gets the appropriate icon for system change category
 */
export const getCategoryIcon = (category: EventCategory): React.ReactElement => {
  switch (category) {
    case EventCategory.NODE: return React.createElement(Server, { className: "w-4 h-4" });
    case EventCategory.POD: return React.createElement(Package, { className: "w-4 h-4" });
    case EventCategory.SERVICE: return React.createElement(Activity, { className: "w-4 h-4" });
    case EventCategory.CONFIG: return React.createElement(Settings, { className: "w-4 h-4" });
    case EventCategory.SECURITY: return React.createElement(Shield, { className: "w-4 h-4" });
    case EventCategory.NETWORK: return React.createElement(Network, { className: "w-4 h-4" });
    case EventCategory.STORAGE: return React.createElement(HardDrive, { className: "w-4 h-4" });
    default: return React.createElement(Activity, { className: "w-4 h-4" });
  }
};

/**
 * Gets CSS classes for severity color styling
 */
export const getSeverityColor = (severity: Status) => {
  switch (severity) {
    case Status.CRITICAL: return 'border-red-500 text-red-500';
    case Status.WARNING: return 'border-yellow-500 text-yellow-500';
    case Status.INFO: return 'border-blue-500 text-blue-500';
    case Status.SUCCESS: return 'border-green-500 text-green-500';
  }
};

/**
 * Formats time ago display for events
 */
export const formatTimeAgo = (timestamp: string) => {
  const now = Date.now();
  const then = new Date(timestamp).getTime();
  const diff = now - then;
  
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'just now';
};

/**
 * Groups system change events by hour
 */
export const groupSystemChangesByHour = (events: SystemChange[]) => {
  const groupMap = new Map<string, SystemChange[]>();
  
  events.forEach(event => {
    const hour = new Date(event.timestamp).toISOString().slice(0, 13) + ':00:00.000Z';
    if (!groupMap.has(hour)) {
      groupMap.set(hour, []);
    }
    groupMap.get(hour)!.push(event);
  });

  return Array.from(groupMap.entries()).map(([hour, events]) => ({
    hour,
    events,
    summary: {
      critical: events.filter(e => e.severity === 'critical').length,
      warning: events.filter(e => e.severity === 'warning').length,
      info: events.filter(e => e.severity === 'info').length,
      success: events.filter(e => e.severity === 'success').length,
    },
  })).sort((a, b) => new Date(b.hour).getTime() - new Date(a.hour).getTime());
};

/**
 * Filters system changes by category and severity
 */
export const filterSystemChanges = (
  events: SystemChange[],
  selectedCategories: EventCategory[] = [],
  selectedSeverities: Status[] = []
): SystemChange[] => {
  return events.filter(event => {
    const matchesCategory = selectedCategories.length === 0 || selectedCategories.includes(event.category);
    const matchesSeverity = selectedSeverities.length === 0 || selectedSeverities.includes(event.severity);
    
    return matchesCategory && matchesSeverity;
  });
};
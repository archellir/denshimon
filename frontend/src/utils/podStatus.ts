import React from 'react';
import { Server, AlertCircle, CheckCircle, Clock, XCircle } from 'lucide-react';
import { Pod } from '@stores/workloadsStore';

/**
 * Gets the appropriate icon for pod phase/status
 */
export const getPodStatusIcon = (phase: string): React.ReactElement => {
  switch (phase) {
    case 'Running':
      return React.createElement(CheckCircle, { className: "text-green-400", size: 16 });
    case 'Failed':
      return React.createElement(AlertCircle, { className: "text-red-400", size: 16 });
    case 'Pending':
      return React.createElement(Clock, { className: "text-yellow-400", size: 16 });
    case 'Succeeded':
      return React.createElement(CheckCircle, { className: "text-blue-400", size: 16 });
    case 'Unknown':
      return React.createElement(XCircle, { className: "text-gray-400", size: 16 });
    default:
      return React.createElement(Server, { className: "text-yellow-400", size: 16 });
  }
};

/**
 * Gets the CSS color class for pod phase/status
 */
export const getPodStatusColor = (phase: string): string => {
  switch (phase) {
    case 'Running':
      return 'text-green-400';
    case 'Failed':
      return 'text-red-400';
    case 'Pending':
      return 'text-yellow-400';
    case 'Succeeded':
      return 'text-blue-400';
    case 'Unknown':
      return 'text-gray-400';
    default:
      return 'text-yellow-400';
  }
};

/**
 * Gets background color for pod status
 */
export const getPodStatusBackground = (phase: string): string => {
  switch (phase) {
    case 'Running':
      return 'bg-green-500/10';
    case 'Failed':
      return 'bg-red-500/10';
    case 'Pending':
      return 'bg-yellow-500/10';
    case 'Succeeded':
      return 'bg-blue-500/10';
    case 'Unknown':
      return 'bg-gray-500/10';
    default:
      return 'bg-yellow-500/10';
  }
};

/**
 * Filters pods by namespace and search query
 */
export const filterPods = (
  pods: Pod[],
  selectedNamespace: string,
  searchQuery?: string
): Pod[] => {
  if (!pods || !Array.isArray(pods)) {
    return [];
  }

  let filtered = selectedNamespace === 'all' 
    ? pods 
    : pods.filter(pod => pod.namespace === selectedNamespace);

  // Apply search filter
  if (searchQuery && filtered) {
    const query = searchQuery.toLowerCase();
    filtered = filtered.filter(pod => 
      pod.name.toLowerCase().includes(query) ||
      pod.namespace.toLowerCase().includes(query) ||
      pod.phase.toLowerCase().includes(query) ||
      pod.node?.toLowerCase().includes(query) ||
      pod.ip?.toLowerCase().includes(query)
    );
  }

  return filtered || [];
};

/**
 * Sorts pods by specified criteria
 */
export const sortPods = (
  pods: Pod[],
  sortBy: string,
  sortOrder: 'asc' | 'desc'
): Pod[] => {
  if (!pods || !Array.isArray(pods)) {
    return [];
  }

  return pods.sort((a, b) => {
    let valueA: string | number | Date, valueB: string | number | Date;
    
    switch (sortBy) {
      case 'namespace':
        valueA = a.namespace;
        valueB = b.namespace;
        break;
      case 'status':
      case 'phase':
        valueA = a.phase;
        valueB = b.phase;
        break;
      case 'node':
        valueA = a.node || '';
        valueB = b.node || '';
        break;
      case 'age':
        valueA = new Date(a.created || a.age);
        valueB = new Date(b.created || b.age);
        break;
      case 'restarts':
        valueA = a.restarts || 0;
        valueB = b.restarts || 0;
        break;
      default:
        valueA = a.name;
        valueB = b.name;
    }

    if (sortBy === 'age') {
      return sortOrder === 'asc' 
        ? (valueA as Date).getTime() - (valueB as Date).getTime()
        : (valueB as Date).getTime() - (valueA as Date).getTime();
    }

    if (sortBy === 'restarts') {
      return sortOrder === 'asc' 
        ? (valueA as number) - (valueB as number)
        : (valueB as number) - (valueA as number);
    }
    
    const comparison = valueA.toString().localeCompare(valueB.toString());
    return sortOrder === 'asc' ? comparison : -comparison;
  });
};

/**
 * Formats pod age for display
 */
export const formatPodAge = (createdAt: string): string => {
  const created = new Date(createdAt);
  const now = new Date();
  const diffMs = now.getTime() - created.getTime();
  
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  
  if (days > 0) return `${days}d`;
  if (hours > 0) return `${hours}h`;
  if (minutes > 0) return `${minutes}m`;
  return 'Just now';
};

/**
 * Gets pod readiness status
 */
export const getPodReadiness = (ready: number, total: number): string => {
  return `${ready}/${total}`;
};

/**
 * Checks if pod is healthy
 */
export const isPodHealthy = (phase: string, ready: number, total: number): boolean => {
  return phase === 'Running' && ready === total;
};

/**
 * Gets pod CPU usage color based on percentage
 */
export const getCpuUsageColor = (usage: number): string => {
  if (usage >= 90) return 'text-red-400';
  if (usage >= 70) return 'text-yellow-400';
  return 'text-green-400';
};

/**
 * Gets pod memory usage color based on percentage
 */
export const getMemoryUsageColor = (usage: number): string => {
  if (usage >= 90) return 'text-red-400';
  if (usage >= 80) return 'text-yellow-400';
  return 'text-green-400';
};
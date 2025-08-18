import React from 'react';
import { Pod } from '@stores/workloadsStore';
import { Status, PodStatus } from '@constants';
import { getStatusIcon, getStatusColor, getStatusBgColor } from './status';

/**
 * Map pod phase string to Status enum
 */
const mapPodPhaseToStatus = (phase: string): Status => {
  switch (phase.toLowerCase()) {
    case 'running':
      return Status.HEALTHY;
    case 'failed':
      return Status.ERROR;
    case 'pending':
      return Status.PENDING;
    case 'succeeded':
      return Status.SUCCESS;
    case 'unknown':
    default:
      return Status.UNKNOWN;
  }
};

/**
 * Gets the appropriate icon for pod phase/status
 */
export const getPodStatusIcon = (phase: string): React.ReactElement => {
  const status = mapPodPhaseToStatus(phase);
  const IconComponent = getStatusIcon(status);
  const color = getStatusColor(status);
  
  return React.createElement(IconComponent, { 
    className: color, 
    size: 16 
  });
};

/**
 * Gets the CSS color class for pod phase/status
 */
export const getPodStatusColor = (phase: string): string => {
  const status = mapPodPhaseToStatus(phase);
  return getStatusColor(status);
};

/**
 * Gets background color for pod status
 */
export const getPodStatusBackground = (phase: string): string => {
  const status = mapPodPhaseToStatus(phase);
  return getStatusBgColor(status);
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
        valueB = new Date(b.created || a.age);
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
  return phase === PodStatus.RUNNING && ready === total;
};

/**
 * Gets pod CPU usage color based on percentage
 */
export const getCpuUsageColor = (usage: number): string => {
  if (usage >= 90) return getStatusColor(Status.CRITICAL);
  if (usage >= 70) return getStatusColor(Status.WARNING);
  return getStatusColor(Status.HEALTHY);
};

/**
 * Gets pod memory usage color based on percentage
 */
export const getMemoryUsageColor = (usage: number): string => {
  if (usage >= 90) return getStatusColor(Status.CRITICAL);
  if (usage >= 80) return getStatusColor(Status.WARNING);
  return getStatusColor(Status.HEALTHY);
};
import { Status } from '@constants';
import { getStatusColor, getStatusBgColor, getStatusBorderColor } from './status';

/**
 * Gets the CSS color classes for service health status
 */
export const getServiceHealthStatusColor = (status: Status): string => {
  return `${getStatusBorderColor(status)} ${getStatusColor(status)}`;
};

/**
 * Gets the background color for service health status
 */
export const getServiceHealthBackgroundColor = (status: Status): string => {
  return getStatusBgColor(status);
};

/**
 * Formats service uptime for display
 */
export const formatServiceUptime = (uptimeSeconds: number): string => {
  const days = Math.floor(uptimeSeconds / (24 * 60 * 60));
  const hours = Math.floor((uptimeSeconds % (24 * 60 * 60)) / (60 * 60));
  const minutes = Math.floor((uptimeSeconds % (60 * 60)) / 60);
  
  if (days > 0) {
    return `${days}d ${hours}h`;
  } else if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else {
    return `${minutes}m`;
  }
};

/**
 * Formats response time for display
 */
export const formatResponseTime = (responseTimeMs: number): string => {
  if (responseTimeMs < 1000) {
    return `${Math.round(responseTimeMs)}ms`;
  } else {
    return `${(responseTimeMs / 1000).toFixed(1)}s`;
  }
};

/**
 * Calculates service health score based on various metrics
 */
export const calculateServiceHealthScore = (
  uptime: number,
  responseTime: number,
  errorRate: number
): number => {
  let score = 100;
  
  // Penalize based on uptime (assuming 99.9% is target)
  const uptimePercent = uptime * 100;
  if (uptimePercent < 99.9) {
    score -= (99.9 - uptimePercent) * 10;
  }
  
  // Penalize based on response time (assuming 200ms is target)
  if (responseTime > 200) {
    score -= Math.min(50, (responseTime - 200) / 10);
  }
  
  // Penalize based on error rate
  score -= errorRate * 100;
  
  return Math.max(0, Math.round(score));
};

/**
 * Gets service health status from score
 */
export const getStatusFromHealthScore = (score: number): Status => {
  if (score >= 95) return Status.HEALTHY;
  if (score >= 80) return Status.WARNING;
  if (score >= 50) return Status.CRITICAL;
  return Status.UNKNOWN;
};
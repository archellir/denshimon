/**
 * Centralized Status Styling and Configuration Utility
 * 
 * This module provides a unified interface for status-related styling,
 * icons, and configurations across the entire application.
 */

import { Status, STATUS_COLORS, DeploymentStatus, RegistryStatus } from '@constants';
import { 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  Clock, 
  HelpCircle,
  Info,
  AlertCircle,
  Activity,
  Pause,
  ArrowUp,
  ArrowDown,
  Minus,
  type LucideIcon
} from 'lucide-react';

export interface StatusConfig {
  color: string;
  bgColor: string;
  borderColor: string;
  icon: LucideIcon;
  label: string;
  priority: number;
}

/**
 * Get comprehensive status configuration including colors, icons, and labels
 */
export const getStatusConfig = (status: Status): StatusConfig => {
  switch (status) {
    case Status.HEALTHY:
    case Status.SUCCESS:
      return {
        color: STATUS_COLORS.TEXT[Status.HEALTHY] || 'text-green-500',
        bgColor: 'bg-green-500/10',
        borderColor: 'border-green-500',
        icon: CheckCircle,
        label: 'HEALTHY',
        priority: 1,
      };
    
    case Status.WARNING:
      return {
        color: STATUS_COLORS.TEXT[Status.WARNING] || 'text-yellow-500',
        bgColor: 'bg-yellow-500/10',
        borderColor: 'border-yellow-500',
        icon: AlertTriangle,
        label: 'WARNING',
        priority: 2,
      };
    
    case Status.CRITICAL:
      return {
        color: STATUS_COLORS.TEXT[Status.ERROR] || 'text-red-600',
        bgColor: 'bg-red-600/10',
        borderColor: 'border-red-600',
        icon: XCircle,
        label: 'CRITICAL',
        priority: 3,
      };
    
    case Status.ERROR:
      return {
        color: STATUS_COLORS.TEXT[Status.ERROR] || 'text-red-500',
        bgColor: 'bg-red-500/10',
        borderColor: 'border-red-500',
        icon: XCircle,
        label: 'ERROR',
        priority: 3,
      };
    
    case Status.PENDING:
      return {
        color: STATUS_COLORS.TEXT[Status.PENDING] || 'text-yellow-400',
        bgColor: 'bg-yellow-400/10',
        borderColor: 'border-yellow-400',
        icon: Clock,
        label: 'PENDING',
        priority: 4,
      };
    
    case Status.PROGRESSING:
      return {
        color: 'text-blue-500',
        bgColor: 'bg-blue-500/10',
        borderColor: 'border-blue-500',
        icon: Activity,
        label: 'PROGRESSING',
        priority: 4,
      };
    
    case Status.INFO:
      return {
        color: STATUS_COLORS.TEXT[Status.INFO] || 'text-blue-400',
        bgColor: 'bg-blue-400/10',
        borderColor: 'border-blue-400',
        icon: Info,
        label: 'INFO',
        priority: 5,
      };
    
    case Status.DEGRADED:
      return {
        color: 'text-orange-500',
        bgColor: 'bg-orange-500/10',
        borderColor: 'border-orange-500',
        icon: AlertCircle,
        label: 'DEGRADED',
        priority: 3,
      };
    
    case Status.SUSPENDED:
      return {
        color: 'text-gray-500',
        bgColor: 'bg-gray-500/10',
        borderColor: 'border-gray-500',
        icon: Pause,
        label: 'SUSPENDED',
        priority: 6,
      };
    
    case Status.DOWN:
      return {
        color: 'text-red-700',
        bgColor: 'bg-red-700/10',
        borderColor: 'border-red-700',
        icon: XCircle,
        label: 'DOWN',
        priority: 1,
      };
    
    case Status.HIGH:
      return {
        color: 'text-red-500',
        bgColor: 'bg-red-500/10',
        borderColor: 'border-red-500',
        icon: AlertTriangle,
        label: 'HIGH',
        priority: 2,
      };
    
    case Status.MEDIUM:
      return {
        color: 'text-yellow-500',
        bgColor: 'bg-yellow-500/10',
        borderColor: 'border-yellow-500',
        icon: AlertCircle,
        label: 'MEDIUM',
        priority: 3,
      };
    
    case Status.LOW:
      return {
        color: 'text-blue-500',
        bgColor: 'bg-blue-500/10',
        borderColor: 'border-blue-500',
        icon: Info,
        label: 'LOW',
        priority: 4,
      };
    
    case Status.MISSING:
    case Status.UNKNOWN:
    default:
      return {
        color: STATUS_COLORS.TEXT[Status.UNKNOWN] || 'text-gray-400',
        bgColor: 'bg-gray-400/10',
        borderColor: 'border-gray-400',
        icon: HelpCircle,
        label: 'UNKNOWN',
        priority: 7,
      };
  }
};

/**
 * Get status color class for text elements
 */
export const getStatusColor = (status: Status): string => {
  return getStatusConfig(status).color;
};

/**
 * Get status background color class
 */
export const getStatusBgColor = (status: Status): string => {
  return getStatusConfig(status).bgColor;
};

/**
 * Get status border color class
 */
export const getStatusBorderColor = (status: Status): string => {
  return getStatusConfig(status).borderColor;
};

/**
 * Get status icon component
 */
export const getStatusIcon = (status: Status): LucideIcon => {
  return getStatusConfig(status).icon;
};

/**
 * Get status label
 */
export const getStatusLabel = (status: Status): string => {
  return getStatusConfig(status).label;
};

/**
 * Get status priority (lower number = higher priority)
 */
export const getStatusPriority = (status: Status): number => {
  return getStatusConfig(status).priority;
};

/**
 * Sort statuses by priority (most critical first)
 */
export const sortByStatusPriority = (statuses: Status[]): Status[] => {
  return [...statuses].sort((a, b) => getStatusPriority(a) - getStatusPriority(b));
};

/**
 * Trend direction types and utilities
 */
export enum TrendDirection {
  UP = 'up',
  DOWN = 'down',
  STABLE = 'stable'
}

export interface TrendConfig {
  color: string;
  icon: LucideIcon;
  label: string;
}

/**
 * Get trend configuration for directional indicators
 */
export const getTrendConfig = (direction: TrendDirection): TrendConfig => {
  switch (direction) {
    case TrendDirection.UP:
      return {
        color: 'text-green-500',
        icon: ArrowUp,
        label: 'UP',
      };
    
    case TrendDirection.DOWN:
      return {
        color: 'text-red-500',
        icon: ArrowDown,
        label: 'DOWN',
      };
    
    case TrendDirection.STABLE:
    default:
      return {
        color: 'text-gray-500',
        icon: Minus,
        label: 'STABLE',
      };
  }
};

/**
 * Deployment-specific status utilities
 */

export const getDeploymentStatusColor = (status: DeploymentStatus): string => {
  switch (status) {
    case DeploymentStatus.RUNNING:
      return 'text-green-500';
    case DeploymentStatus.PENDING:
      return 'text-yellow-500';
    case DeploymentStatus.COMMITTED:
      return 'text-cyan-500';      // GitOps: committed to git
    case DeploymentStatus.PENDING_APPLY:
      return 'text-blue-400';      // GitOps: ready to apply
    case DeploymentStatus.APPLYING:
      return 'text-blue-500';      // GitOps: currently applying
    case DeploymentStatus.UPDATING:
      return 'text-blue-500';
    case DeploymentStatus.FAILED:
      return 'text-red-500';
    case DeploymentStatus.APPLY_FAILED:
      return 'text-red-600';       // GitOps: apply failed
    case DeploymentStatus.TERMINATING:
      return 'text-orange-500';
    default:
      return 'text-gray-500';
  }
};

export const getRegistryStatusColor = (status: RegistryStatus): string => {
  switch (status) {
    case RegistryStatus.CONNECTED:
      return 'text-green-500';
    case RegistryStatus.PENDING:
      return 'text-yellow-500';
    case RegistryStatus.ERROR:
      return 'text-red-500';
    default:
      return 'text-gray-500';
  }
};

export const getRegistryStatusIcon = (status: RegistryStatus): LucideIcon => {
  switch (status) {
    case RegistryStatus.CONNECTED:
      return CheckCircle;
    case RegistryStatus.PENDING:
      return Clock;
    case RegistryStatus.ERROR:
      return XCircle;
    default:
      return HelpCircle;
  }
};


import { CheckCircle, XCircle, Clock, AlertTriangle, Loader } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type DeploymentStatus = 'running' | 'pending' | 'failed' | 'updating' | 'terminating';
export type RegistryStatus = 'connected' | 'error' | 'pending';
export type GeneralStatus = 'success' | 'error' | 'warning' | 'info' | 'loading';

/**
 * Gets CSS color class for deployment status
 */
export const getDeploymentStatusColor = (status: DeploymentStatus): string => {
  switch (status) {
    case 'running':
      return 'text-green-400';
    case 'pending':
      return 'text-yellow-400';
    case 'failed':
      return 'text-red-400';
    case 'updating':
      return 'text-blue-400';
    case 'terminating':
      return 'text-orange-400';
    default:
      return 'text-gray-400';
  }
};

/**
 * Gets CSS color class for registry status
 */
export const getRegistryStatusColor = (status: RegistryStatus): string => {
  switch (status) {
    case 'connected':
      return 'text-green-400';
    case 'error':
      return 'text-red-400';
    case 'pending':
      return 'text-yellow-400';
    default:
      return 'text-gray-400';
  }
};

/**
 * Gets icon component for registry status
 */
export const getRegistryStatusIcon = (status: RegistryStatus): LucideIcon => {
  switch (status) {
    case 'connected':
      return CheckCircle;
    case 'error':
      return XCircle;
    case 'pending':
      return Clock;
    default:
      return Clock;
  }
};

/**
 * Gets CSS color class for general status
 */
export const getGeneralStatusColor = (status: GeneralStatus): string => {
  switch (status) {
    case 'success':
      return 'text-green-400';
    case 'error':
      return 'text-red-400';
    case 'warning':
      return 'text-yellow-400';
    case 'info':
      return 'text-blue-400';
    case 'loading':
      return 'text-gray-400';
    default:
      return 'text-gray-400';
  }
};

/**
 * Gets icon component for general status
 */
export const getGeneralStatusIcon = (status: GeneralStatus): LucideIcon => {
  switch (status) {
    case 'success':
      return CheckCircle;
    case 'error':
      return XCircle;
    case 'warning':
      return AlertTriangle;
    case 'info':
      return Clock;
    case 'loading':
      return Loader;
    default:
      return Clock;
  }
};

/**
 * Gets background color class for status badges
 */
export const getStatusBadgeColor = (status: GeneralStatus): string => {
  switch (status) {
    case 'success':
      return 'bg-green-600';
    case 'error':
      return 'bg-red-600';
    case 'warning':
      return 'bg-yellow-600';
    case 'info':
      return 'bg-blue-600';
    case 'loading':
      return 'bg-gray-600';
    default:
      return 'bg-gray-600';
  }
};
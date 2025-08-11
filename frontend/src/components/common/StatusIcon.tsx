import type { FC } from 'react';
import { CheckCircle, AlertCircle, XCircle, Clock, HelpCircle, Zap } from 'lucide-react';
import { HealthStatus, SIZES } from '@constants';

export type StatusType = HealthStatus;

interface StatusIconProps {
  status: StatusType;
  size?: number;
  showLabel?: boolean;
  className?: string;
}

const StatusIcon: FC<StatusIconProps> = ({ 
  status, 
  size = SIZES.ICON.MEDIUM, 
  showLabel = false,
  className = ""
}) => {
  const getStatusConfig = (status: StatusType) => {
    switch (status) {
      case HealthStatus.HEALTHY:
        return {
          icon: CheckCircle,
          color: 'text-green-500',
          label: 'HEALTHY',
          bgColor: 'border-green-500'
        };
      case HealthStatus.WARNING:
        return {
          icon: AlertCircle,
          color: 'text-yellow-500',
          label: 'WARNING',
          bgColor: 'border-yellow-500'
        };
      case HealthStatus.ERROR:
        return {
          icon: XCircle,
          color: 'text-red-500',
          label: 'ERROR',
          bgColor: 'border-red-500'
        };
      case HealthStatus.CRITICAL:
        return {
          icon: Zap,
          color: 'text-red-600',
          label: 'CRITICAL',
          bgColor: 'border-red-600'
        };
      case HealthStatus.PENDING:
        return {
          icon: Clock,
          color: 'text-blue-500',
          label: 'PENDING',
          bgColor: 'border-blue-500'
        };
      case HealthStatus.UNKNOWN:
        return {
          icon: HelpCircle,
          color: 'text-gray-500',
          label: 'UNKNOWN',
          bgColor: 'border-gray-500'
        };
      default:
        return {
          icon: HelpCircle,
          color: 'text-gray-500',
          label: 'UNKNOWN',
          bgColor: 'border-gray-500'
        };
    }
  };

  const config = getStatusConfig(status);
  const Icon = config.icon;

  if (showLabel) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <Icon size={size} className={config.color} />
        <span className={`text-xs font-mono ${config.color}`}>
          {config.label}
        </span>
      </div>
    );
  }

  return (
    <Icon 
      size={size} 
      className={`${config.color} ${className}`}
      title={config.label}
    />
  );
};

export default StatusIcon;

// Utility function to get status color class for borders, text, etc.
export const getStatusColor = (status: StatusType) => {
  switch (status) {
    case 'healthy':
      return 'text-green-500 border-green-500';
    case 'warning':
      return 'text-yellow-500 border-yellow-500';
    case 'error':
      return 'text-red-500 border-red-500';
    case 'critical':
      return 'text-red-600 border-red-600';
    case 'pending':
      return 'text-blue-500 border-blue-500';
    case 'unknown':
      return 'text-gray-500 border-gray-500';
    default:
      return 'text-gray-500 border-gray-500';
  }
};

// Utility function to convert generic status strings to StatusType
export const normalizeStatus = (status: string): StatusType => {
  const lowercased = status.toLowerCase();
  
  // Map common status variations to our standard types
  if (['running', 'active', 'ready', 'succeeded', 'bound', 'available'].includes(lowercased)) {
    return 'healthy';
  }
  
  if (['degraded', 'progressing', 'replicafailure', 'warning'].includes(lowercased)) {
    return 'warning';
  }
  
  if (['failed', 'error', 'crashloopbackoff', 'imagepullbackoff', 'terminating'].includes(lowercased)) {
    return 'error';
  }
  
  if (['pending', 'creating', 'terminating', 'updating'].includes(lowercased)) {
    return 'pending';
  }
  
  if (['outofmemory', 'killed', 'oomkilled'].includes(lowercased)) {
    return 'critical';
  }
  
  return 'unknown';
};
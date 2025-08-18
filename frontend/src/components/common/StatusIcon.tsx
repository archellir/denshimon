import type { FC } from 'react';
import { Status, SIZES } from '@constants';
import { getStatusConfig } from '@utils/status';

export type StatusType = Status;

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
    <span title={config.label}>
      <Icon 
        size={size} 
        className={`${config.color} ${className}`}
      />
    </span>
  );
};

export default StatusIcon;

// Re-export utilities from the centralized status module
export { getStatusColor, getStatusBorderColor, getStatusBgColor } from '@utils/status';

// Utility function to convert generic status strings to StatusType
export const normalizeStatus = (status: string): StatusType => {
  const lowercased = status.toLowerCase();
  
  // Map common status variations to our standard types
  if (['running', 'active', 'ready', 'succeeded', 'bound', 'available'].includes(lowercased)) {
    return Status.HEALTHY;
  }
  
  if (['degraded', 'progressing', 'replicafailure', 'warning'].includes(lowercased)) {
    return Status.WARNING;
  }
  
  if (['failed', 'error', 'crashloopbackoff', 'imagepullbackoff', 'terminating'].includes(lowercased)) {
    return Status.ERROR;
  }
  
  if (['pending', 'creating', 'terminating', 'updating'].includes(lowercased)) {
    return Status.PENDING;
  }
  
  if (['outofmemory', 'killed', 'oomkilled'].includes(lowercased)) {
    return Status.CRITICAL;
  }
  
  return Status.UNKNOWN;
};
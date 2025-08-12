import type { FC } from 'react';
import { AlertCircle, AlertTriangle, Info, XOctagon, Bell } from 'lucide-react';

export type AlertSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info';

export interface Alert {
  id: string;
  severity: AlertSeverity;
  title: string;
  description: string;
  source: string;
  timestamp: string;
  acknowledged: boolean;
  resolved: boolean;
  tags?: string[];
  affectedResources?: string[];
}

interface AlertSeverityIconProps {
  severity: AlertSeverity;
  size?: number;
  showLabel?: boolean;
  className?: string;
}

export const AlertSeverityIcon: FC<AlertSeverityIconProps> = ({
  severity,
  size = 16,
  showLabel = false,
  className = ''
}) => {
  const getSeverityConfig = (severity: AlertSeverity) => {
    switch (severity) {
      case 'critical':
        return {
          icon: XOctagon,
          color: 'text-red-600',
          bgColor: 'bg-red-600/10',
          borderColor: 'border-red-600',
          label: 'CRITICAL',
          priority: 1,
        };
      case 'high':
        return {
          icon: AlertTriangle,
          color: 'text-red-500',
          bgColor: 'bg-red-500/10',
          borderColor: 'border-red-500',
          label: 'HIGH',
          priority: 2,
        };
      case 'medium':
        return {
          icon: AlertCircle,
          color: 'text-yellow-500',
          bgColor: 'bg-yellow-500/10',
          borderColor: 'border-yellow-500',
          label: 'MEDIUM',
          priority: 3,
        };
      case 'low':
        return {
          icon: Bell,
          color: 'text-blue-500',
          bgColor: 'bg-blue-500/10',
          borderColor: 'border-blue-500',
          label: 'LOW',
          priority: 4,
        };
      case 'info':
        return {
          icon: Info,
          color: 'text-gray-500',
          bgColor: 'bg-gray-500/10',
          borderColor: 'border-gray-500',
          label: 'INFO',
          priority: 5,
        };
    }
  };

  const config = getSeverityConfig(severity);
  const Icon = config.icon;

  if (showLabel) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <Icon size={size} className={config.color} />
        <span className={`text-xs font-mono font-bold ${config.color}`}>
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

interface AlertBadgeProps {
  severity: AlertSeverity;
  count?: number;
  className?: string;
}

export const AlertBadge: FC<AlertBadgeProps> = ({
  severity,
  count,
  className = ''
}) => {
  const config = getSeverityConfig(severity);

  return (
    <div
      className={`inline-flex items-center space-x-1 px-2 py-1 border ${config.borderColor} ${config.bgColor} ${className}`}
    >
      <AlertSeverityIcon severity={severity} size={12} />
      <span className={`text-xs font-mono font-bold ${config.color}`}>
        {config.label}
      </span>
      {count !== undefined && count > 0 && (
        <span className={`text-xs font-mono ${config.color}`}>
          ({count})
        </span>
      )}
    </div>
  );
};

// Utility functions
export const getSeverityConfig = (severity: AlertSeverity) => {
  switch (severity) {
    case 'critical':
      return {
        icon: XOctagon,
        color: 'text-red-600',
        bgColor: 'bg-red-600/10',
        borderColor: 'border-red-600',
        label: 'CRITICAL',
        priority: 1,
      };
    case 'high':
      return {
        icon: AlertTriangle,
        color: 'text-red-500',
        bgColor: 'bg-red-500/10',
        borderColor: 'border-red-500',
        label: 'HIGH',
        priority: 2,
      };
    case 'medium':
      return {
        icon: AlertCircle,
        color: 'text-yellow-500',
        bgColor: 'bg-yellow-500/10',
        borderColor: 'border-yellow-500',
        label: 'MEDIUM',
        priority: 3,
      };
    case 'low':
      return {
        icon: Bell,
        color: 'text-blue-500',
        bgColor: 'bg-blue-500/10',
        borderColor: 'border-blue-500',
        label: 'LOW',
        priority: 4,
      };
    case 'info':
      return {
        icon: Info,
        color: 'text-gray-500',
        bgColor: 'bg-gray-500/10',
        borderColor: 'border-gray-500',
        label: 'INFO',
        priority: 5,
      };
  }
};

export const sortAlertsBySeverity = (alerts: Alert[]): Alert[] => {
  const severityOrder: Record<AlertSeverity, number> = {
    critical: 1,
    high: 2,
    medium: 3,
    low: 4,
    info: 5,
  };

  return [...alerts].sort((a, b) => {
    // First sort by resolved status
    if (a.resolved !== b.resolved) {
      return a.resolved ? 1 : -1;
    }
    
    // Then by acknowledged status
    if (a.acknowledged !== b.acknowledged) {
      return a.acknowledged ? 1 : -1;
    }
    
    // Then by severity
    const severityDiff = severityOrder[a.severity] - severityOrder[b.severity];
    if (severityDiff !== 0) {
      return severityDiff;
    }
    
    // Finally by timestamp (newest first)
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
  });
};

export const filterAlertsBySeverity = (
  alerts: Alert[],
  severities: AlertSeverity[]
): Alert[] => {
  if (severities.length === 0) return alerts;
  return alerts.filter(alert => severities.includes(alert.severity));
};

export const getAlertCounts = (alerts: Alert[]): Record<AlertSeverity, number> => {
  const counts: Record<AlertSeverity, number> = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    info: 0,
  };

  alerts.forEach(alert => {
    if (!alert.resolved) {
      counts[alert.severity]++;
    }
  });

  return counts;
};

// Alert severity definitions for reference
export const ALERT_SEVERITY_DEFINITIONS = {
  critical: {
    description: 'Service is completely down or data loss is occurring',
    responseTime: 'Immediate',
    examples: [
      'Database cluster failure',
      'Complete service outage',
      'Data corruption detected',
      'Security breach detected',
    ],
  },
  high: {
    description: 'Service is severely degraded or will fail soon',
    responseTime: 'Within 30 minutes',
    examples: [
      'API error rate > 10%',
      'Response time > 5 seconds',
      'Disk usage > 95%',
      'Memory pressure critical',
    ],
  },
  medium: {
    description: 'Service is degraded but functional',
    responseTime: 'Within 2 hours',
    examples: [
      'API error rate > 5%',
      'Response time > 2 seconds',
      'Disk usage > 85%',
      'High CPU usage',
    ],
  },
  low: {
    description: 'Minor issue that should be investigated',
    responseTime: 'Within 24 hours',
    examples: [
      'API error rate > 2%',
      'Response time > 1 second',
      'Disk usage > 75%',
      'Unusual traffic pattern',
    ],
  },
  info: {
    description: 'Informational message, no action required',
    responseTime: 'No SLA',
    examples: [
      'Deployment completed',
      'Backup successful',
      'Scheduled maintenance',
      'Configuration change',
    ],
  },
};

export default AlertSeverityIcon;
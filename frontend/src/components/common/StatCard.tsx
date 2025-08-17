import type { FC } from 'react';
import type { LucideIcon } from 'lucide-react';
import StatusIcon, { getStatusColor } from '@components/common/StatusIcon';
import type { StatusType } from '@components/common/StatusIcon';

export interface StatCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  status: StatusType;
  variant?: 'default' | 'compact' | 'minimal' | 'service-health' | 'centered' | 'analytics' | 'network' | 'health';
  className?: string;
  onClick?: () => void;
  trend?: {
    direction: 'up' | 'down' | 'neutral';
    value?: string;
    color?: 'green' | 'red' | 'yellow' | 'gray';
  };
  badge?: {
    text: string;
    color: 'green' | 'yellow' | 'red' | 'blue' | 'gray';
  };
  description?: string;
}

const StatCard: FC<StatCardProps> = ({
  label,
  value,
  icon: Icon,
  status,
  variant = 'default',
  className = '',
  onClick,
  trend,
  badge,
  description
}) => {
  const baseClasses = `border ${getStatusColor(status)} font-mono transition-colors`;
  const clickableClasses = onClick ? 'cursor-pointer hover:bg-white/5' : '';
  
  const variantClasses = {
    default: 'pl-5 pr-4 py-3',
    compact: 'pl-4 pr-3 py-2',
    minimal: 'pl-3 pr-2 py-1.5',
    'service-health': 'p-4',
    centered: 'p-3 text-center',
    analytics: 'px-6 py-3',
    network: 'p-4',
    health: 'p-3'
  };

  const valueClasses = {
    default: 'text-base',
    compact: 'text-sm',
    minimal: 'text-xs',
    'service-health': 'text-2xl',
    centered: 'text-lg',
    analytics: 'text-2xl',
    network: 'text-lg',
    health: 'text-xs'
  };

  const labelClasses = {
    default: 'text-xs',
    compact: 'text-xs',
    minimal: 'text-xs',
    'service-health': 'text-sm',
    centered: 'text-xs',
    analytics: 'text-xs',
    network: 'text-xs',
    health: 'text-xs'
  };

  const iconSizes = {
    default: 20,
    compact: 18,
    minimal: 16,
    'service-health': 32
  };

  const statusIconSizes = {
    default: 16,
    compact: 14,
    minimal: 12,
    'service-health': 16
  };

  const getTrendIcon = () => {
    if (!trend) return null;
    
    const trendColors = {
      green: 'text-green-400',
      red: 'text-red-400',
      yellow: 'text-yellow-400',
      gray: 'text-gray-400'
    };

    const trendColor = trend.color || (
      trend.direction === 'up' ? 'green' : 
      trend.direction === 'down' ? 'red' : 
      'gray'
    );

    return (
      <div className={`flex items-center space-x-1 ${trendColors[trendColor]}`}>
        <span className="text-xs">
          {trend.direction === 'up' ? '↗' : trend.direction === 'down' ? '↘' : '→'}
        </span>
        {trend.value && <span className="text-xs">{trend.value}</span>}
      </div>
    );
  };

  const getBadgeClasses = (color: string) => {
    const badgeColors = {
      green: 'bg-green-900/30 border-green-400 text-green-400',
      yellow: 'bg-yellow-900/30 border-yellow-400 text-yellow-400',
      red: 'bg-red-900/30 border-red-400 text-red-400',
      blue: 'bg-blue-900/30 border-blue-400 text-blue-400',
      gray: 'bg-gray-900/30 border-gray-400 text-gray-400'
    };
    return badgeColors[color as keyof typeof badgeColors] || badgeColors.gray;
  };

  if (variant === 'service-health') {
    return (
      <div 
        className={`${baseClasses} ${variantClasses['service-health']} ${clickableClasses} ${className} flex items-center`}
        onClick={onClick}
      >
        <div className="flex-1">
          <span className={`${labelClasses['service-health']} font-mono block mb-2`}>{label}</span>
          <div className={`${valueClasses['service-health']} font-mono`}>{value}</div>
          {description && (
            <div className="font-mono text-xs opacity-60">{description}</div>
          )}
        </div>
        <Icon size={iconSizes['service-health']} className="ml-4" />
      </div>
    );
  }

  if (variant === 'minimal') {
    return (
      <div 
        className={`${baseClasses} ${variantClasses.minimal} ${clickableClasses} ${className}`}
        onClick={onClick}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Icon size={iconSizes.minimal} className="text-white" />
            <div>
              <p className={`${labelClasses.minimal} opacity-60`}>{label}</p>
              <p className={`${valueClasses.minimal} font-bold`}>{value}</p>
            </div>
          </div>
          <StatusIcon status={status} size={statusIconSizes.minimal} />
        </div>
      </div>
    );
  }

  if (variant === 'centered') {
    return (
      <div 
        className={`${baseClasses} ${variantClasses.centered} ${clickableClasses} ${className}`}
        onClick={onClick}
      >
        <div className={`${valueClasses.centered} font-mono`}>{value}</div>
        <div className={`${labelClasses.centered} font-mono opacity-60`}>{label}</div>
        {description && (
          <div className="text-xs font-mono opacity-40">{description}</div>
        )}
      </div>
    );
  }

  if (variant === 'analytics') {
    return (
      <div 
        className={`${baseClasses} ${variantClasses.analytics} ${clickableClasses} ${className}`}
        onClick={onClick}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <span className={`${labelClasses.analytics} font-mono text-gray-500 block mb-2`}>{label}</span>
            <div className={`${valueClasses.analytics} font-mono font-bold`}>{value}</div>
            {description && (
              <div className="text-xs text-gray-500 mt-1">{description}</div>
            )}
          </div>
          <Icon size={36} className="ml-4 flex-shrink-0" />
        </div>
      </div>
    );
  }

  if (variant === 'network') {
    const getNetworkValueColor = () => {
      if (label === 'CURRENT INGRESS') return 'text-green-400';
      if (label === 'CURRENT EGRESS') return 'text-cyan-400';
      if (label === 'PEAK BANDWIDTH') return 'text-yellow-400';
      if (label === 'ACTIVE CONNECTIONS') return 'text-white';
      return 'text-white';
    };

    return (
      <div 
        className={`${baseClasses} ${variantClasses.network} ${clickableClasses} ${className}`}
        onClick={onClick}
      >
        <h3 className={`${labelClasses.network} font-mono mb-2 opacity-60`}>{label}</h3>
        <div className={`${valueClasses.network} font-mono ${getNetworkValueColor()}`}>{value}</div>
      </div>
    );
  }

  if (variant === 'health') {
    // Health variant expects metrics data passed through description as JSON
    let metrics: any[] = [];
    try {
      metrics = description ? JSON.parse(description) : [];
    } catch {
      metrics = [];
    }

    return (
      <div 
        className={`${baseClasses} ${variantClasses.health} ${clickableClasses} ${className}`}
        onClick={onClick}
      >
        {/* Header row: Icon + title on left, status icon on right */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <Icon size={14} className="text-white" />
            <span className="font-mono text-xs font-bold">{label.toUpperCase()}</span>
          </div>
          <StatusIcon status={status} size={12} />
        </div>
        
        {/* 2x2 grid of metrics */}
        <div className="grid grid-cols-2 gap-2">
          {metrics.slice(0, 4).map((metric: any, index: number) => (
            <div key={index} className="text-xs font-mono">
              <div className="text-gray-500">{metric.label}</div>
              <div className="flex items-center space-x-1">
                <span className="text-white">
                  {metric.value}{metric.unit || ''}
                </span>
                {metric.trend && (
                  <span className="text-xs">
                    {metric.trend === 'up' ? '↗' : metric.trend === 'down' ? '↘' : '→'}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`${baseClasses} ${variantClasses[variant]} ${clickableClasses} ${className}`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center justify-between mb-0">
            <p className={`${labelClasses[variant]} opacity-60 uppercase tracking-wider`}>{label}</p>
            {badge && (
              <span className={`px-1.5 py-0.5 border text-xs ${getBadgeClasses(badge.color)}`}>
                {badge.text}
              </span>
            )}
          </div>
          <div className="flex items-center justify-between">
            <p className={`${valueClasses[variant]} font-bold leading-tight`}>{value}</p>
            {trend && (
              <div className="ml-1">
                {getTrendIcon()}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-2 ml-2">
          <Icon size={iconSizes[variant]} className="text-white" />
          <StatusIcon status={status} size={statusIconSizes[variant]} />
        </div>
      </div>
    </div>
  );
};

export default StatCard;
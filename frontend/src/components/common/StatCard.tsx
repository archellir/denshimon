import type { FC } from 'react';
import type { LucideIcon } from 'lucide-react';
import StatusIcon, { getStatusColor } from '@components/common/StatusIcon';
import type { StatusType } from '@components/common/StatusIcon';

export interface StatCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  status: StatusType;
  variant?: 'default' | 'compact' | 'minimal';
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
  badge
}) => {
  const baseClasses = `border ${getStatusColor(status)} font-mono transition-colors`;
  const clickableClasses = onClick ? 'cursor-pointer hover:bg-white/5' : '';
  
  const variantClasses = {
    default: 'pl-5 pr-4 py-3',
    compact: 'pl-4 pr-3 py-2',
    minimal: 'pl-3 pr-2 py-1.5'
  };

  const valueClasses = {
    default: 'text-base',
    compact: 'text-sm',
    minimal: 'text-xs'
  };

  const labelClasses = {
    default: 'text-xs',
    compact: 'text-xs',
    minimal: 'text-xs'
  };

  const iconSizes = {
    default: 20,
    compact: 18,
    minimal: 16
  };

  const statusIconSizes = {
    default: 16,
    compact: 14,
    minimal: 12
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
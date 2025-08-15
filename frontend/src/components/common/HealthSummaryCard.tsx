import type { FC } from 'react';
import { TrendingUp, TrendingDown, Minus, AlertCircle } from 'lucide-react';
import StatusIcon, { type StatusType } from './StatusIcon';
import { Status } from '@constants';
import { HealthCardData } from '@/types';

export interface HealthMetric {
  label: string;
  value: number | string;
  unit?: string;
  status: StatusType;
  trend?: 'up' | 'down' | 'stable';
  trendValue?: number;
  threshold?: {
    warning: number;
    critical: number;
  };
}

interface HealthSummaryCardProps {
  title: string;
  icon?: React.ComponentType<{ className?: string; size?: number }>;
  metrics: HealthMetric[];
  overallStatus?: StatusType;
  className?: string;
  compact?: boolean;
}

const HealthSummaryCard: FC<HealthSummaryCardProps> = ({
  title,
  icon: Icon,
  metrics,
  overallStatus,
  className = '',
  compact = false
}) => {
  // Calculate overall status if not provided
  const calculatedStatus = overallStatus || calculateOverallStatus(metrics);
  
  const getTrendIcon = (trend?: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <TrendingUp size={12} className="text-green-500" />;
      case 'down':
        return <TrendingDown size={12} className="text-red-500" />;
      case 'stable':
        return <Minus size={12} className="text-gray-500" />;
      default:
        return null;
    }
  };

  const getProgressBar = (metric: HealthMetric) => {
    if (typeof metric.value !== 'number' || !metric.threshold) return null;
    
    const percentage = Math.min(100, Math.max(0, metric.value));
    let barColor = 'bg-green-500';
    
    if (percentage >= metric.threshold.critical) {
      barColor = 'bg-red-500';
    } else if (percentage >= metric.threshold.warning) {
      barColor = 'bg-yellow-500';
    }
    
    return (
      <div className="w-full bg-gray-800 h-1 mt-1">
        <div 
          className={`h-full transition-all ${barColor}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    );
  };

  if (compact) {
    return (
      <div className={`border border-white p-3 ${className}`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            {Icon && <Icon size={14} className="text-white" />}
            <span className="font-mono text-xs font-bold">{title.toUpperCase()}</span>
          </div>
          <StatusIcon status={calculatedStatus} size={12} />
        </div>
        
        <div className="grid grid-cols-2 gap-2">
          {metrics.slice(0, 4).map((metric, index) => (
            <div key={index} className="text-xs font-mono">
              <div className="text-gray-500">{metric.label}</div>
              <div className="flex items-center space-x-1">
                <span className="text-white">
                  {metric.value}{metric.unit}
                </span>
                {metric.trend && getTrendIcon(metric.trend)}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`border border-white bg-black ${className}`}>
      {/* Header */}
      <div className="border-b border-white/20 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {Icon && <Icon size={16} className="text-white" />}
          <span className="font-mono text-sm font-bold">{title.toUpperCase()}</span>
        </div>
        <div className="flex items-center space-x-2">
          <StatusIcon status={calculatedStatus} size={14} showLabel />
        </div>
      </div>

      {/* Metrics */}
      <div className="p-4 space-y-3">
        {metrics.map((metric, index) => (
          <div key={index} className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-gray-400">{metric.label}</span>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-mono font-bold">
                  {metric.value}{metric.unit}
                </span>
                {metric.trend && (
                  <div className="flex items-center space-x-1">
                    {getTrendIcon(metric.trend)}
                    {metric.trendValue !== undefined && (
                      <span className="text-xs text-gray-500">
                        {metric.trendValue > 0 ? '+' : ''}{metric.trendValue}%
                      </span>
                    )}
                  </div>
                )}
                <StatusIcon status={metric.status} size={12} />
              </div>
            </div>
            {getProgressBar(metric)}
          </div>
        ))}
      </div>

      {/* Footer Alert if critical */}
      {calculatedStatus === Status.CRITICAL && (
        <div className="border-t border-red-500 px-4 py-2 bg-red-500/10">
          <div className="flex items-center space-x-2">
            <AlertCircle size={14} className="text-red-500" />
            <span className="text-xs font-mono text-red-500">IMMEDIATE ATTENTION REQUIRED</span>
          </div>
        </div>
      )}
    </div>
  );
};

// Utility function to calculate overall status from metrics
const calculateOverallStatus = (metrics: HealthMetric[]): StatusType => {
  if (metrics.some(m => m.status === Status.CRITICAL)) return Status.CRITICAL;
  if (metrics.some(m => m.status === Status.ERROR)) return Status.ERROR;
  if (metrics.some(m => m.status === Status.WARNING)) return Status.WARNING;
  if (metrics.some(m => m.status === Status.PENDING)) return Status.PENDING;
  if (metrics.every(m => m.status === Status.HEALTHY)) return Status.HEALTHY;
  return Status.UNKNOWN;
};

export default HealthSummaryCard;

// Preset health card configurations
export const createClusterHealthCard = (data: HealthCardData) => ({
  title: 'Cluster Health',
  metrics: [
    {
      label: 'Node Availability',
      value: `${data.readyNodes}/${data.totalNodes}`,
      status: data.readyNodes === data.totalNodes ? 'healthy' as StatusType : 'warning' as StatusType,
    },
    {
      label: 'Pod Success Rate',
      value: data.runningPods && data.totalPods ? ((data.runningPods / data.totalPods) * 100).toFixed(1) : '0',
      unit: '%',
      status: (data.runningPods && data.totalPods && data.runningPods / data.totalPods > 0.95) ? 'healthy' as StatusType : 'warning' as StatusType,
      threshold: { warning: 90, critical: 80 },
    },
    {
      label: 'CPU Utilization',
      value: data.cpuUsage?.toFixed(1) ?? '0',
      unit: '%',
      status: (data.cpuUsage ?? 0) < 70 ? Status.HEALTHY as StatusType : (data.cpuUsage ?? 0) < 85 ? Status.WARNING as StatusType : Status.CRITICAL as StatusType,
      trend: data.cpuTrend,
      trendValue: data.cpuTrendValue,
      threshold: { warning: 70, critical: 85 },
    },
    {
      label: 'Memory Utilization',
      value: data.memoryUsage?.toFixed(1) ?? '0',
      unit: '%',
      status: (data.memoryUsage ?? 0) < 70 ? Status.HEALTHY as StatusType : (data.memoryUsage ?? 0) < 85 ? Status.WARNING as StatusType : Status.CRITICAL as StatusType,
      trend: data.memoryTrend,
      trendValue: data.memoryTrendValue,
      threshold: { warning: 70, critical: 85 },
    },
  ],
});

export const createApplicationHealthCard = (data: HealthCardData) => ({
  title: 'Application Health',
  metrics: [
    {
      label: 'Request Rate',
      value: data.requestRate?.toFixed(0) ?? '0',
      unit: ' rps',
      status: 'healthy' as StatusType,
      trend: data.requestTrend,
    },
    {
      label: 'Error Rate',
      value: data.errorRate?.toFixed(2) ?? '0',
      unit: '%',
      status: (data.errorRate ?? 0) < 1 ? 'healthy' as StatusType : (data.errorRate ?? 0) < 5 ? 'warning' as StatusType : 'error' as StatusType,
      trend: data.errorTrend,
      threshold: { warning: 1, critical: 5 },
    },
    {
      label: 'P95 Latency',
      value: data.p95Latency ?? 0,
      unit: 'ms',
      status: (data.p95Latency ?? 0) < 100 ? 'healthy' as StatusType : (data.p95Latency ?? 0) < 500 ? 'warning' as StatusType : 'error' as StatusType,
      trend: data.latencyTrend,
    },
    {
      label: 'Availability',
      value: data.availability?.toFixed(2) ?? '0',
      unit: '%',
      status: (data.availability ?? 0) > 99.9 ? 'healthy' as StatusType : (data.availability ?? 0) > 99 ? 'warning' as StatusType : 'error' as StatusType,
    },
  ],
});

export const createNetworkHealthCard = (data: HealthCardData) => ({
  title: 'Network Health',
  metrics: [
    {
      label: 'Ingress Traffic',
      value: data.ingressRate?.toFixed(1) ?? '0',
      unit: ' MB/s',
      status: 'healthy' as StatusType,
      trend: data.ingressTrend,
    },
    {
      label: 'Egress Traffic',
      value: data.egressRate?.toFixed(1) ?? '0',
      unit: ' MB/s',
      status: 'healthy' as StatusType,
      trend: data.egressTrend,
    },
    {
      label: 'Connection Errors',
      value: data.connectionErrors ?? 0,
      status: (data.connectionErrors ?? 0) === 0 ? 'healthy' as StatusType : (data.connectionErrors ?? 0) < 10 ? 'warning' as StatusType : 'error' as StatusType,
    },
    {
      label: 'Active Connections',
      value: data.activeConnections,
      status: 'healthy' as StatusType,
    },
  ],
});

export const createStorageHealthCard = (data: HealthCardData) => ({
  title: 'Storage Health',
  metrics: [
    {
      label: 'Volume Usage',
      value: data.volumeUsage?.toFixed(1) ?? '0',
      unit: '%',
      status: (data.volumeUsage ?? 0) < 70 ? Status.HEALTHY as StatusType : (data.volumeUsage ?? 0) < 85 ? Status.WARNING as StatusType : Status.CRITICAL as StatusType,
      trend: data.volumeTrend,
      threshold: { warning: 70, critical: 85 },
    },
    {
      label: 'PVC Bound',
      value: `${data.boundPVCs}/${data.totalPVCs}`,
      status: data.boundPVCs === data.totalPVCs ? 'healthy' as StatusType : 'warning' as StatusType,
    },
    {
      label: 'IOPS',
      value: data.iops,
      unit: '/s',
      status: 'healthy' as StatusType,
      trend: data.iopsTrend,
    },
    {
      label: 'Throughput',
      value: data.throughput?.toFixed(1) ?? '0',
      unit: ' MB/s',
      status: 'healthy' as StatusType,
    },
  ],
});
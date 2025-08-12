import type { LucideIcon } from 'lucide-react';
import { 
  Activity, 
  Server, 
  Database, 
  Cpu, 
  MemoryStick, 
  Network, 
  Clock, 
  Package, 
  GitBranch, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Bell, 
  FileText, 
  BarChart3 
} from 'lucide-react';
import { HealthStatus, QUICK_STATS_MOCK_DATA, QUICK_STATS_THRESHOLDS, QUICK_STATS_LABELS } from '@constants';
import type { StatusType } from '@components/common/StatusIcon';

export interface QuickStat {
  label: string;
  value: string;
  icon: LucideIcon;
  status: StatusType;
}

export interface ClusterMetrics {
  ready_nodes: number;
  total_nodes: number;
  running_pods: number;
  total_pods: number;
  cpu_usage: { usage_percent: number };
  memory_usage: { usage_percent: number };
}

// Helper function to determine status based on thresholds
const getThresholdStatus = (
  value: number,
  thresholds: { HEALTHY?: number; WARNING?: number; CRITICAL?: number },
  isHigherBetter = false
): StatusType => {
  if (isHigherBetter) {
    // For metrics where higher values are better (e.g., success rate, SLO health)
    if (thresholds.HEALTHY && value >= thresholds.HEALTHY) return HealthStatus.HEALTHY as StatusType;
    if (thresholds.WARNING && value >= thresholds.WARNING) return HealthStatus.WARNING as StatusType;
    return HealthStatus.CRITICAL as StatusType;
  } else {
    // For metrics where lower values are better (e.g., error rate, latency)
    if (thresholds.HEALTHY && value <= thresholds.HEALTHY) return HealthStatus.HEALTHY as StatusType;
    if (thresholds.WARNING && value <= thresholds.WARNING) return HealthStatus.WARNING as StatusType;
    return HealthStatus.CRITICAL as StatusType;
  }
};

// Helper function to get conditional icon based on status
const getConditionalIcon = (
  value: number,
  icons: { healthy?: LucideIcon; warning?: LucideIcon; critical?: LucideIcon },
  thresholds: { HEALTHY?: number; WARNING?: number },
  isHigherBetter = false
): LucideIcon => {
  const status = getThresholdStatus(value, thresholds, isHigherBetter);
  
  switch (status) {
    case HealthStatus.HEALTHY:
      return icons.healthy || CheckCircle;
    case HealthStatus.WARNING:
      return icons.warning || AlertTriangle;
    case HealthStatus.CRITICAL:
      return icons.critical || XCircle;
    default:
      return icons.healthy || CheckCircle;
  }
};

export const generateInfrastructureStats = (clusterMetrics: ClusterMetrics): QuickStat[] => {
  return [
    {
      label: QUICK_STATS_LABELS.NODES,
      value: `${clusterMetrics.ready_nodes}/${clusterMetrics.total_nodes}`,
      icon: Server,
      status: clusterMetrics.ready_nodes === clusterMetrics.total_nodes 
        ? HealthStatus.HEALTHY as StatusType 
        : HealthStatus.WARNING as StatusType,
    },
    {
      label: QUICK_STATS_LABELS.PODS,
      value: `${clusterMetrics.running_pods}/${clusterMetrics.total_pods}`,
      icon: Database,
      status: clusterMetrics.running_pods > 0 
        ? HealthStatus.HEALTHY as StatusType 
        : HealthStatus.ERROR as StatusType,
    },
    {
      label: QUICK_STATS_LABELS.CPU,
      value: `${clusterMetrics.cpu_usage.usage_percent.toFixed(1)}%`,
      icon: Cpu,
      status: getThresholdStatus(
        clusterMetrics.cpu_usage.usage_percent,
        QUICK_STATS_THRESHOLDS.CPU,
        false
      ),
    },
    {
      label: QUICK_STATS_LABELS.MEMORY,
      value: `${clusterMetrics.memory_usage.usage_percent.toFixed(1)}%`,
      icon: MemoryStick,
      status: getThresholdStatus(
        clusterMetrics.memory_usage.usage_percent,
        QUICK_STATS_THRESHOLDS.MEMORY,
        false
      ),
    },
  ];
};

export const generateWorkloadsStats = (clusterMetrics: ClusterMetrics): QuickStat[] => {
  const failedPods = clusterMetrics.total_pods - clusterMetrics.running_pods;
  const { DEPLOYMENT_COUNT, SERVICE_COUNT } = QUICK_STATS_MOCK_DATA.WORKLOADS;

  return [
    {
      label: QUICK_STATS_LABELS.DEPLOYMENTS,
      value: DEPLOYMENT_COUNT.toString(),
      icon: Package,
      status: DEPLOYMENT_COUNT > 0 ? HealthStatus.HEALTHY as StatusType : HealthStatus.WARNING as StatusType,
    },
    {
      label: QUICK_STATS_LABELS.RUNNING_PODS,
      value: `${clusterMetrics.running_pods}/${clusterMetrics.total_pods}`,
      icon: Database,
      status: clusterMetrics.running_pods > 0 ? HealthStatus.HEALTHY as StatusType : HealthStatus.ERROR as StatusType,
    },
    {
      label: QUICK_STATS_LABELS.SERVICES,
      value: SERVICE_COUNT.toString(),
      icon: Network,
      status: SERVICE_COUNT > 0 ? HealthStatus.HEALTHY as StatusType : HealthStatus.WARNING as StatusType,
    },
    {
      label: QUICK_STATS_LABELS.FAILED_PODS,
      value: failedPods.toString(),
      icon: AlertTriangle,
      status: failedPods === 0 
        ? HealthStatus.HEALTHY as StatusType 
        : failedPods < 3 
        ? HealthStatus.WARNING as StatusType 
        : HealthStatus.CRITICAL as StatusType,
    },
  ];
};

export const generateMeshStats = (): QuickStat[] => {
  const { ACTIVE_SERVICES, REQUEST_RATE, SUCCESS_RATE, P99_LATENCY } = QUICK_STATS_MOCK_DATA.MESH;

  return [
    {
      label: QUICK_STATS_LABELS.ACTIVE_SERVICES,
      value: ACTIVE_SERVICES.toString(),
      icon: Server,
      status: ACTIVE_SERVICES > 0 ? HealthStatus.HEALTHY as StatusType : HealthStatus.WARNING as StatusType,
    },
    {
      label: QUICK_STATS_LABELS.REQUEST_RATE,
      value: `${(REQUEST_RATE / 1000).toFixed(1)}K/min`,
      icon: Activity,
      status: getThresholdStatus(REQUEST_RATE, QUICK_STATS_THRESHOLDS.REQUEST_RATE, true),
    },
    {
      label: QUICK_STATS_LABELS.SUCCESS_RATE,
      value: `${SUCCESS_RATE.toFixed(1)}%`,
      icon: TrendingUp,
      status: getThresholdStatus(SUCCESS_RATE, QUICK_STATS_THRESHOLDS.SUCCESS_RATE, true),
    },
    {
      label: QUICK_STATS_LABELS.P99_LATENCY,
      value: `${P99_LATENCY}ms`,
      icon: Clock,
      status: getThresholdStatus(P99_LATENCY, QUICK_STATS_THRESHOLDS.LATENCY, false),
    },
  ];
};

export const generateDeploymentStats = (): QuickStat[] => {
  const { TOTAL_APPLICATIONS, REPOSITORIES, RECENT_DEPLOYMENTS, SUCCESS_RATE } = QUICK_STATS_MOCK_DATA.DEPLOYMENTS;

  return [
    {
      label: QUICK_STATS_LABELS.APPLICATIONS,
      value: TOTAL_APPLICATIONS.toString(),
      icon: Package,
      status: TOTAL_APPLICATIONS > 0 ? HealthStatus.HEALTHY as StatusType : HealthStatus.WARNING as StatusType,
    },
    {
      label: QUICK_STATS_LABELS.REPOSITORIES,
      value: REPOSITORIES.toString(),
      icon: GitBranch,
      status: REPOSITORIES > 0 ? HealthStatus.HEALTHY as StatusType : HealthStatus.WARNING as StatusType,
    },
    {
      label: QUICK_STATS_LABELS.RECENT_DEPLOYS,
      value: `${RECENT_DEPLOYMENTS}/24h`,
      icon: Activity,
      status: getThresholdStatus(RECENT_DEPLOYMENTS, QUICK_STATS_THRESHOLDS.RECENT_DEPLOYMENTS, true),
    },
    {
      label: QUICK_STATS_LABELS.SUCCESS_RATE,
      value: `${SUCCESS_RATE.toFixed(1)}%`,
      icon: getConditionalIcon(
        SUCCESS_RATE,
        { healthy: CheckCircle, warning: AlertTriangle, critical: XCircle },
        QUICK_STATS_THRESHOLDS.DEPLOYMENT_SUCCESS_RATE,
        true
      ),
      status: getThresholdStatus(SUCCESS_RATE, QUICK_STATS_THRESHOLDS.DEPLOYMENT_SUCCESS_RATE, true),
    },
  ];
};

export const generateObservabilityStats = (): QuickStat[] => {
  const { LOG_EVENTS_PER_MIN, ERROR_RATE, SLO_HEALTH } = QUICK_STATS_MOCK_DATA.OBSERVABILITY;
  const ACTIVE_ALERTS = QUICK_STATS_MOCK_DATA.OBSERVABILITY.ACTIVE_ALERTS;

  return [
    {
      label: QUICK_STATS_LABELS.ACTIVE_ALERTS,
      value: ACTIVE_ALERTS.toString(),
      icon: Bell,
      status: ACTIVE_ALERTS <= QUICK_STATS_THRESHOLDS.ALERTS.HEALTHY 
        ? HealthStatus.HEALTHY as StatusType 
        : ACTIVE_ALERTS < QUICK_STATS_THRESHOLDS.ALERTS.WARNING 
        ? HealthStatus.WARNING as StatusType 
        : HealthStatus.CRITICAL as StatusType,
    },
    {
      label: QUICK_STATS_LABELS.LOG_EVENTS,
      value: `${(LOG_EVENTS_PER_MIN / 1000).toFixed(1)}K/min`,
      icon: FileText,
      status: (LOG_EVENTS_PER_MIN > QUICK_STATS_THRESHOLDS.LOG_EVENTS.MIN_HEALTHY && 
               LOG_EVENTS_PER_MIN < QUICK_STATS_THRESHOLDS.LOG_EVENTS.MAX_HEALTHY) 
        ? HealthStatus.HEALTHY as StatusType 
        : LOG_EVENTS_PER_MIN < QUICK_STATS_THRESHOLDS.LOG_EVENTS.MIN_WARNING 
        ? HealthStatus.WARNING as StatusType 
        : HealthStatus.CRITICAL as StatusType,
    },
    {
      label: QUICK_STATS_LABELS.ERROR_RATE,
      value: `${ERROR_RATE.toFixed(1)}%`,
      icon: getConditionalIcon(
        ERROR_RATE,
        { healthy: CheckCircle, warning: AlertTriangle, critical: XCircle },
        QUICK_STATS_THRESHOLDS.ERROR_RATE,
        false
      ),
      status: getThresholdStatus(ERROR_RATE, QUICK_STATS_THRESHOLDS.ERROR_RATE, false),
    },
    {
      label: QUICK_STATS_LABELS.SLO_HEALTH,
      value: `${SLO_HEALTH.toFixed(1)}%`,
      icon: BarChart3,
      status: getThresholdStatus(SLO_HEALTH, QUICK_STATS_THRESHOLDS.SLO_HEALTH, true),
    },
  ];
};
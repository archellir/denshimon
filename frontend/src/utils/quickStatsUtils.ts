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
import { Status, MOCK_DATA, THRESHOLDS, UI_LABELS } from '@constants';
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
    if (thresholds.HEALTHY && value >= thresholds.HEALTHY) return Status.HEALTHY as StatusType;
    if (thresholds.WARNING && value >= thresholds.WARNING) return Status.WARNING as StatusType;
    return Status.CRITICAL as StatusType;
  } else {
    // For metrics where lower values are better (e.g., error rate, latency)
    if (thresholds.HEALTHY && value <= thresholds.HEALTHY) return Status.HEALTHY as StatusType;
    if (thresholds.WARNING && value <= thresholds.WARNING) return Status.WARNING as StatusType;
    return Status.CRITICAL as StatusType;
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
    case Status.HEALTHY:
      return icons.healthy || CheckCircle;
    case Status.WARNING:
      return icons.warning || AlertTriangle;
    case Status.CRITICAL:
      return icons.critical || XCircle;
    default:
      return icons.healthy || CheckCircle;
  }
};

export const generateInfrastructureStats = (clusterMetrics: ClusterMetrics): QuickStat[] => {
  return [
    {
      label: UI_LABELS.NODES,
      value: `${clusterMetrics.ready_nodes}/${clusterMetrics.total_nodes}`,
      icon: Server,
      status: clusterMetrics.ready_nodes === clusterMetrics.total_nodes 
        ? Status.HEALTHY as StatusType 
        : Status.WARNING as StatusType,
    },
    {
      label: UI_LABELS.PODS,
      value: `${clusterMetrics.running_pods}/${clusterMetrics.total_pods}`,
      icon: Database,
      status: clusterMetrics.running_pods > 0 
        ? Status.HEALTHY as StatusType 
        : Status.ERROR as StatusType,
    },
    {
      label: UI_LABELS.CPU,
      value: `${clusterMetrics.cpu_usage.usage_percent.toFixed(1)}%`,
      icon: Cpu,
      status: getThresholdStatus(
        clusterMetrics.cpu_usage.usage_percent,
        THRESHOLDS.CPU,
        false
      ),
    },
    {
      label: UI_LABELS.MEMORY,
      value: `${clusterMetrics.memory_usage.usage_percent.toFixed(1)}%`,
      icon: MemoryStick,
      status: getThresholdStatus(
        clusterMetrics.memory_usage.usage_percent,
        THRESHOLDS.MEMORY,
        false
      ),
    },
  ];
};

export const generateWorkloadsStats = (clusterMetrics: ClusterMetrics): QuickStat[] => {
  const failedPods = clusterMetrics.total_pods - clusterMetrics.running_pods;
  const { DEPLOYMENT_COUNT, SERVICE_COUNT } = MOCK_DATA.WORKLOADS;

  return [
    {
      label: UI_LABELS.DEPLOYMENTS,
      value: DEPLOYMENT_COUNT.toString(),
      icon: Package,
      status: DEPLOYMENT_COUNT > 0 ? Status.HEALTHY as StatusType : Status.WARNING as StatusType,
    },
    {
      label: UI_LABELS.RUNNING_PODS,
      value: `${clusterMetrics.running_pods}/${clusterMetrics.total_pods}`,
      icon: Database,
      status: clusterMetrics.running_pods > 0 ? Status.HEALTHY as StatusType : Status.ERROR as StatusType,
    },
    {
      label: UI_LABELS.SERVICES,
      value: SERVICE_COUNT.toString(),
      icon: Network,
      status: SERVICE_COUNT > 0 ? Status.HEALTHY as StatusType : Status.WARNING as StatusType,
    },
    {
      label: UI_LABELS.FAILED_PODS,
      value: failedPods.toString(),
      icon: AlertTriangle,
      status: failedPods === 0 
        ? Status.HEALTHY as StatusType 
        : failedPods < 3 
        ? Status.WARNING as StatusType 
        : Status.CRITICAL as StatusType,
    },
  ];
};

export const generateMeshStats = (): QuickStat[] => {
  const { ACTIVE_SERVICES, REQUEST_RATE, SUCCESS_RATE, P99_LATENCY } = MOCK_DATA.MESH;

  return [
    {
      label: UI_LABELS.ACTIVE_SERVICES,
      value: ACTIVE_SERVICES.toString(),
      icon: Server,
      status: ACTIVE_SERVICES > 0 ? Status.HEALTHY as StatusType : Status.WARNING as StatusType,
    },
    {
      label: UI_LABELS.REQUEST_RATE,
      value: `${(REQUEST_RATE / 1000).toFixed(1)}K/min`,
      icon: Activity,
      status: getThresholdStatus(REQUEST_RATE, THRESHOLDS.REQUEST_RATE, true),
    },
    {
      label: UI_LABELS.SUCCESS_RATE,
      value: `${SUCCESS_RATE.toFixed(1)}%`,
      icon: TrendingUp,
      status: getThresholdStatus(SUCCESS_RATE, THRESHOLDS.SUCCESS_RATE, true),
    },
    {
      label: UI_LABELS.P99_LATENCY,
      value: `${P99_LATENCY}ms`,
      icon: Clock,
      status: getThresholdStatus(P99_LATENCY, THRESHOLDS.LATENCY, false),
    },
  ];
};

export const generateDeploymentStats = (): QuickStat[] => {
  const { TOTAL_APPLICATIONS, REPOSITORIES, RECENT_DEPLOYMENTS, SUCCESS_RATE } = MOCK_DATA.DEPLOYMENTS;

  return [
    {
      label: UI_LABELS.APPLICATIONS,
      value: TOTAL_APPLICATIONS.toString(),
      icon: Package,
      status: TOTAL_APPLICATIONS > 0 ? Status.HEALTHY as StatusType : Status.WARNING as StatusType,
    },
    {
      label: UI_LABELS.REPOSITORIES,
      value: REPOSITORIES.toString(),
      icon: GitBranch,
      status: REPOSITORIES > 0 ? Status.HEALTHY as StatusType : Status.WARNING as StatusType,
    },
    {
      label: UI_LABELS.RECENT_DEPLOYS,
      value: `${RECENT_DEPLOYMENTS}/24h`,
      icon: Activity,
      status: getThresholdStatus(RECENT_DEPLOYMENTS, THRESHOLDS.RECENT_DEPLOYMENTS, true),
    },
    {
      label: UI_LABELS.SUCCESS_RATE,
      value: `${SUCCESS_RATE.toFixed(1)}%`,
      icon: getConditionalIcon(
        SUCCESS_RATE,
        { healthy: CheckCircle, warning: AlertTriangle, critical: XCircle },
        THRESHOLDS.DEPLOYMENT_SUCCESS_RATE,
        true
      ),
      status: getThresholdStatus(SUCCESS_RATE, THRESHOLDS.DEPLOYMENT_SUCCESS_RATE, true),
    },
  ];
};

export const generateObservabilityStats = (): QuickStat[] => {
  const { LOG_EVENTS_PER_MIN, ERROR_RATE, SLO_HEALTH } = MOCK_DATA.OBSERVABILITY;
  const ACTIVE_ALERTS = MOCK_DATA.OBSERVABILITY.ACTIVE_ALERTS;

  return [
    {
      label: UI_LABELS.ACTIVE_ALERTS,
      value: ACTIVE_ALERTS.toString(),
      icon: Bell,
      status: ACTIVE_ALERTS <= THRESHOLDS.ALERTS.HEALTHY 
        ? Status.HEALTHY as StatusType 
        : ACTIVE_ALERTS < THRESHOLDS.ALERTS.WARNING 
        ? Status.WARNING as StatusType 
        : Status.CRITICAL as StatusType,
    },
    {
      label: UI_LABELS.LOG_EVENTS,
      value: `${(LOG_EVENTS_PER_MIN / 1000).toFixed(1)}K/min`,
      icon: FileText,
      status: (LOG_EVENTS_PER_MIN > THRESHOLDS.LOG_EVENTS.MIN_HEALTHY && 
               LOG_EVENTS_PER_MIN < THRESHOLDS.LOG_EVENTS.MAX_HEALTHY) 
        ? Status.HEALTHY as StatusType 
        : LOG_EVENTS_PER_MIN < THRESHOLDS.LOG_EVENTS.MIN_WARNING 
        ? Status.WARNING as StatusType 
        : Status.CRITICAL as StatusType,
    },
    {
      label: UI_LABELS.ERROR_RATE,
      value: `${ERROR_RATE.toFixed(1)}%`,
      icon: getConditionalIcon(
        ERROR_RATE,
        { healthy: CheckCircle, warning: AlertTriangle, critical: XCircle },
        THRESHOLDS.ERROR_RATE,
        false
      ),
      status: getThresholdStatus(ERROR_RATE, THRESHOLDS.ERROR_RATE, false),
    },
    {
      label: UI_LABELS.SLO_HEALTH,
      value: `${SLO_HEALTH.toFixed(1)}%`,
      icon: BarChart3,
      status: getThresholdStatus(SLO_HEALTH, THRESHOLDS.SLO_HEALTH, true),
    },
  ];
};
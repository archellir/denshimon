import { format } from 'date-fns';

/**
 * Formats workload chart data from metrics history
 */
export const formatWorkloadChartData = (metricsHistory: any) => {
  if (!metricsHistory || !metricsHistory.pods || !Array.isArray(metricsHistory.pods)) {
    return [];
  }

  try {
    const data = metricsHistory.pods.map((podPoint: any, index: number) => {
      if (!podPoint || !podPoint.timestamp || typeof podPoint.value !== 'number') {
        return null;
      }
      
      return {
        time: format(new Date(podPoint.timestamp), 'HH:mm'),
        pods: podPoint.value || 0,
        // Add CPU utilization trend for cluster context
        cpu: metricsHistory.cpu?.[index]?.value || 0,
      };
    }).filter(Boolean);
    
    return data;
  } catch (error) {
    console.error('Error formatting workload chart data:', error);
    return [];
  }
};

/**
 * Formats pod status data for pie charts
 */
export const formatPodStatusData = (clusterMetrics: any) => {
  if (!clusterMetrics) return [];

  return [
    { name: 'RUNNING', value: clusterMetrics.running_pods, color: '#00FF00' },
    { name: 'PENDING', value: clusterMetrics.pending_pods, color: '#FFFF00' },
    { name: 'FAILED', value: clusterMetrics.failed_pods, color: '#FF0000' },
  ].filter(item => item.value > 0);
};

/**
 * Generates workload types distribution data
 */
export const generateWorkloadTypesData = (clusterMetrics: any) => {
  if (!clusterMetrics) return [];

  // This would ideally come from actual API data
  const totalPods = clusterMetrics.running_pods + clusterMetrics.pending_pods + clusterMetrics.failed_pods;
  const deploymentPods = Math.floor(totalPods * 0.6);
  const daemonsetPods = Math.floor(totalPods * 0.2);
  const statefulsetPods = Math.floor(totalPods * 0.15);
  const standalonePods = totalPods - deploymentPods - daemonsetPods - statefulsetPods;

  return [
    { name: 'Deployments', value: deploymentPods, color: '#00FF00' },
    { name: 'DaemonSets', value: daemonsetPods, color: '#FFFF00' },
    { name: 'StatefulSets', value: statefulsetPods, color: '#00FFFF' },
    { name: 'Standalone', value: standalonePods, color: '#FF00FF' },
  ].filter(item => item.value > 0);
};

/**
 * Generates namespace distribution data
 */
export const generateNamespaceData = (clusterMetrics: any) => {
  if (!clusterMetrics) return [];

  // This would ideally come from actual API data
  const totalPods = clusterMetrics.running_pods + clusterMetrics.pending_pods + clusterMetrics.failed_pods;
  
  return [
    { name: 'production', value: Math.floor(totalPods * 0.4), color: '#00FF00' },
    { name: 'staging', value: Math.floor(totalPods * 0.3), color: '#FFFF00' },
    { name: 'development', value: Math.floor(totalPods * 0.2), color: '#00FFFF' },
    { name: 'kube-system', value: Math.floor(totalPods * 0.1), color: '#FF00FF' },
  ].filter(item => item.value > 0);
};

/**
 * Calculates workload health score
 */
export const calculateWorkloadHealthScore = (
  runningPods: number,
  totalPods: number,
  failedPods: number
): number => {
  if (totalPods === 0) return 100;
  
  const runningRatio = runningPods / totalPods;
  const failedRatio = failedPods / totalPods;
  
  let score = runningRatio * 100;
  score -= failedRatio * 50; // Penalize failed pods more heavily
  
  return Math.max(0, Math.min(100, Math.round(score)));
};

/**
 * Gets workload health status from metrics
 */
export const getWorkloadHealthStatus = (
  runningPods: number,
  totalPods: number,
  failedPods: number
): 'healthy' | 'warning' | 'critical' => {
  const score = calculateWorkloadHealthScore(runningPods, totalPods, failedPods);
  
  if (score >= 90) return 'healthy';
  if (score >= 70) return 'warning';
  return 'critical';
};

/**
 * Formats resource utilization percentage
 */
export const formatResourceUtilization = (used: number, total: number): string => {
  if (total === 0) return '0%';
  return `${Math.round((used / total) * 100)}%`;
};

/**
 * Gets resource utilization color
 */
export const getResourceUtilizationColor = (percentage: number): string => {
  if (percentage >= 90) return 'text-red-400';
  if (percentage >= 75) return 'text-yellow-400';
  return 'text-green-400';
};

/**
 * Calculates average response time from metrics
 */
export const calculateAverageResponseTime = (responseTimes: number[]): number => {
  if (!responseTimes || responseTimes.length === 0) return 0;
  
  const sum = responseTimes.reduce((acc, time) => acc + time, 0);
  return Math.round(sum / responseTimes.length);
};

/**
 * Charts color palette for workload visualizations
 */
export const WORKLOAD_CHART_COLORS = {
  running: '#00FF00',
  pending: '#FFFF00',
  failed: '#FF0000',
  succeeded: '#00FFFF',
  unknown: '#888888',
  cpu: '#0099FF',
  memory: '#FF6600',
  storage: '#9900FF'
};
/**
 * Utility functions for log analytics and trend analysis
 */

/**
 * Gets CSS color class for trend direction
 */
export const getTrendColor = (trend: 'up' | 'down' | 'stable') => {
  switch (trend) {
    case 'up': return 'text-red-500';
    case 'down': return 'text-green-500';
    case 'stable': return 'text-yellow-500';
  }
};

/**
 * Gets trend icon for display
 */
export const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
  switch (trend) {
    case 'up': return '↗️';
    case 'down': return '↘️';
    case 'stable': return '→';
  }
};

/**
 * Generates mock log analytics metrics
 */
export const generateMockAnalyticsMetrics = () => {
  const totalLogs = Math.floor(Math.random() * 50000) + 25000;
  const errorCount = Math.floor(Math.random() * 2000) + 500;
  const warningCount = Math.floor(Math.random() * 5000) + 1500;

  return {
    totalLogs,
    errorRate: (errorCount / totalLogs) * 100,
    warningRate: (warningCount / totalLogs) * 100,
    avgLogsPerMinute: Math.floor(Math.random() * 100) + 50,

    topSources: [
      { source: 'kubernetes-api', count: 12453, percentage: 32.1 },
      { source: 'nginx-ingress', count: 9876, percentage: 25.4 },
      { source: 'application-api', count: 7234, percentage: 18.6 },
      { source: 'database-mysql', count: 5432, percentage: 14.0 },
      { source: 'redis-cache', count: 3876, percentage: 9.9 }
    ],

    topNamespaces: [
      { namespace: 'production', count: 18765, percentage: 48.3 },
      { namespace: 'staging', count: 8934, percentage: 23.0 },
      { namespace: 'monitoring', count: 6234, percentage: 16.0 },
      { namespace: 'kube-system', count: 3456, percentage: 8.9 },
      { namespace: 'default', count: 1456, percentage: 3.8 }
    ],

    hourlyDistribution: Array.from({ length: 24 }, (_, hour) => ({
      hour,
      errors: Math.floor(Math.random() * 50) + 10,
      warnings: Math.floor(Math.random() * 150) + 50,
      info: Math.floor(Math.random() * 800) + 200,
      debug: Math.floor(Math.random() * 300) + 100
    })),

    severityTrend: Array.from({ length: 48 }, (_, i) => ({
      time: `${i}:00`,
      errors: Math.floor(Math.random() * 30) + 5,
      warnings: Math.floor(Math.random() * 80) + 20,
      info: Math.floor(Math.random() * 200) + 50
    })),

    responseTimeDistribution: [
      { range: '0-50ms', count: 15234 },
      { range: '50-100ms', count: 8765 },
      { range: '100-200ms', count: 4532 },
      { range: '200-500ms', count: 2341 },
      { range: '500ms+', count: 876 }
    ],

    errorPatterns: [
      { pattern: 'Connection timeout', count: 234, trend: 'up' as const },
      { pattern: 'Authentication failed', count: 189, trend: 'stable' as const },
      { pattern: 'Database connection error', count: 156, trend: 'down' as const },
      { pattern: 'Memory allocation failed', count: 134, trend: 'up' as const },
      { pattern: 'Rate limit exceeded', count: 98, trend: 'stable' as const }
    ]
  };
};

/**
 * Chart colors for analytics visualizations
 */
export const ANALYTICS_COLORS = ['#00ff00', '#ff00ff', '#00ffff', '#ffff00', '#ff6600'];
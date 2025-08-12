import type { NamespaceMetrics } from '@/types/metrics';

export const mockNamespaces: NamespaceMetrics[] = [
  {
    name: 'default',
    pod_count: 3,
    cpu_usage: {
      usage: 1.2,
      used: 1200,
      total: 10000,
      available: 8800,
      usage_percent: 12.0,
      unit: 'millicores'
    },
    memory_usage: {
      usage: 2147483648, // 2GB
      used: 2147483648,
      total: 21474836480,
      available: 19327352832,
      usage_percent: 10.0,
      unit: 'bytes'
    },
    last_updated: new Date().toISOString()
  },
  {
    name: 'kube-system',
    pod_count: 4,
    cpu_usage: {
      usage: 1.8,
      used: 1800,
      total: 10000,
      available: 8200,
      usage_percent: 18.0,
      unit: 'millicores'
    },
    memory_usage: {
      usage: 3221225472, // 3GB
      used: 3221225472,
      total: 21474836480,
      available: 18253611008,
      usage_percent: 15.0,
      unit: 'bytes'
    },
    last_updated: new Date().toISOString()
  },
  {
    name: 'denshimon',
    pod_count: 2,
    cpu_usage: {
      usage: 0.8,
      used: 800,
      total: 10000,
      available: 9200,
      usage_percent: 8.0,
      unit: 'millicores'
    },
    memory_usage: {
      usage: 1073741824, // 1GB
      used: 1073741824,
      total: 21474836480,
      available: 20401094656,
      usage_percent: 5.0,
      unit: 'bytes'
    },
    last_updated: new Date().toISOString()
  },
  {
    name: 'monitoring',
    pod_count: 1,
    cpu_usage: {
      usage: 0.28,
      used: 280,
      total: 10000,
      available: 9720,
      usage_percent: 2.8,
      unit: 'millicores'
    },
    memory_usage: {
      usage: 966367641, // ~922MB
      used: 966367641,
      total: 21474836480,
      available: 20508468839,
      usage_percent: 4.5,
      unit: 'bytes'
    },
    last_updated: new Date().toISOString()
  }
];
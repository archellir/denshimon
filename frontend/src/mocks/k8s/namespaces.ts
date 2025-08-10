import type { NamespaceMetrics } from '@types/metrics';

export const mockNamespaces: NamespaceMetrics[] = [
  {
    name: 'default',
    pod_count: 3,
    cpu_usage: {
      used: 83,
      total: 300,
      available: 217,
      usage_percent: 27.7,
      usage: 0.083,
      limit: 0.3
    },
    memory_usage: {
      used: 213909504, // ~204MB
      total: 402653184, // ~384MB
      available: 188743680,
      usage_percent: 53.1,
      usage: 213909504,
      limit: 402653184
    },
    last_updated: new Date().toISOString()
  },
  {
    name: 'kube-system',
    pod_count: 3,
    cpu_usage: {
      used: 345,
      total: 800,
      available: 455,
      usage_percent: 43.1,
      usage: 0.345,
      limit: 0.8
    },
    memory_usage: {
      used: 542900224, // ~518MB
      total: 1610612736, // ~1.5GB
      available: 1067712512,
      usage_percent: 33.7,
      usage: 542900224,
      limit: 1610612736
    },
    last_updated: new Date().toISOString()
  },
  {
    name: 'monitoring',
    pod_count: 2,
    cpu_usage: {
      used: 500,
      total: 1200,
      available: 700,
      usage_percent: 41.7,
      usage: 0.5,
      limit: 1.2
    },
    memory_usage: {
      used: 1526726656, // ~1.4GB
      total: 2684354560, // ~2.5GB
      available: 1157627904,
      usage_percent: 56.9,
      usage: 1526726656,
      limit: 2684354560
    },
    last_updated: new Date().toISOString()
  },
  {
    name: 'production',
    pod_count: 1,
    cpu_usage: {
      used: 0,
      total: 200,
      available: 200,
      usage_percent: 0.0,
      usage: 0,
      limit: 0.2
    },
    memory_usage: {
      used: 0,
      total: 268435456, // 256MB
      available: 268435456,
      usage_percent: 0.0,
      usage: 0,
      limit: 268435456
    },
    last_updated: new Date().toISOString()
  },
  {
    name: 'staging',
    pod_count: 1,
    cpu_usage: {
      used: 0,
      total: 500,
      available: 500,
      usage_percent: 0.0,
      usage: 0,
      limit: 0.5
    },
    memory_usage: {
      used: 0,
      total: 1073741824, // 1GB
      available: 1073741824,
      usage_percent: 0.0,
      usage: 0,
      limit: 1073741824
    },
    last_updated: new Date().toISOString()
  }
];
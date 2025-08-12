import type { PodMetrics } from '@/types/metrics';

export const mockPods: PodMetrics[] = [
  // System pods
  {
    name: 'kube-apiserver-control-plane',
    namespace: 'kube-system',
    node: 'control-plane',
    status: 'Running',
    restart_count: 0,
    age: '7d',
    cpu_usage: {
      used: 180,
      total: 500,
      available: 320,
      usage_percent: 36.0,
      usage: 0.18,
      unit: 'm'
    },
    memory_usage: {
      used: 335544320,
      total: 1073741824,
      available: 738197504,
      usage_percent: 31.25,
      usage: 335544320,
      unit: 'bytes'
    },
    last_updated: new Date().toISOString()
  },
  {
    name: 'kube-controller-manager-control-plane',
    namespace: 'kube-system',
    node: 'control-plane',
    status: 'Running',
    restart_count: 0,
    age: '7d',
    cpu_usage: {
      used: 120,
      total: 200,
      available: 80,
      usage_percent: 60.0,
      usage: 0.12,
      unit: 'm'
    },
    memory_usage: {
      used: 134217728,
      total: 536870912,
      available: 402653184,
      usage_percent: 25.0,
      usage: 134217728,
      unit: 'bytes'
    },
    last_updated: new Date().toISOString()
  },
  {
    name: 'coredns-5d78c9869d-xm2n4',
    namespace: 'kube-system',
    node: 'worker-node-1',
    status: 'Running',
    restart_count: 0,
    age: '7d',
    cpu_usage: {
      used: 45,
      total: 100,
      available: 55,
      usage_percent: 45.0,
      usage: 0.045,
      unit: 'm'
    },
    memory_usage: {
      used: 73400320,
      total: 178257920,
      available: 104857600,
      usage_percent: 41.2,
      usage: 73400320,
      unit: 'bytes'
    },
    last_updated: new Date().toISOString()
  },
  
  // Monitoring stack
  {
    name: 'prometheus-server-5f8b9c7d6f-xm2n4',
    namespace: 'monitoring',
    node: 'worker-node-1',
    status: 'Running',
    restart_count: 1,
    age: '3d',
    cpu_usage: {
      used: 420,
      total: 1000,
      available: 580,
      usage_percent: 42.0,
      usage: 0.42,
      unit: 'm'
    },
    memory_usage: {
      used: 1258291200,
      total: 2147483648,
      available: 889192448,
      usage_percent: 58.6,
      usage: 1258291200,
      unit: 'bytes'
    },
    last_updated: new Date().toISOString()
  },
  {
    name: 'grafana-84c9d4cf6b-k8s9x',
    namespace: 'monitoring',
    node: 'worker-node-2',
    status: 'Running',
    restart_count: 0,
    age: '3d',
    cpu_usage: {
      used: 80,
      total: 200,
      available: 120,
      usage_percent: 40.0,
      usage: 0.08,
      unit: 'm'
    },
    memory_usage: {
      used: 268435456,
      total: 536870912,
      available: 268435456,
      usage_percent: 50.0,
      usage: 268435456,
      unit: 'bytes'
    },
    last_updated: new Date().toISOString()
  },

  // Application pods
  {
    name: 'nginx-deployment-7d9f8c6b5a-abc12',
    namespace: 'default',
    node: 'worker-node-1',
    status: 'Running',
    restart_count: 0,
    age: '5d',
    cpu_usage: {
      used: 25,
      total: 100,
      available: 75,
      usage_percent: 25.0,
      usage: 0.025,
      unit: 'm'
    },
    memory_usage: {
      used: 67108864,
      total: 134217728,
      available: 67108864,
      usage_percent: 50.0,
      usage: 67108864,
      unit: 'bytes'
    },
    last_updated: new Date().toISOString()
  },
  {
    name: 'nginx-deployment-7d9f8c6b5a-def34',
    namespace: 'default',
    node: 'worker-node-2',
    status: 'Running',
    restart_count: 0,
    age: '5d',
    cpu_usage: {
      used: 30,
      total: 100,
      available: 70,
      usage_percent: 30.0,
      usage: 0.03,
      unit: 'm'
    },
    memory_usage: {
      used: 75497472,
      total: 134217728,
      available: 58720256,
      usage_percent: 56.25,
      usage: 75497472,
      unit: 'bytes'
    },
    last_updated: new Date().toISOString()
  },
  {
    name: 'nginx-deployment-7d9f8c6b5a-ghi56',
    namespace: 'default',
    node: 'worker-node-1',
    status: 'Running',
    restart_count: 0,
    age: '5d',
    cpu_usage: {
      used: 28,
      total: 100,
      available: 72,
      usage_percent: 28.0,
      usage: 0.028,
      unit: 'm'
    },
    memory_usage: {
      used: 71303168,
      total: 134217728,
      available: 62914560,
      usage_percent: 53.125,
      usage: 71303168,
      unit: 'bytes'
    },
    last_updated: new Date().toISOString()
  },

  // Failed pods
  {
    name: 'failing-app-deployment-7d9f8c6b5a-k8s9x',
    namespace: 'production',
    node: 'worker-node-2',
    status: 'Failed',
    restart_count: 5,
    age: '1h',
    cpu_usage: {
      used: 0,
      total: 200,
      available: 200,
      usage_percent: 0.0,
      usage: 0,
      unit: 'm'
    },
    memory_usage: {
      used: 0,
      total: 268435456,
      available: 268435456,
      usage_percent: 0.0,
      usage: 0,
      unit: 'bytes'
    },
    last_updated: new Date().toISOString()
  },
  {
    name: 'pending-pod-xyz789',
    namespace: 'staging',
    node: 'worker-node-2',
    status: 'Pending',
    restart_count: 0,
    age: '30m',
    cpu_usage: {
      used: 0,
      total: 500,
      available: 500,
      usage_percent: 0.0,
      usage: 0,
      unit: 'm'
    },
    memory_usage: {
      used: 0,
      total: 1073741824,
      available: 1073741824,
      usage_percent: 0.0,
      usage: 0,
      unit: 'bytes'
    },
    last_updated: new Date().toISOString()
  }
];
import type { NamespaceMetrics } from '@/types/metrics';
import { MASTER_NAMESPACES, getMasterPodsByNamespace } from '@mocks/masterData';

// Generate metrics for each namespace in master data
const generateNamespaceMetrics = (): NamespaceMetrics[] => {
  return MASTER_NAMESPACES.map((namespaceName) => {
    const podCount = getMasterPodsByNamespace(namespaceName).length;
    const isSystemNamespace = namespaceName === 'kube-system';
    const isMonitoringNamespace = namespaceName === 'monitoring';
    const isProductionNamespace = namespaceName === 'production';
    
    // Resource allocation varies by namespace type and pod count
    let baseCpuAllocation: number;
    let baseMemoryAllocation: number;
    
    if (isSystemNamespace) {
      baseCpuAllocation = 2000; // Higher for system pods
      baseMemoryAllocation = 4294967296; // 4GB
    } else if (isMonitoringNamespace) {
      baseCpuAllocation = 1500;
      baseMemoryAllocation = 3221225472; // 3GB
    } else if (isProductionNamespace) {
      baseCpuAllocation = 3000;
      baseMemoryAllocation = 6442450944; // 6GB
    } else {
      baseCpuAllocation = 1000;
      baseMemoryAllocation = 2147483648; // 2GB
    }
    
    // Usage based on pod count and namespace type
    const cpuUsed = Math.floor(baseCpuAllocation * (0.1 + (podCount * 0.15)));
    const memoryUsed = Math.floor(baseMemoryAllocation * (0.1 + (podCount * 0.12)));
    const totalCpu = 10000; // Total cluster CPU allocation
    const totalMemory = 21474836480; // Total cluster memory allocation
    
    return {
      name: namespaceName,
      pod_count: podCount,
      cpu_usage: {
        usage: cpuUsed / 1000,
        used: cpuUsed,
        total: totalCpu,
        available: totalCpu - cpuUsed,
        usage_percent: (cpuUsed / totalCpu) * 100,
        unit: 'millicores'
      },
      memory_usage: {
        usage: memoryUsed,
        used: memoryUsed,
        total: totalMemory,
        available: totalMemory - memoryUsed,
        usage_percent: (memoryUsed / totalMemory) * 100,
        unit: 'bytes'
      },
      last_updated: new Date().toISOString()
    };
  });
};

export const mockNamespaces: NamespaceMetrics[] = generateNamespaceMetrics();

// Keep original static data as fallback (commented out)
/*
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
*/
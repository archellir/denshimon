import type { NodeMetrics } from '@/types/metrics';
import { MASTER_NODES, getMasterPodsByNode } from '@mocks/masterData';

// Generate metrics for each node in master data
const generateNodeMetrics = (): NodeMetrics[] => {
  return MASTER_NODES.map((nodeName) => {
    const podCount = getMasterPodsByNode(nodeName).length;
    const isControlPlane = nodeName === 'control-plane';
    const isGpuNode = nodeName.includes('gpu');
    
    // Base specs vary by node type
    let totalCpu: number;
    let totalMemory: number; 
    let totalStorage: number;
    
    if (isControlPlane) {
      totalCpu = 2000;
      totalMemory = 4294967296; // 4GB
      totalStorage = 53687091200; // 50GB
    } else if (isGpuNode) {
      totalCpu = 8000;
      totalMemory = 17179869184; // 16GB  
      totalStorage = 214748364800; // 200GB
    } else {
      totalCpu = 4000;
      totalMemory = 8589934592; // 8GB
      totalStorage = 107374182400; // 100GB
    }
    
    // Usage varies by pod load
    const cpuUsed = Math.floor(totalCpu * (0.3 + (podCount * 0.08)));
    const memoryUsed = Math.floor(totalMemory * (0.25 + (podCount * 0.05)));
    const storageUsed = Math.floor(totalStorage * (0.2 + (podCount * 0.04)));
    
    return {
      name: nodeName,
      status: 'Ready',
      version: 'v1.28.2',
      os: 'Ubuntu 22.04.3 LTS',
      architecture: 'amd64',
      age: '7d',
      pod_count: podCount,
      cpu_usage: {
        used: cpuUsed,
        total: totalCpu,
        available: totalCpu - cpuUsed,
        usage_percent: (cpuUsed / totalCpu) * 100,
        usage: cpuUsed / 1000,
        unit: 'm'
      },
      memory_usage: {
        used: memoryUsed,
        total: totalMemory,
        available: totalMemory - memoryUsed,
        usage_percent: (memoryUsed / totalMemory) * 100,
        usage: memoryUsed,
        unit: 'bytes'
      },
      storage_usage: {
        used: storageUsed,
        total: totalStorage,
        available: totalStorage - storageUsed,
        usage_percent: (storageUsed / totalStorage) * 100,
        usage: storageUsed,
        unit: 'bytes'
      },
      last_updated: new Date().toISOString()
    };
  });
};

export const mockNodes: NodeMetrics[] = generateNodeMetrics();

// Keep original static data as fallback (commented out)
/*
export const mockNodes: NodeMetrics[] = [
  {
    name: 'worker-node-1',
    status: 'Ready',
    version: 'v1.28.2',
    os: 'Ubuntu 22.04.3 LTS',
    architecture: 'amd64',
    age: '7d',
    pod_count: 12,
    cpu_usage: {
      used: 2100,
      total: 4000,
      available: 1900,
      usage_percent: 52.5,
      usage: 2.1,
      unit: 'm'
    },
    memory_usage: {
      used: 3435973836,
      total: 8589934592,
      available: 5153960756,
      usage_percent: 40.0,
      usage: 3435973836,
      unit: 'bytes'
    },
    storage_usage: {
      used: 48318382080,
      total: 107374182400,
      available: 59055800320,
      usage_percent: 45.0,
      usage: 48318382080,
      unit: 'bytes'
    },
    last_updated: new Date().toISOString()
  },
  {
    name: 'worker-node-2',
    status: 'Ready',
    version: 'v1.28.2',
    os: 'Ubuntu 22.04.3 LTS',
    architecture: 'amd64',
    age: '7d',
    pod_count: 8,
    cpu_usage: {
      used: 1800,
      total: 4000,
      available: 2200,
      usage_percent: 45.0,
      usage: 1.8,
      unit: 'm'
    },
    memory_usage: {
      used: 3113851289,
      total: 8589934592,
      available: 5476083303,
      usage_percent: 36.2,
      usage: 3113851289,
      unit: 'bytes'
    },
    storage_usage: {
      used: 55834574848,
      total: 107374182400,
      available: 51539607552,
      usage_percent: 52.0,
      usage: 55834574848,
      unit: 'bytes'
    },
    last_updated: new Date().toISOString()
  },
  {
    name: 'control-plane',
    status: 'Ready',
    version: 'v1.28.2',
    os: 'Ubuntu 22.04.3 LTS',
    architecture: 'amd64',
    age: '7d',
    pod_count: 6,
    cpu_usage: {
      used: 800,
      total: 2000,
      available: 1200,
      usage_percent: 40.0,
      usage: 0.8,
      unit: 'm'
    },
    memory_usage: {
      used: 1610612736,
      total: 4294967296,
      available: 2684354560,
      usage_percent: 37.5,
      usage: 1610612736,
      unit: 'bytes'
    },
    storage_usage: {
      used: 16106127360,
      total: 53687091200,
      available: 37580963840,
      usage_percent: 30.0,
      usage: 16106127360,
      unit: 'bytes'
    },
    last_updated: new Date().toISOString()
  }
];
*/
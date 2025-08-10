import { useMemo } from 'react';
import type { FC } from 'react';
import { HardDrive, Database, Cpu, MemoryStick } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import useMetricsStore from '@stores/metricsStore';

const NamespaceMetrics: FC = () => {
  const { namespaceMetrics, isLoading } = useMetricsStore();

  const sortedNamespaces = useMemo(() => {
    return [...namespaceMetrics].sort((a, b) => {
      // Sort by pod count (descending), then by name
      if (b.pod_count !== a.pod_count) {
        return b.pod_count - a.pod_count;
      }
      return a.name.localeCompare(b.name);
    });
  }, [namespaceMetrics]);

  const totalStats = useMemo(() => {
    return namespaceMetrics.reduce(
      (acc, ns) => ({
        totalPods: acc.totalPods + ns.pod_count,
        totalCpuUsage: acc.totalCpuUsage + ns.cpu_usage.usage,
        totalMemoryUsage: acc.totalMemoryUsage + ns.memory_usage.usage,
      }),
      { totalPods: 0, totalCpuUsage: 0, totalMemoryUsage: 0 }
    );
  }, [namespaceMetrics]);

  const formatBytes = (bytes: number): string => {
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(1)} ${units[unitIndex]}`;
  };

  const getNamespaceType = (name: string) => {
    if (['kube-system', 'kube-public', 'kube-node-lease'].includes(name)) {
      return { type: 'SYSTEM', color: 'text-red-400 border-red-400' };
    }
    if (name === 'default') {
      return { type: 'DEFAULT', color: 'text-blue-400 border-blue-400' };
    }
    return { type: 'USER', color: 'text-green-400 border-green-400' };
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-green-400 font-mono">LOADING NAMESPACES...</div>
      </div>
    );
  }

  if (sortedNamespaces.length === 0) {
    return (
      <div className="text-center py-12">
        <HardDrive size={48} className="mx-auto mb-4 opacity-40" />
        <h3 className="text-lg font-mono mb-2">NO NAMESPACES FOUND</h3>
        <p className="font-mono text-sm opacity-60">
          No Kubernetes namespaces are available.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-mono">NAMESPACE METRICS</h2>
        <div className="text-sm font-mono opacity-60">
          {sortedNamespaces.length} NAMESPACE{sortedNamespaces.length !== 1 ? 'S' : ''}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="border border-white p-4">
          <div className="text-2xl font-mono">{sortedNamespaces.length}</div>
          <div className="text-xs font-mono opacity-60">TOTAL NAMESPACES</div>
        </div>
        <div className="border border-white p-4">
          <div className="text-2xl font-mono text-blue-400">{totalStats.totalPods}</div>
          <div className="text-xs font-mono opacity-60">TOTAL PODS</div>
        </div>
        <div className="border border-white p-4">
          <div className="text-2xl font-mono text-green-400">
            {totalStats.totalCpuUsage.toFixed(1)}
          </div>
          <div className="text-xs font-mono opacity-60">CPU CORES</div>
        </div>
        <div className="border border-white p-4">
          <div className="text-2xl font-mono text-yellow-400">
            {formatBytes(totalStats.totalMemoryUsage)}
          </div>
          <div className="text-xs font-mono opacity-60">MEMORY</div>
        </div>
      </div>

      {/* Namespace List */}
      <div className="space-y-4">
        {sortedNamespaces.map((namespace) => {
          const nsType = getNamespaceType(namespace.name);
          return (
            <div key={namespace.name} className="border border-white bg-black">
              {/* Header */}
              <div className="p-4 border-b border-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <HardDrive size={20} />
                    <div>
                      <h3 className="font-mono text-lg">{namespace.name}</h3>
                      <div className={`inline-block px-2 py-1 border ${nsType.color} font-mono text-xs mt-1`}>
                        {nsType.type}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="font-mono text-sm opacity-60">PODS</div>
                    <div className="font-mono text-2xl text-blue-400">{namespace.pod_count}</div>
                  </div>
                </div>
              </div>

              {/* Resource Usage */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
                {/* CPU */}
                <div className="p-4 border-b md:border-b-0 md:border-r border-white">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <Cpu size={16} />
                      <span className="font-mono text-sm">CPU USAGE</span>
                    </div>
                    <span className="font-mono text-sm text-green-400">
                      {namespace.cpu_usage.usage_percent.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-800 border border-white h-2">
                    <div 
                      className="h-full bg-green-400"
                      style={{ width: `${Math.min(namespace.cpu_usage.usage_percent, 100)}%` }}
                    />
                  </div>
                  <div className="mt-2 text-xs font-mono opacity-60">
                    {namespace.cpu_usage.usage.toFixed(2)} / {namespace.cpu_usage.total.toFixed(2)} cores
                  </div>
                </div>

                {/* Memory */}
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <MemoryStick size={16} />
                      <span className="font-mono text-sm">MEMORY USAGE</span>
                    </div>
                    <span className="font-mono text-sm text-yellow-400">
                      {namespace.memory_usage.usage_percent.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-800 border border-white h-2">
                    <div 
                      className="h-full bg-yellow-400"
                      style={{ width: `${Math.min(namespace.memory_usage.usage_percent, 100)}%` }}
                    />
                  </div>
                  <div className="mt-2 text-xs font-mono opacity-60">
                    {formatBytes(namespace.memory_usage.usage)} / {formatBytes(namespace.memory_usage.total)}
                  </div>
                </div>
              </div>

              {/* Resource Breakdown */}
              <div className="p-4 border-t border-white bg-gray-900/20">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
                  <div className="flex items-center space-x-2">
                    <Database size={12} />
                    <span className="opacity-60">PODS:</span>
                    <span className="text-blue-400">{namespace.pod_count}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Cpu size={12} />
                    <span className="opacity-60">CPU:</span>
                    <span className="text-green-400">{namespace.cpu_usage.usage.toFixed(2)} cores</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <MemoryStick size={12} />
                    <span className="opacity-60">MEMORY:</span>
                    <span className="text-yellow-400">{formatBytes(namespace.memory_usage.usage)}</span>
                  </div>
                </div>
                <div className="mt-2 text-right text-xs font-mono opacity-60">
                  LAST UPDATED: {formatDistanceToNow(new Date(namespace.last_updated), { addSuffix: true }).toUpperCase()}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default NamespaceMetrics;
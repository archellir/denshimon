import { useMemo } from 'react';
import type { FC } from 'react';
import { Server, Cpu, MemoryStick, HardDrive, CheckCircle, AlertCircle } from 'lucide-react';
import useWebSocketMetricsStore from '@stores/webSocketMetricsStore';

const NodeList: FC = () => {
  const { nodeMetrics, isLoading } = useWebSocketMetricsStore();

  const sortedNodes = useMemo(() => {
    return [...nodeMetrics].sort((a, b) => a.name.localeCompare(b.name));
  }, [nodeMetrics]);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'ready':
        return 'text-green-400 border-green-400';
      case 'notready':
        return 'text-red-400 border-red-400';
      default:
        return 'text-yellow-400 border-yellow-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'ready':
        return <CheckCircle size={16} className="text-green-400" />;
      default:
        return <AlertCircle size={16} className="text-red-400" />;
    }
  };

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-green-400 font-mono">LOADING NODES...</div>
      </div>
    );
  }

  if (sortedNodes.length === 0) {
    return (
      <div className="text-center py-12">
        <Server size={48} className="mx-auto mb-4 opacity-40" />
        <h3 className="text-lg font-mono mb-2">NO NODES FOUND</h3>
        <p className="font-mono text-sm opacity-60">
          No Kubernetes nodes are available.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        <div className="text-sm font-mono opacity-60">
          {sortedNodes.length} NODE{sortedNodes.length !== 1 ? 'S' : ''}
        </div>
      </div>

      <div className="grid gap-4">
        {sortedNodes.map((node) => (
          <div key={node.name} className="border border-white bg-black">
            {/* Header */}
            <div className="p-4 border-b border-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Server size={20} />
                  <div>
                    <h3 className="font-mono text-lg">{node.name}</h3>
                    <div className="flex items-center space-x-2 mt-1">
                      {getStatusIcon(node.status)}
                      <span className={`font-mono text-sm ${getStatusColor(node.status)}`}>
                        {node.status.toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="font-mono text-sm opacity-60">PODS</div>
                  <div className="font-mono text-lg">{node.pod_count}</div>
                </div>
              </div>
            </div>

            {/* Resource Usage */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-0">
              {/* CPU */}
              <div className="p-4 border-b md:border-b-0 md:border-r border-white">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <Cpu size={16} />
                    <span className="font-mono text-sm">CPU</span>
                  </div>
                  <span className="font-mono text-sm text-green-400">
                    {node.cpu_usage.usage_percent.toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-gray-800 border border-white h-2">
                  <div 
                    className="h-full bg-green-400"
                    style={{ width: `${Math.min(node.cpu_usage.usage_percent, 100)}%` }}
                  />
                </div>
                <div className="mt-2 text-xs font-mono opacity-60">
                  {(node.cpu_usage.used / 1000).toFixed(2)} / {(node.cpu_usage.total / 1000).toFixed(2)} cores
                </div>
              </div>

              {/* Memory */}
              <div className="p-4 border-b md:border-b-0 lg:border-r border-white">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <MemoryStick size={16} />
                    <span className="font-mono text-sm">MEMORY</span>
                  </div>
                  <span className="font-mono text-sm text-yellow-400">
                    {node.memory_usage.usage_percent.toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-gray-800 border border-white h-2">
                  <div 
                    className="h-full bg-yellow-400"
                    style={{ width: `${Math.min(node.memory_usage.usage_percent, 100)}%` }}
                  />
                </div>
                <div className="mt-2 text-xs font-mono opacity-60">
                  {formatBytes(node.memory_usage.used)} / {formatBytes(node.memory_usage.total)}
                </div>
              </div>

              {/* Storage */}
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <HardDrive size={16} />
                    <span className="font-mono text-sm">STORAGE</span>
                  </div>
                  <span className="font-mono text-sm text-red-400">
                    {node.storage_usage.usage_percent.toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-gray-800 border border-white h-2">
                  <div 
                    className="h-full bg-red-400"
                    style={{ width: `${Math.min(node.storage_usage.usage_percent, 100)}%` }}
                  />
                </div>
                <div className="mt-2 text-xs font-mono opacity-60">
                  {formatBytes(node.storage_usage.used)} / {formatBytes(node.storage_usage.total)}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-white bg-gray-900/20">
              <div className="flex justify-between items-center text-xs font-mono opacity-60">
                <span>VERSION: {node.version}</span>
                <span>OS: {node.os}</span>
                <span>AGE: {node.age}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default NodeList;
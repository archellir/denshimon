import { useState, useMemo } from 'react';
import type { FC } from 'react';
import { Database, Cpu, MemoryStick, CheckCircle, AlertCircle, Clock, RefreshCw } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import useMetricsStore from '../../stores/metricsStore';

const PodMetrics: FC = () => {
  const [selectedNamespace, setSelectedNamespace] = useState<string>('all');
  const { podMetrics, isLoading, fetchPodMetrics } = useMetricsStore();

  const filteredPods = useMemo(() => {
    let pods = [...podMetrics];
    
    if (selectedNamespace !== 'all') {
      pods = pods.filter(pod => pod.namespace === selectedNamespace);
    }
    
    return pods.sort((a, b) => a.name.localeCompare(b.name));
  }, [podMetrics, selectedNamespace]);

  const namespaces = useMemo(() => {
    const uniqueNamespaces = [...new Set(podMetrics.map(pod => pod.namespace))];
    return uniqueNamespaces.sort();
  }, [podMetrics]);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'running':
        return 'text-green-400 border-green-400';
      case 'pending':
        return 'text-yellow-400 border-yellow-400';
      case 'failed':
      case 'error':
        return 'text-red-400 border-red-400';
      default:
        return 'text-gray-400 border-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'running':
        return <CheckCircle size={16} className="text-green-400" />;
      case 'pending':
        return <Clock size={16} className="text-yellow-400" />;
      case 'failed':
      case 'error':
        return <AlertCircle size={16} className="text-red-400" />;
      default:
        return <RefreshCw size={16} className="text-gray-400" />;
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

  const handleRefresh = () => {
    if (selectedNamespace === 'all') {
      fetchPodMetrics();
    } else {
      fetchPodMetrics(selectedNamespace);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-green-400 font-mono">LOADING PODS...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Filters */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-mono">POD METRICS</h2>
        <div className="flex items-center space-x-4">
          <select
            value={selectedNamespace}
            onChange={(e) => setSelectedNamespace(e.target.value)}
            className="bg-black border border-white text-white font-mono px-3 py-2 focus:outline-none focus:border-green-400"
          >
            <option value="all">ALL NAMESPACES</option>
            {namespaces.map((ns) => (
              <option key={ns} value={ns}>
                {ns.toUpperCase()}
              </option>
            ))}
          </select>
          <button
            onClick={handleRefresh}
            className="p-2 border border-white hover:bg-white hover:text-black transition-colors"
            title="Refresh Pods"
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="border border-white p-4">
          <div className="text-2xl font-mono">{filteredPods.length}</div>
          <div className="text-xs font-mono opacity-60">TOTAL PODS</div>
        </div>
        <div className="border border-white p-4">
          <div className="text-2xl font-mono text-green-400">
            {filteredPods.filter(p => p.status.toLowerCase() === 'running').length}
          </div>
          <div className="text-xs font-mono opacity-60">RUNNING</div>
        </div>
        <div className="border border-white p-4">
          <div className="text-2xl font-mono text-yellow-400">
            {filteredPods.filter(p => p.status.toLowerCase() === 'pending').length}
          </div>
          <div className="text-xs font-mono opacity-60">PENDING</div>
        </div>
        <div className="border border-white p-4">
          <div className="text-2xl font-mono text-red-400">
            {filteredPods.filter(p => ['failed', 'error'].includes(p.status.toLowerCase())).length}
          </div>
          <div className="text-xs font-mono opacity-60">FAILED</div>
        </div>
      </div>

      {/* Pod List */}
      {filteredPods.length === 0 ? (
        <div className="text-center py-12">
          <Database size={48} className="mx-auto mb-4 opacity-40" />
          <h3 className="text-lg font-mono mb-2">NO PODS FOUND</h3>
          <p className="font-mono text-sm opacity-60">
            {selectedNamespace === 'all' 
              ? 'No pods are available in the cluster.'
              : `No pods found in namespace "${selectedNamespace}".`
            }
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredPods.map((pod) => (
            <div key={`${pod.namespace}/${pod.name}`} className="border border-white bg-black">
              {/* Header */}
              <div className="p-4 border-b border-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Database size={20} />
                    <div>
                      <h3 className="font-mono text-lg">{pod.name}</h3>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="font-mono text-sm opacity-60">
                          {pod.namespace} • {pod.node}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <div className="font-mono text-sm opacity-60">RESTARTS</div>
                      <div className="font-mono text-lg">{pod.restart_count}</div>
                    </div>
                    <div className={`px-2 py-1 border ${getStatusColor(pod.status)} font-mono text-xs`}>
                      <div className="flex items-center space-x-1">
                        {getStatusIcon(pod.status)}
                        <span>{pod.status.toUpperCase()}</span>
                      </div>
                    </div>
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
                      <span className="font-mono text-sm">CPU</span>
                    </div>
                    <span className="font-mono text-sm text-green-400">
                      {pod.cpu_usage.usage_percent.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-800 border border-white h-2">
                    <div 
                      className="h-full bg-green-400"
                      style={{ width: `${Math.min(pod.cpu_usage.usage_percent, 100)}%` }}
                    />
                  </div>
                  <div className="mt-2 text-xs font-mono opacity-60">
                    {pod.cpu_usage.usage.toFixed(3)} / {pod.cpu_usage.total.toFixed(3)} cores
                  </div>
                </div>

                {/* Memory */}
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <MemoryStick size={16} />
                      <span className="font-mono text-sm">MEMORY</span>
                    </div>
                    <span className="font-mono text-sm text-yellow-400">
                      {pod.memory_usage.usage_percent.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-800 border border-white h-2">
                    <div 
                      className="h-full bg-yellow-400"
                      style={{ width: `${Math.min(pod.memory_usage.usage_percent, 100)}%` }}
                    />
                  </div>
                  <div className="mt-2 text-xs font-mono opacity-60">
                    {formatBytes(pod.memory_usage.usage)} / {formatBytes(pod.memory_usage.total)}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-white bg-gray-900/20">
                <div className="flex justify-between items-center text-xs font-mono opacity-60">
                  <span>AGE: {pod.age.toUpperCase()}</span>
                  <span>LAST UPDATED: {formatDistanceToNow(new Date(pod.last_updated), { addSuffix: true }).toUpperCase()}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PodMetrics;
import type { FC } from 'react';
import { useState, useEffect } from 'react';
import { Server, Activity, HardDrive, Network } from 'lucide-react';
import HealthSummaryCard, { 
  createClusterHealthCard, 
  createApplicationHealthCard,
  createNetworkHealthCard,
  createStorageHealthCard
} from '@components/common/HealthSummaryCard';
import SkeletonLoader from '@components/common/SkeletonLoader';

// Generate mock health data
const generateHealthData = () => {
  const randomTrend = (): 'up' | 'down' | 'stable' => {
    const rand = Math.random();
    return rand < 0.33 ? 'up' : rand < 0.66 ? 'down' : 'stable';
  };

  const randomTrendValue = () => Math.floor((Math.random() - 0.5) * 20);

  return {
    cluster: {
      readyNodes: 1, // Single node
      totalNodes: 1,
      runningPods: Math.floor(Math.random() * 5) + 15, // 15-20 pods
      totalPods: 20,
      cpuUsage: 45 + Math.random() * 40,
      cpuTrend: randomTrend(),
      cpuTrendValue: randomTrendValue(),
      memoryUsage: 50 + Math.random() * 35,
      memoryTrend: randomTrend(),
      memoryTrendValue: randomTrendValue(),
    },
    application: {
      requestRate: 1000 + Math.random() * 500,
      requestTrend: randomTrend(),
      errorRate: Math.random() * 3,
      errorTrend: randomTrend(),
      p95Latency: 50 + Math.random() * 150,
      latencyTrend: randomTrend(),
      availability: 99 + Math.random() * 0.95,
    },
    network: {
      ingressRate: 10 + Math.random() * 50,
      ingressTrend: randomTrend(),
      egressRate: 8 + Math.random() * 40,
      egressTrend: randomTrend(),
      connectionErrors: Math.floor(Math.random() * 15),
      activeConnections: Math.floor(Math.random() * 500) + 100,
    },
    storage: {
      volumeUsage: 40 + Math.random() * 45,
      volumeTrend: randomTrend(),
      boundPVCs: Math.floor(Math.random() * 3) + 12,
      totalPVCs: 15,
      iops: Math.floor(Math.random() * 5000) + 1000,
      iopsTrend: randomTrend(),
      throughput: 50 + Math.random() * 100,
    },
  };
};

interface HealthDashboardProps {
  compact?: boolean;
  showAll?: boolean;
}

const HealthDashboard: FC<HealthDashboardProps> = ({ 
  compact = false,
  showAll = true 
}) => {
  const [healthData, setHealthData] = useState(generateHealthData());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate initial data load
    setTimeout(() => {
      setIsLoading(false);
    }, 500);

    // Update health data every 5 seconds
    const interval = setInterval(() => {
      setHealthData(generateHealthData());
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <SkeletonLoader variant="card" count={4} />
      </div>
    );
  }

  const clusterCard = createClusterHealthCard(healthData.cluster);
  const applicationCard = createApplicationHealthCard(healthData.application);
  const networkCard = createNetworkHealthCard(healthData.network);
  const storageCard = createStorageHealthCard(healthData.storage);

  if (compact) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <HealthSummaryCard
          {...clusterCard}
          icon={Server}
          compact
        />
        <HealthSummaryCard
          {...applicationCard}
          icon={Activity}
          compact
        />
        <HealthSummaryCard
          {...networkCard}
          icon={Network}
          compact
        />
        <HealthSummaryCard
          {...storageCard}
          icon={HardDrive}
          compact
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Critical Alerts Banner */}
      {(healthData.cluster.cpuUsage > 85 || healthData.cluster.memoryUsage > 85 || healthData.application.errorRate > 5) && (
        <div className="border border-red-500 bg-red-500/10 p-4">
          <h3 className="font-mono text-sm font-bold text-red-500 mb-2">CRITICAL ALERTS</h3>
          <div className="space-y-1">
            {healthData.cluster.cpuUsage > 85 && (
              <div className="text-xs font-mono text-red-400">
                • CPU usage critical: {healthData.cluster.cpuUsage.toFixed(1)}%
              </div>
            )}
            {healthData.cluster.memoryUsage > 85 && (
              <div className="text-xs font-mono text-red-400">
                • Memory usage critical: {healthData.cluster.memoryUsage.toFixed(1)}%
              </div>
            )}
            {healthData.application.errorRate > 5 && (
              <div className="text-xs font-mono text-red-400">
                • Application error rate high: {healthData.application.errorRate.toFixed(2)}%
              </div>
            )}
          </div>
        </div>
      )}

      {/* Health Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <HealthSummaryCard
          {...clusterCard}
          icon={Server}
        />
        <HealthSummaryCard
          {...applicationCard}
          icon={Activity}
        />
        {showAll && (
          <>
            <HealthSummaryCard
              {...networkCard}
              icon={Network}
            />
            <HealthSummaryCard
              {...storageCard}
              icon={HardDrive}
            />
          </>
        )}
      </div>

      {/* Summary Statistics */}
      <div className="border border-white/20 p-4">
        <h3 className="font-mono text-sm font-bold mb-3">HEALTH SUMMARY</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-mono font-bold text-green-500">
              {Math.floor((healthData.cluster.runningPods / healthData.cluster.totalPods) * 100)}%
            </div>
            <div className="text-xs font-mono text-gray-500">POD HEALTH</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-mono font-bold text-yellow-500">
              {healthData.application.availability.toFixed(1)}%
            </div>
            <div className="text-xs font-mono text-gray-500">AVAILABILITY</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-mono font-bold text-blue-500">
              {healthData.application.requestRate.toFixed(0)}
            </div>
            <div className="text-xs font-mono text-gray-500">REQ/SEC</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-mono font-bold text-purple-500">
              {healthData.storage.volumeUsage.toFixed(0)}%
            </div>
            <div className="text-xs font-mono text-gray-500">STORAGE</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HealthDashboard;
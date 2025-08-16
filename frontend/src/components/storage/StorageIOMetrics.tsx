import React, { useState, useEffect } from 'react';
import { TimeRange } from '@constants';
import { getDataPointsForTimeRange } from '@utils/time';
import { HardDrive, Database, Activity, Zap } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import SkeletonLoader from '@components/common/SkeletonLoader';

interface VolumeMetrics {
  name: string;
  namespace: string;
  type: 'ssd' | 'hdd' | 'nvme';
  capacity: number; // GB
  used: number; // GB
  available: number; // GB
  iops: {
    read: number;
    write: number;
  };
  throughput: {
    read: number; // MB/s
    write: number; // MB/s
  };
  latency: {
    read: number; // ms
    write: number; // ms
  };
  status: 'healthy' | 'degraded' | 'critical';
}

interface StorageClass {
  name: string;
  provisioner: string;
  volumeCount: number;
  totalCapacity: number;
  usedCapacity: number;
  reclaimPolicy: 'Delete' | 'Retain' | 'Recycle';
}

interface StorageIOMetricsProps {
  timeRange?: string;
}

const StorageIOMetrics: React.FC<StorageIOMetricsProps> = ({ timeRange = TimeRange.ONE_HOUR }) => {
  const [selectedVolume, setSelectedVolume] = useState<string | null>(null);
  const [ioHistory, setIoHistory] = useState<any[]>([]);
  const [volumes, setVolumes] = useState<VolumeMetrics[]>([]);
  const [storageClasses, setStorageClasses] = useState<StorageClass[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Generate mock data
  useEffect(() => {
    // Generate volumes
    const mockVolumes: VolumeMetrics[] = [
      {
        name: 'pvc-database-primary',
        namespace: 'production',
        type: 'ssd',
        capacity: 500,
        used: 342,
        available: 158,
        iops: { read: 2500, write: 1800 },
        throughput: { read: 125, write: 95 },
        latency: { read: 0.5, write: 0.8 },
        status: 'healthy'
      },
      {
        name: 'pvc-cache-redis',
        namespace: 'production',
        type: 'nvme',
        capacity: 100,
        used: 45,
        available: 55,
        iops: { read: 8500, write: 6200 },
        throughput: { read: 450, write: 380 },
        latency: { read: 0.2, write: 0.3 },
        status: 'healthy'
      },
      {
        name: 'pvc-logs-elasticsearch',
        namespace: 'monitoring',
        type: 'hdd',
        capacity: 2000,
        used: 1650,
        available: 350,
        iops: { read: 150, write: 100 },
        throughput: { read: 80, write: 60 },
        latency: { read: 5, write: 8 },
        status: 'degraded'
      },
      {
        name: 'pvc-backup-storage',
        namespace: 'backup',
        type: 'hdd',
        capacity: 5000,
        used: 4200,
        available: 800,
        iops: { read: 100, write: 80 },
        throughput: { read: 50, write: 40 },
        latency: { read: 10, write: 15 },
        status: 'critical'
      },
      {
        name: 'pvc-media-assets',
        namespace: 'frontend',
        type: 'ssd',
        capacity: 250,
        used: 180,
        available: 70,
        iops: { read: 1500, write: 800 },
        throughput: { read: 200, write: 150 },
        latency: { read: 1, write: 1.5 },
        status: 'healthy'
      }
    ];

    // Generate storage classes
    const mockStorageClasses: StorageClass[] = [
      {
        name: 'fast-ssd',
        provisioner: 'kubernetes.io/aws-ebs',
        volumeCount: 12,
        totalCapacity: 1500,
        usedCapacity: 890,
        reclaimPolicy: 'Delete'
      },
      {
        name: 'standard',
        provisioner: 'kubernetes.io/aws-ebs',
        volumeCount: 25,
        totalCapacity: 8000,
        usedCapacity: 5850,
        reclaimPolicy: 'Delete'
      },
      {
        name: 'ultra-fast-nvme',
        provisioner: 'kubernetes.io/aws-ebs',
        volumeCount: 3,
        totalCapacity: 300,
        usedCapacity: 145,
        reclaimPolicy: 'Retain'
      }
    ];

    // Generate IO history
    interface HistoryDataPoint {
      time: number;
      readIOPS: number;
      writeIOPS: number;
      readThroughput: number;
      writeThroughput: number;
      readLatency: number;
      writeLatency: number;
    }
    
    const history: HistoryDataPoint[] = [];
    const points = getDataPointsForTimeRange(timeRange, 5);
    
    for (let i = 0; i < points; i++) {
      history.push({
        time: i,
        readIOPS: 3000 + Math.random() * 2000 - 1000,
        writeIOPS: 2000 + Math.random() * 1500 - 750,
        readThroughput: 150 + Math.random() * 100 - 50,
        writeThroughput: 100 + Math.random() * 80 - 40,
        readLatency: 0.5 + Math.random() * 0.5,
        writeLatency: 0.8 + Math.random() * 0.7
      });
    }

    // Simulate loading delay
    setTimeout(() => {
      setVolumes(mockVolumes);
      setStorageClasses(mockStorageClasses);
      setIoHistory(history);
      setIsLoading(false);
    }, 500);
  }, [timeRange]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-500 border-green-500';
      case 'degraded': return 'text-yellow-500 border-yellow-500';
      case 'critical': return 'text-red-500 border-red-500';
      default: return 'text-gray-500 border-gray-500';
    }
  };

  const getDriveTypeIcon = (type: string) => {
    switch (type) {
      case 'nvme': return '⚡';
      case 'ssd': return '💾';
      case 'hdd': return '💿';
      default: return '📦';
    }
  };

  const selectedVolumeData = selectedVolume ? volumes.find(v => v.name === selectedVolume) : null;

  // Calculate totals
  const totalCapacity = volumes.reduce((sum, v) => sum + v.capacity, 0);
  const totalUsed = volumes.reduce((sum, v) => sum + v.used, 0);
  const totalIOPS = volumes.reduce((sum, v) => sum + v.iops.read + v.iops.write, 0);
  const avgLatency = volumes.reduce((sum, v) => sum + (v.latency.read + v.latency.write) / 2, 0) / volumes.length;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SkeletonLoader variant="chart" count={2} />
        </div>
        <SkeletonLoader variant="table" count={6} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="border border-white p-4">
          <div className="flex items-center justify-between mb-2">
            <HardDrive size={20} />
            <span className="text-xs font-mono text-gray-500">STORAGE</span>
          </div>
          <div className="text-2xl font-mono font-bold">{totalUsed}GB</div>
          <div className="text-xs text-gray-500">of {totalCapacity}GB used</div>
          <div className="w-full bg-gray-800 h-1 mt-2">
            <div 
              className="h-full bg-white transition-all"
              style={{ width: `${(totalUsed / totalCapacity) * 100}%` }}
            />
          </div>
        </div>

        <div className="border border-white p-4">
          <div className="flex items-center justify-between mb-2">
            <Activity size={20} />
            <span className="text-xs font-mono text-gray-500">TOTAL IOPS</span>
          </div>
          <div className="text-2xl font-mono font-bold">{totalIOPS.toFixed(0)}</div>
          <div className="text-xs text-gray-500">operations/sec</div>
        </div>

        <div className="border border-white p-4">
          <div className="flex items-center justify-between mb-2">
            <Zap size={20} />
            <span className="text-xs font-mono text-gray-500">AVG LATENCY</span>
          </div>
          <div className="text-2xl font-mono font-bold">{avgLatency.toFixed(1)}ms</div>
          <div className="text-xs text-gray-500">read/write avg</div>
        </div>

        <div className="border border-white p-4">
          <div className="flex items-center justify-between mb-2">
            <Database size={20} />
            <span className="text-xs font-mono text-gray-500">VOLUMES</span>
          </div>
          <div className="text-2xl font-mono font-bold">{volumes.length}</div>
          <div className="text-xs text-gray-500">active volumes</div>
        </div>
      </div>


      {/* IO Performance Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* IOPS Chart */}
        <div className="border border-white p-4">
          <h3 className="font-mono text-sm mb-4">IOPS OVER TIME</h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={ioHistory}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="time" stroke="#666" />
              <YAxis stroke="#666" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#000', border: '1px solid #fff' }}
                labelStyle={{ color: '#fff' }}
              />
              <Area 
                type="monotone" 
                dataKey="readIOPS" 
                stackId="1"
                stroke="#00ff00" 
                fill="#00ff00" 
                fillOpacity={0.3}
                name="Read"
              />
              <Area 
                type="monotone" 
                dataKey="writeIOPS" 
                stackId="1"
                stroke="#ff00ff" 
                fill="#ff00ff" 
                fillOpacity={0.3}
                name="Write"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Throughput Chart */}
        <div className="border border-white p-4">
          <h3 className="font-mono text-sm mb-4">THROUGHPUT (MB/s)</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={ioHistory}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="time" stroke="#666" />
              <YAxis stroke="#666" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#000', border: '1px solid #fff' }}
                labelStyle={{ color: '#fff' }}
              />
              <Line 
                type="monotone" 
                dataKey="readThroughput" 
                stroke="#00ff00" 
                strokeWidth={2}
                dot={false}
                name="Read"
              />
              <Line 
                type="monotone" 
                dataKey="writeThroughput" 
                stroke="#ff00ff" 
                strokeWidth={2}
                dot={false}
                name="Write"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Volumes Table */}
      <div className="border border-white">
        <div className="border-b border-white px-4 py-2">
          <h3 className="font-mono text-sm font-bold">PERSISTENT VOLUMES</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full font-mono text-sm">
            <thead>
              <tr className="border-b border-white/20">
                <th className="text-left p-3">NAME</th>
                <th className="text-left p-3">TYPE</th>
                <th className="text-right p-3">CAPACITY</th>
                <th className="text-right p-3">USED</th>
                <th className="text-right p-3">IOPS</th>
                <th className="text-right p-3">THROUGHPUT</th>
                <th className="text-right p-3">LATENCY</th>
                <th className="text-center p-3">STATUS</th>
              </tr>
            </thead>
            <tbody>
              {volumes.map(volume => (
                <tr 
                  key={volume.name}
                  onClick={() => setSelectedVolume(volume.name === selectedVolume ? null : volume.name)}
                  className={`border-b border-white/10 hover:bg-white/5 cursor-pointer ${
                    selectedVolume === volume.name ? 'bg-white/10' : ''
                  }`}
                >
                  <td className="p-3">
                    <div>
                      <div className="font-bold">{volume.name}</div>
                      <div className="text-xs text-gray-500">{volume.namespace}</div>
                    </div>
                  </td>
                  <td className="p-3">
                    <span className="inline-flex items-center space-x-1">
                      <span>{getDriveTypeIcon(volume.type)}</span>
                      <span>{volume.type.toUpperCase()}</span>
                    </span>
                  </td>
                  <td className="p-3 text-right">{volume.capacity}GB</td>
                  <td className="p-3 text-right">
                    <div>
                      <div>{volume.used}GB</div>
                      <div className="text-xs text-gray-500">
                        {((volume.used / volume.capacity) * 100).toFixed(0)}%
                      </div>
                    </div>
                  </td>
                  <td className="p-3 text-right">
                    <div className="text-xs">
                      <div>R: {volume.iops.read}</div>
                      <div>W: {volume.iops.write}</div>
                    </div>
                  </td>
                  <td className="p-3 text-right">
                    <div className="text-xs">
                      <div>R: {volume.throughput.read}MB/s</div>
                      <div>W: {volume.throughput.write}MB/s</div>
                    </div>
                  </td>
                  <td className="p-3 text-right">
                    <div className="text-xs">
                      <div>R: {volume.latency.read}ms</div>
                      <div>W: {volume.latency.write}ms</div>
                    </div>
                  </td>
                  <td className="p-3 text-center">
                    <span className={`px-2 py-1 text-xs ${getStatusColor(volume.status)}`}>
                      {volume.status.toUpperCase()}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Selected Volume Details */}
      {selectedVolumeData && (
        <div className="border border-white p-4">
          <h3 className="font-mono text-sm font-bold mb-4">
            VOLUME DETAILS: {selectedVolumeData.name}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <h4 className="text-xs font-mono text-gray-500 mb-2">PERFORMANCE METRICS</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Read IOPS:</span>
                  <span className="font-bold">{selectedVolumeData.iops.read}</span>
                </div>
                <div className="flex justify-between">
                  <span>Write IOPS:</span>
                  <span className="font-bold">{selectedVolumeData.iops.write}</span>
                </div>
                <div className="flex justify-between">
                  <span>Read Throughput:</span>
                  <span className="font-bold">{selectedVolumeData.throughput.read} MB/s</span>
                </div>
                <div className="flex justify-between">
                  <span>Write Throughput:</span>
                  <span className="font-bold">{selectedVolumeData.throughput.write} MB/s</span>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="text-xs font-mono text-gray-500 mb-2">CAPACITY</h4>
              <div className="space-y-2">
                <div className="text-sm">
                  <div className="flex justify-between mb-1">
                    <span>Used:</span>
                    <span>{selectedVolumeData.used}GB / {selectedVolumeData.capacity}GB</span>
                  </div>
                  <div className="w-full bg-gray-800 h-2">
                    <div 
                      className={`h-full transition-all ${
                        (selectedVolumeData.used / selectedVolumeData.capacity) > 0.9 
                          ? 'bg-red-500' 
                          : (selectedVolumeData.used / selectedVolumeData.capacity) > 0.7 
                          ? 'bg-yellow-500' 
                          : 'bg-green-500'
                      }`}
                      style={{ width: `${(selectedVolumeData.used / selectedVolumeData.capacity) * 100}%` }}
                    />
                  </div>
                </div>
                <div className="text-sm">
                  <span className="text-gray-500">Available: </span>
                  <span className="font-bold">{selectedVolumeData.available}GB</span>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="text-xs font-mono text-gray-500 mb-2">HEALTH</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center space-x-2">
                  <span>Status:</span>
                  <span className={`font-bold ${getStatusColor(selectedVolumeData.status).split(' ')[0]}`}>
                    {selectedVolumeData.status.toUpperCase()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Type:</span>
                  <span className="font-bold">{selectedVolumeData.type.toUpperCase()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Namespace:</span>
                  <span className="font-bold">{selectedVolumeData.namespace}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Storage Classes */}
      <div className="border border-white">
        <div className="border-b border-white px-4 py-2">
          <h3 className="font-mono text-sm font-bold">STORAGE CLASSES</h3>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {storageClasses.map(sc => (
              <div key={sc.name} className="border border-white/30 p-3">
                <div className="font-mono text-sm font-bold mb-2">{sc.name}</div>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Provisioner:</span>
                    <span>{sc.provisioner.split('/').pop()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Volumes:</span>
                    <span>{sc.volumeCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Capacity:</span>
                    <span>{sc.usedCapacity}GB / {sc.totalCapacity}GB</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Policy:</span>
                    <span>{sc.reclaimPolicy}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StorageIOMetrics;
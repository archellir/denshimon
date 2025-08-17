import type { FC } from 'react';

interface SkeletonLoaderProps {
  variant?: 'text' | 'card' | 'table' | 'chart' | 'list' | 'deployment-card' | 'image-card' | 'history-item' | 'health-card' | 'infra-overview' | 'infra-config' | 'infra-network' | 'infra-storage' | 'infra-nodes';
  count?: number;
  className?: string;
}

const SkeletonLoader: FC<SkeletonLoaderProps> = ({ 
  variant = 'text', 
  count = 1, 
  className = '' 
}) => {
  const renderSkeleton = () => {
    switch (variant) {
      case 'text':
        return (
          <div className="space-y-2">
            {Array.from({ length: count }).map((_, i) => (
              <div key={i} className="h-4 bg-white/10 animate-pulse rounded" />
            ))}
          </div>
        );

      case 'card':
        return (
          <div className="space-y-4">
            {Array.from({ length: count }).map((_, i) => (
              <div key={i} className="border border-white/20 p-4 space-y-3">
                <div className="h-6 bg-white/10 animate-pulse rounded w-3/4" />
                <div className="h-4 bg-white/10 animate-pulse rounded" />
                <div className="h-4 bg-white/10 animate-pulse rounded w-5/6" />
                <div className="flex space-x-2 mt-4">
                  <div className="h-8 bg-white/10 animate-pulse rounded w-20" />
                  <div className="h-8 bg-white/10 animate-pulse rounded w-20" />
                </div>
              </div>
            ))}
          </div>
        );

      case 'table':
        return (
          <div className="border border-white/20">
            <div className="border-b border-white/20 p-3">
              <div className="flex space-x-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-4 bg-white/10 animate-pulse rounded flex-1" />
                ))}
              </div>
            </div>
            {Array.from({ length: count }).map((_, i) => (
              <div key={i} className="border-b border-white/20 p-3">
                <div className="flex space-x-4">
                  {Array.from({ length: 4 }).map((_, j) => (
                    <div key={j} className="h-4 bg-white/10 animate-pulse rounded flex-1" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        );

      case 'chart':
        return (
          <div className="border border-white/20 p-4">
            <div className="h-6 bg-white/10 animate-pulse rounded w-1/3 mb-4" />
            <div className="h-64 bg-white/5 animate-pulse rounded flex items-end justify-around p-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div 
                  key={i} 
                  className="bg-white/10 animate-pulse rounded w-8"
                  style={{ height: `${Math.random() * 80 + 20}%` }}
                />
              ))}
            </div>
          </div>
        );

      case 'list':
        return (
          <div className="space-y-2">
            {Array.from({ length: count }).map((_, i) => (
              <div key={i} className="flex items-center space-x-3 p-2">
                <div className="w-2 h-2 bg-white/10 animate-pulse rounded-full" />
                <div className="flex-1 h-4 bg-white/10 animate-pulse rounded" />
                <div className="w-16 h-4 bg-white/10 animate-pulse rounded" />
              </div>
            ))}
          </div>
        );

      case 'deployment-card':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {Array.from({ length: count }).map((_, i) => (
              <div key={i} className="border border-white/20 p-4 hover:border-green-400 transition-colors bg-black">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="h-6 bg-white/10 animate-pulse rounded w-40 mb-2" />
                    <div className="flex items-center space-x-4 text-sm">
                      <div className="h-4 bg-white/10 animate-pulse rounded w-20" />
                      <div className="h-4 bg-white/10 animate-pulse rounded w-24" />
                      <div className="h-4 bg-white/10 animate-pulse rounded w-20" />
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="h-8 bg-white/10 animate-pulse rounded w-16" />
                    <div className="h-8 bg-white/10 animate-pulse rounded w-8" />
                    <div className="h-8 bg-white/10 animate-pulse rounded w-8" />
                  </div>
                </div>
                <div className="text-sm space-y-1">
                  <div className="h-4 bg-white/10 animate-pulse rounded w-4/5" />
                  <div className="h-4 bg-white/10 animate-pulse rounded w-3/5" />
                </div>
              </div>
            ))}
          </div>
        );

      case 'image-card':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {Array.from({ length: count }).map((_, i) => (
              <div key={i} className="border border-white/20 p-4 hover:border-white/40 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="h-4 bg-white/10 animate-pulse rounded w-3/4 mb-1" />
                    <div className="h-4 bg-white/10 animate-pulse rounded w-1/2 mb-1" />
                    <div className="h-3 bg-white/10 animate-pulse rounded w-2/3" />
                  </div>
                  <div className="h-8 bg-white/10 animate-pulse rounded w-16" />
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <div className="h-3 bg-white/10 animate-pulse rounded w-8" />
                    <div className="h-3 bg-white/10 animate-pulse rounded w-12" />
                  </div>
                  <div className="flex justify-between">
                    <div className="h-3 bg-white/10 animate-pulse rounded w-12" />
                    <div className="h-3 bg-white/10 animate-pulse rounded w-16" />
                  </div>
                  <div className="flex justify-between">
                    <div className="h-3 bg-white/10 animate-pulse rounded w-10" />
                    <div className="h-3 bg-white/10 animate-pulse rounded w-14" />
                  </div>
                  <div className="flex justify-between">
                    <div className="h-3 bg-white/10 animate-pulse rounded w-10" />
                    <div className="h-3 bg-white/10 animate-pulse rounded w-20" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        );

      case 'history-item':
        return (
          <div className="space-y-4">
            {Array.from({ length: count }).map((_, i) => (
              <div key={i} className="border border-white/20 p-4 animate-pulse">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-4">
                    <div className="h-5 w-5 bg-white/10 rounded-full"></div>
                    <div>
                      <div className="h-5 bg-white/10 rounded w-24 mb-2"></div>
                      <div className="h-4 bg-white/10 rounded w-32"></div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="h-4 bg-white/10 rounded w-28 mb-1"></div>
                    <div className="h-3 bg-white/10 rounded w-20"></div>
                  </div>
                </div>
                <div className="mt-3 space-y-2">
                  <div className="h-4 bg-white/10 rounded w-48"></div>
                  <div className="h-4 bg-white/10 rounded w-40"></div>
                </div>
              </div>
            ))}
          </div>
        );

      case 'health-card':
        return (
          <div className="border border-white/20 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="h-4 bg-white/10 animate-pulse rounded w-20" />
              <div className="h-6 w-6 bg-white/10 animate-pulse rounded" />
            </div>
            <div className="space-y-2">
              <div className="h-8 bg-white/10 animate-pulse rounded w-16" />
              <div className="h-3 bg-white/10 animate-pulse rounded w-24" />
              <div className="h-3 bg-white/10 animate-pulse rounded w-20" />
            </div>
          </div>
        );

      case 'infra-overview':
        return (
          <div className="space-y-6">
            {/* Resource Usage Over Time Skeleton */}
            <div className="border border-white/20 p-4 h-96">
              <div className="h-4 bg-white/10 animate-pulse rounded w-48 mb-4" />
              <div className="h-80 bg-white/5 animate-pulse rounded flex items-end justify-around p-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div 
                    key={i} 
                    className="bg-white/10 animate-pulse rounded w-8"
                    style={{ height: `${Math.random() * 60 + 20}%` }}
                  />
                ))}
              </div>
            </div>

            {/* Status & Capacity Skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Workload Distribution Skeleton */}
              <div className="border border-white/20 p-4">
                <div className="h-4 bg-white/10 animate-pulse rounded w-32 mb-4" />
                <div className="h-64 bg-white/5 animate-pulse rounded flex items-center justify-center">
                  <div className="w-32 h-32 bg-white/10 animate-pulse rounded-full" />
                </div>
                <div className="mt-4 space-y-1">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-white/10 animate-pulse rounded mr-2" />
                        <div className="h-3 bg-white/10 animate-pulse rounded w-16" />
                      </div>
                      <div className="h-3 bg-white/10 animate-pulse rounded w-8" />
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Capacity Status Skeleton */}
              <div className="border border-white/20 p-4">
                <div className="h-4 bg-white/10 animate-pulse rounded w-32 mb-4" />
                <div className="space-y-4 mt-6">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i}>
                      <div className="flex justify-between items-center mb-2">
                        <div className="h-3 bg-white/10 animate-pulse rounded w-12" />
                        <div className="h-3 bg-white/10 animate-pulse rounded w-10" />
                      </div>
                      <div className="w-full bg-gray-800 border border-white/20 h-3">
                        <div className="h-full bg-white/10 animate-pulse rounded" style={{ width: `${Math.random() * 80 + 20}%` }} />
                      </div>
                      <div className="h-3 bg-white/10 animate-pulse rounded w-24 mt-1" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      case 'infra-config':
        return (
          <div className="space-y-6">
            {/* Repository Status Header Skeleton */}
            <div className="border border-white/20 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-6 h-6 bg-white/10 animate-pulse rounded" />
                  <div>
                    <div className="h-6 bg-white/10 animate-pulse rounded w-48 mb-2" />
                    <div className="h-4 bg-white/10 animate-pulse rounded w-64" />
                  </div>
                </div>
                <div className="h-10 bg-white/10 animate-pulse rounded w-32" />
              </div>
            </div>

            {/* Three Cards Grid Skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Repository Status Card */}
              <div className="border border-white/20 p-4">
                <div className="h-4 bg-white/10 animate-pulse rounded w-32 mb-3" />
                <div className="space-y-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="h-3 bg-white/10 animate-pulse rounded w-16" />
                      <div className="h-3 bg-white/10 animate-pulse rounded w-20" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Sync Information Card */}
              <div className="border border-white/20 p-4">
                <div className="h-4 bg-white/10 animate-pulse rounded w-32 mb-3" />
                <div className="space-y-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="h-3 bg-white/10 animate-pulse rounded w-20" />
                      <div className="h-3 bg-white/10 animate-pulse rounded w-16" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Activity Card */}
              <div className="border border-white/20 p-4">
                <div className="h-4 bg-white/10 animate-pulse rounded w-32 mb-3" />
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="h-3 bg-white/10 animate-pulse rounded w-28" />
                    <div className="h-3 bg-white/10 animate-pulse rounded w-8" />
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-white/10 animate-pulse rounded" />
                    <div className="h-3 bg-white/10 animate-pulse rounded w-48" />
                  </div>
                </div>
              </div>
            </div>

            {/* Two Large Panels Grid Skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* GitOps Monitoring Panel */}
              <div className="border border-white/20 p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-5 h-5 bg-white/10 animate-pulse rounded" />
                  <div className="h-5 bg-white/10 animate-pulse rounded w-40" />
                </div>
                <div className="space-y-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="h-3 bg-white/10 animate-pulse rounded w-24" />
                      <div className="h-3 bg-white/10 animate-pulse rounded w-16" />
                    </div>
                  ))}
                  <div className="h-10 bg-white/10 animate-pulse rounded w-full mt-4" />
                </div>
              </div>

              {/* Webhook Integration Panel */}
              <div className="border border-white/20 p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-5 h-5 bg-white/10 animate-pulse rounded" />
                  <div className="h-5 bg-white/10 animate-pulse rounded w-40" />
                </div>
                <div className="space-y-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="h-3 bg-white/10 animate-pulse rounded w-20" />
                      <div className="h-3 bg-white/10 animate-pulse rounded w-16" />
                    </div>
                  ))}
                  <div className="flex space-x-2 mt-4">
                    <div className="flex-1 h-10 bg-white/10 animate-pulse rounded" />
                    <div className="h-10 w-10 bg-white/10 animate-pulse rounded" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'infra-network':
        return (
          <div className="space-y-6">
            {/* Current Bandwidth Stats Grid Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="border border-white/20 p-4">
                  <div className="h-3 bg-white/10 animate-pulse rounded w-24 mb-2" />
                  <div className="h-5 bg-white/10 animate-pulse rounded w-16" />
                </div>
              ))}
            </div>

            {/* Main Charts Grid Skeleton */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              {/* Bandwidth Over Time Chart (2/3 width) */}
              <div className="xl:col-span-2 border border-white/20 p-4">
                <div className="h-4 bg-white/10 animate-pulse rounded w-32 mb-4" />
                <div className="h-80 bg-white/5 animate-pulse rounded flex items-end justify-around p-4">
                  {Array.from({ length: 12 }).map((_, i) => (
                    <div 
                      key={i} 
                      className="bg-white/10 animate-pulse rounded w-4"
                      style={{ height: `${Math.random() * 60 + 20}%` }}
                    />
                  ))}
                </div>
              </div>

              {/* Protocol Breakdown Chart (1/3 width) */}
              <div className="border border-white/20 p-4">
                <div className="h-4 bg-white/10 animate-pulse rounded w-32 mb-4" />
                <div className="h-80">
                  {/* Pie chart skeleton */}
                  <div className="h-48 flex items-center justify-center">
                    <div className="w-32 h-32 bg-white/10 animate-pulse rounded-full" />
                  </div>
                  {/* Legend skeleton */}
                  <div className="space-y-2 mt-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="w-3 h-3 bg-white/10 animate-pulse rounded mr-2" />
                          <div className="h-3 bg-white/10 animate-pulse rounded w-12" />
                        </div>
                        <div className="h-3 bg-white/10 animate-pulse rounded w-8" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Top Network Talkers Table Skeleton */}
            <div className="border border-white/20 p-4">
              <div className="h-4 bg-white/10 animate-pulse rounded w-40 mb-4" />
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/20">
                      {['RANK', 'POD NAME', 'NAMESPACE', 'INGRESS', 'EGRESS', 'TOTAL', 'CONNECTIONS'].map((header, i) => (
                        <th key={i} className="text-left p-2">
                          <div className="h-3 bg-white/10 animate-pulse rounded w-16" />
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {Array.from({ length: 8 }).map((_, i) => (
                      <tr key={i} className="border-b border-white/20">
                        {Array.from({ length: 7 }).map((_, j) => (
                          <td key={j} className="p-2">
                            <div className="h-3 bg-white/10 animate-pulse rounded w-12" />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );

      case 'infra-storage':
        return (
          <div className="space-y-6">
            {/* Overview Stats Grid Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="border border-white/20 px-6 py-3">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="h-3 bg-white/10 animate-pulse rounded w-16 mb-2" />
                      <div className="h-6 bg-white/10 animate-pulse rounded w-12 mb-1" />
                      <div className="h-3 bg-white/10 animate-pulse rounded w-20" />
                    </div>
                    <div className="w-9 h-9 bg-white/10 animate-pulse rounded ml-4" />
                  </div>
                </div>
              ))}
            </div>

            {/* IO Performance Charts Grid Skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* IOPS Chart */}
              <div className="border border-white/20 p-4">
                <div className="h-4 bg-white/10 animate-pulse rounded w-24 mb-4" />
                <div className="h-48 bg-white/5 animate-pulse rounded flex items-end justify-around p-4">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <div 
                      key={i} 
                      className="bg-white/10 animate-pulse rounded w-4"
                      style={{ height: `${Math.random() * 60 + 20}%` }}
                    />
                  ))}
                </div>
              </div>

              {/* Throughput Chart */}
              <div className="border border-white/20 p-4">
                <div className="h-4 bg-white/10 animate-pulse rounded w-32 mb-4" />
                <div className="h-48 bg-white/5 animate-pulse rounded flex items-center justify-center">
                  <div className="w-full h-full bg-white/10 animate-pulse rounded" />
                </div>
              </div>
            </div>

            {/* Persistent Volumes Table Skeleton */}
            <div className="border border-white/20">
              <div className="border-b border-white/20 px-4 py-2">
                <div className="h-4 bg-white/10 animate-pulse rounded w-40" />
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/20">
                      {['NAME', 'TYPE', 'CAPACITY', 'USED', 'IOPS', 'THROUGHPUT', 'LATENCY', 'STATUS'].map((header, i) => (
                        <th key={i} className="text-left p-3">
                          <div className="h-3 bg-white/10 animate-pulse rounded w-16" />
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i} className="border-b border-white/10">
                        <td className="p-3">
                          <div className="h-4 bg-white/10 animate-pulse rounded w-32 mb-1" />
                          <div className="h-3 bg-white/10 animate-pulse rounded w-20" />
                        </td>
                        <td className="p-3">
                          <div className="h-3 bg-white/10 animate-pulse rounded w-16" />
                        </td>
                        <td className="p-3">
                          <div className="h-3 bg-white/10 animate-pulse rounded w-12" />
                        </td>
                        <td className="p-3">
                          <div className="h-3 bg-white/10 animate-pulse rounded w-12 mb-1" />
                          <div className="h-3 bg-white/10 animate-pulse rounded w-8" />
                        </td>
                        <td className="p-3">
                          <div className="h-3 bg-white/10 animate-pulse rounded w-8 mb-1" />
                          <div className="h-3 bg-white/10 animate-pulse rounded w-8" />
                        </td>
                        <td className="p-3">
                          <div className="h-3 bg-white/10 animate-pulse rounded w-12 mb-1" />
                          <div className="h-3 bg-white/10 animate-pulse rounded w-12" />
                        </td>
                        <td className="p-3">
                          <div className="h-3 bg-white/10 animate-pulse rounded w-8 mb-1" />
                          <div className="h-3 bg-white/10 animate-pulse rounded w-8" />
                        </td>
                        <td className="p-3">
                          <div className="h-6 bg-white/10 animate-pulse rounded w-16" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Storage Classes Grid Skeleton */}
            <div className="border border-white/20">
              <div className="border-b border-white/20 px-4 py-2">
                <div className="h-4 bg-white/10 animate-pulse rounded w-32" />
              </div>
              <div className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="border border-white/30 p-3">
                      <div className="h-4 bg-white/10 animate-pulse rounded w-24 mb-2" />
                      <div className="space-y-1">
                        {Array.from({ length: 4 }).map((_, j) => (
                          <div key={j} className="flex justify-between">
                            <div className="h-3 bg-white/10 animate-pulse rounded w-16" />
                            <div className="h-3 bg-white/10 animate-pulse rounded w-20" />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      case 'infra-nodes':
        return (
          <div className="space-y-4">
            {/* Node Cards Skeleton */}
            <div className="grid gap-4">
              {Array.from({ length: count || 3 }).map((_, i) => (
                <div key={i} className="border border-white/20 bg-black">
                  {/* Header Skeleton */}
                  <div className="p-4 border-b border-white/20">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-5 h-5 bg-white/10 animate-pulse rounded" />
                        <div>
                          <div className="h-5 bg-white/10 animate-pulse rounded w-32 mb-1" />
                          <div className="flex items-center space-x-2">
                            <div className="w-4 h-4 bg-white/10 animate-pulse rounded" />
                            <div className="h-3 bg-white/10 animate-pulse rounded w-16" />
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="h-3 bg-white/10 animate-pulse rounded w-8 mb-1" />
                        <div className="h-5 bg-white/10 animate-pulse rounded w-6" />
                      </div>
                    </div>
                  </div>

                  {/* Resource Usage Skeleton */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-0">
                    {/* CPU Section */}
                    <div className="p-4 border-b md:border-b-0 md:border-r border-white/20">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <div className="w-4 h-4 bg-white/10 animate-pulse rounded" />
                          <div className="h-3 bg-white/10 animate-pulse rounded w-8" />
                        </div>
                        <div className="h-3 bg-white/10 animate-pulse rounded w-12" />
                      </div>
                      <div className="w-full bg-gray-800 border border-white/20 h-2">
                        <div className="h-full bg-white/10 animate-pulse rounded" style={{ width: `${Math.random() * 80 + 20}%` }} />
                      </div>
                      <div className="mt-2">
                        <div className="h-3 bg-white/10 animate-pulse rounded w-20" />
                      </div>
                    </div>

                    {/* Memory Section */}
                    <div className="p-4 border-b md:border-b-0 lg:border-r border-white/20">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <div className="w-4 h-4 bg-white/10 animate-pulse rounded" />
                          <div className="h-3 bg-white/10 animate-pulse rounded w-12" />
                        </div>
                        <div className="h-3 bg-white/10 animate-pulse rounded w-12" />
                      </div>
                      <div className="w-full bg-gray-800 border border-white/20 h-2">
                        <div className="h-full bg-white/10 animate-pulse rounded" style={{ width: `${Math.random() * 80 + 20}%` }} />
                      </div>
                      <div className="mt-2">
                        <div className="h-3 bg-white/10 animate-pulse rounded w-24" />
                      </div>
                    </div>

                    {/* Storage Section */}
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <div className="w-4 h-4 bg-white/10 animate-pulse rounded" />
                          <div className="h-3 bg-white/10 animate-pulse rounded w-14" />
                        </div>
                        <div className="h-3 bg-white/10 animate-pulse rounded w-12" />
                      </div>
                      <div className="w-full bg-gray-800 border border-white/20 h-2">
                        <div className="h-full bg-white/10 animate-pulse rounded" style={{ width: `${Math.random() * 80 + 20}%` }} />
                      </div>
                      <div className="mt-2">
                        <div className="h-3 bg-white/10 animate-pulse rounded w-20" />
                      </div>
                    </div>
                  </div>

                  {/* Footer Skeleton */}
                  <div className="p-4 border-t border-white/20 bg-gray-900/20">
                    <div className="flex justify-between items-center">
                      <div className="h-3 bg-white/10 animate-pulse rounded w-20" />
                      <div className="h-3 bg-white/10 animate-pulse rounded w-16" />
                      <div className="h-3 bg-white/10 animate-pulse rounded w-12" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={className}>
      {renderSkeleton()}
    </div>
  );
};

export default SkeletonLoader;
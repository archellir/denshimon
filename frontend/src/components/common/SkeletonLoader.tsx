import type { FC } from 'react';

interface SkeletonLoaderProps {
  variant?: 'text' | 'card' | 'table' | 'chart' | 'list' | 'deployment-card' | 'image-card';
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
          <>
            {Array.from({ length: count }).map((_, i) => (
              <div key={i} className="border border-white/20 p-4 space-y-3">
                {/* Header section */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex-1 space-y-2">
                    <div className="h-6 bg-white/10 animate-pulse rounded w-2/3" />
                    <div className="flex space-x-4">
                      <div className="h-4 bg-white/10 animate-pulse rounded w-20" />
                      <div className="h-4 bg-white/10 animate-pulse rounded w-24" />
                      <div className="h-4 bg-white/10 animate-pulse rounded w-20" />
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <div className="h-8 bg-white/10 animate-pulse rounded w-16" />
                    <div className="h-8 bg-white/10 animate-pulse rounded w-8" />
                    <div className="h-8 bg-white/10 animate-pulse rounded w-8" />
                  </div>
                </div>
                {/* Content section */}
                <div className="space-y-2">
                  <div className="h-4 bg-white/10 animate-pulse rounded w-4/5" />
                  <div className="h-4 bg-white/10 animate-pulse rounded w-3/5" />
                </div>
              </div>
            ))}
          </>
        );

      case 'image-card':
        return (
          <>
            {Array.from({ length: count }).map((_, i) => (
              <div key={i} className="border border-white/20 p-4 space-y-3">
                {/* Header section */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="h-5 bg-white/10 animate-pulse rounded w-3/4" />
                    <div className="h-4 bg-white/10 animate-pulse rounded w-1/2" />
                    <div className="h-3 bg-white/10 animate-pulse rounded w-2/3" />
                  </div>
                  <div className="h-8 bg-white/10 animate-pulse rounded w-20" />
                </div>
                {/* Details section */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <div className="h-3 bg-white/10 animate-pulse rounded w-12" />
                    <div className="h-3 bg-white/10 animate-pulse rounded w-16" />
                  </div>
                  <div className="flex justify-between">
                    <div className="h-3 bg-white/10 animate-pulse rounded w-16" />
                    <div className="h-3 bg-white/10 animate-pulse rounded w-20" />
                  </div>
                  <div className="flex justify-between">
                    <div className="h-3 bg-white/10 animate-pulse rounded w-14" />
                    <div className="h-3 bg-white/10 animate-pulse rounded w-18" />
                  </div>
                  <div className="flex justify-between">
                    <div className="h-3 bg-white/10 animate-pulse rounded w-12" />
                    <div className="h-3 bg-white/10 animate-pulse rounded w-24" />
                  </div>
                </div>
              </div>
            ))}
          </>
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
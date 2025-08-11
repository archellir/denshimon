import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import type { FC, ReactNode } from 'react';

export interface Column<T = any> {
  key: string;
  title: string;
  width?: number;
  minWidth?: number;
  render?: (item: T, index: number) => ReactNode;
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
}

export interface VirtualizedTableProps<T = any> {
  data: T[];
  columns: Column<T>[];
  rowHeight?: number;
  containerHeight?: number;
  overscan?: number;
  onRowClick?: (item: T, index: number) => void;
  className?: string;
  loading?: boolean;
  loadingMessage?: string;
  emptyMessage?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  onSort?: (key: string, order: 'asc' | 'desc') => void;
}

const VirtualizedTable: FC<VirtualizedTableProps> = ({
  data,
  columns,
  rowHeight = 48,
  containerHeight = 400,
  overscan = 5,
  onRowClick,
  className = '',
  loading = false,
  loadingMessage = 'LOADING...',
  emptyMessage = 'NO DATA AVAILABLE',
  sortBy,
  sortOrder,
  onSort,
}) => {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollElementRef = useRef<HTMLDivElement>(null);

  const totalHeight = data.length * rowHeight;
  const visibleCount = Math.ceil(containerHeight / rowHeight);
  
  const startIndex = Math.max(0, Math.floor(scrollTop / rowHeight) - overscan);
  const endIndex = Math.min(data.length - 1, startIndex + visibleCount + 2 * overscan);

  const visibleItems = useMemo(() => {
    return data.slice(startIndex, endIndex + 1);
  }, [data, startIndex, endIndex]);

  const handleScroll = useCallback((e: Event) => {
    const target = e.target as HTMLDivElement;
    setScrollTop(target.scrollTop);
  }, []);

  useEffect(() => {
    const scrollElement = scrollElementRef.current;
    if (scrollElement) {
      scrollElement.addEventListener('scroll', handleScroll);
      return () => scrollElement.removeEventListener('scroll', handleScroll);
    }
  }, [handleScroll]);

  const handleSort = (key: string) => {
    if (!onSort) return;
    
    if (sortBy === key) {
      onSort(key, sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      onSort(key, 'asc');
    }
  };

  const getSortIcon = (key: string) => {
    if (sortBy !== key) return '↕';
    return sortOrder === 'asc' ? '↑' : '↓';
  };

  if (loading) {
    return (
      <div className={`border border-white ${className}`}>
        <div className="p-8 text-center">
          <div className="font-mono">{loadingMessage}</div>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className={`border border-white ${className}`}>
        <div className="p-8 text-center">
          <div className="font-mono opacity-60">{emptyMessage}</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`border border-white overflow-hidden ${className}`} ref={containerRef}>
      {/* Header */}
      <div className="bg-white text-black sticky top-0 z-10">
        <div className="flex">
          {columns.map((column) => (
            <div
              key={column.key}
              className={`px-4 py-3 font-mono text-sm font-bold flex-1 min-w-0 flex items-center ${
                column.align === 'center' ? 'justify-center' : 
                column.align === 'right' ? 'justify-end' : 'justify-start'
              } ${column.sortable ? 'cursor-pointer hover:bg-gray-100 select-none' : ''}`}
              style={{ 
                width: column.width ? `${column.width}px` : undefined,
                minWidth: column.minWidth ? `${column.minWidth}px` : '120px'
              }}
              onClick={column.sortable ? () => handleSort(column.key) : undefined}
            >
              <span className="truncate">{column.title}</span>
              {column.sortable && (
                <span className="ml-2 text-xs opacity-70">
                  {getSortIcon(column.key)}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Scrollable body */}
      <div
        ref={scrollElementRef}
        className="overflow-auto"
        style={{ height: containerHeight }}
      >
        {/* Virtual scroll container */}
        <div style={{ height: totalHeight, position: 'relative' }}>
          {/* Visible rows */}
          <div style={{ transform: `translateY(${startIndex * rowHeight}px)` }}>
            {visibleItems.map((item, virtualIndex) => {
              const actualIndex = startIndex + virtualIndex;
              return (
                <div
                  key={actualIndex}
                  className={`flex border-t border-white/20 hover:bg-white/5 transition-colors ${
                    actualIndex % 2 === 0 ? 'bg-black' : 'bg-gray-900/50'
                  } ${onRowClick ? 'cursor-pointer' : ''}`}
                  style={{ height: rowHeight }}
                  onClick={onRowClick ? () => onRowClick(item, actualIndex) : undefined}
                >
                  {columns.map((column) => (
                    <div
                      key={column.key}
                      className={`px-4 py-3 font-mono text-sm flex-1 min-w-0 flex items-center overflow-hidden ${
                        column.align === 'center' ? 'justify-center' : 
                        column.align === 'right' ? 'justify-end' : 'justify-start'
                      }`}
                      style={{ 
                        width: column.width ? `${column.width}px` : undefined,
                        minWidth: column.minWidth ? `${column.minWidth}px` : '120px'
                      }}
                    >
                      <div className="truncate">
                        {column.render ? column.render(item, actualIndex) : (item as any)[column.key]}
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer with row count */}
      <div className="border-t border-white p-2 text-xs font-mono text-gray-400 text-center">
        Showing {Math.min(visibleCount, data.length)} of {data.length} rows
      </div>
    </div>
  );
};

export default VirtualizedTable;
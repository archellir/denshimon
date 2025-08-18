import { useState, useEffect, useMemo } from 'react'
import type { FC } from 'react'
import { Terminal, X } from 'lucide-react'
import VirtualizedTable, { Column } from '@components/common/VirtualizedTable'
import PodDebugPanel from '@components/pods/PodDebugPanel'
import SkeletonLoader from '@components/common/SkeletonLoader'
import useWorkloadsStore, { Pod as StorePod } from '@stores/workloadsStore'
import { 
  getPodStatusIcon, 
  getPodStatusColor, 
  filterPods, 
  sortPods
} from '@utils/podStatus'

// Using Pod interface from store
type Pod = StorePod;

interface PodsViewProps {
  selectedNamespace: string;
}

const PodsView: FC<PodsViewProps> = ({ selectedNamespace }) => {
  const { pods, isLoading, error, fetchPods } = useWorkloadsStore()
  const [sortBy, setSortBy] = useState<string>('name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [selectedPod, setSelectedPod] = useState<Pod | null>(null)
  const [isDebugPanelOpen, setIsDebugPanelOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  // Listen for global search navigation
  useEffect(() => {
    const handleLocalSearchFilter = (event: CustomEvent) => {
      const { query, type } = event.detail;
      if (type === 'pod') {
        setSearchQuery(query);
      }
    };

    window.addEventListener('setLocalSearchFilter', handleLocalSearchFilter as EventListener);
    return () => {
      window.removeEventListener('setLocalSearchFilter', handleLocalSearchFilter as EventListener);
    };
  }, []);

  useEffect(() => {
    fetchPods(selectedNamespace)
  }, [selectedNamespace, fetchPods])



  const filteredAndSortedPods = useMemo(() => {
    const filtered = filterPods(pods, selectedNamespace, searchQuery);
    return sortPods(filtered, sortBy, sortOrder);
  }, [pods, selectedNamespace, sortBy, sortOrder, searchQuery])

  const handleSort = (key: string, order: 'asc' | 'desc') => {
    setSortBy(key)
    setSortOrder(order)
  }

  const handleDebugPod = (pod: Pod) => {
    setSelectedPod(pod)
    setIsDebugPanelOpen(true)
  }

  const columns: Column<Pod>[] = [
    {
      key: 'phase',
      title: 'STATUS',
      width: 120,
      sortable: true,
      render: (pod: Pod) => (
        <div className="flex items-center space-x-2">
          {getPodStatusIcon(pod.phase)}
          <span className={`text-xs ${getPodStatusColor(pod.phase)}`}>
            {pod.phase}
          </span>
        </div>
      ),
    },
    {
      key: 'name',
      title: 'NAME',
      minWidth: 200,
      sortable: true,
      render: (pod: Pod) => (
        <span className="font-mono text-sm truncate" title={pod.name}>
          {pod.name}
        </span>
      ),
    },
    {
      key: 'namespace',
      title: 'NAMESPACE',
      width: 140,
      sortable: true,
      render: (pod: Pod) => (
        <span className="font-mono text-sm">{pod.namespace}</span>
      ),
    },
    {
      key: 'ready',
      title: 'READY',
      width: 80,
      align: 'center' as const,
      render: (pod: Pod) => (
        <span className="font-mono text-sm">{pod.ready ? 'True' : 'False'}</span>
      ),
    },
    {
      key: 'restarts',
      title: 'RESTARTS',
      width: 100,
      align: 'right' as const,
      sortable: true,
      render: (pod: Pod) => (
        <span className={`font-mono text-sm ${pod.restarts > 0 ? 'text-yellow-400' : ''}`}>
          {pod.restarts}
        </span>
      ),
    },
    {
      key: 'age',
      title: 'AGE',
      width: 80,
      sortable: true,
      render: (pod: Pod) => (
        <span className="font-mono text-sm">{pod.age}</span>
      ),
    },
    {
      key: 'node',
      title: 'NODE',
      minWidth: 140,
      sortable: true,
      render: (pod: Pod) => (
        <span className="font-mono text-sm truncate" title={pod.node}>
          {pod.node || 'N/A'}
        </span>
      ),
    },
    {
      key: 'ip',
      title: 'IP',
      width: 120,
      render: (pod: Pod) => (
        <span className="font-mono text-sm">{pod.ip || 'N/A'}</span>
      ),
    },
    {
      key: 'actions',
      title: 'ACTIONS',
      width: 100,
      align: 'center' as const,
      render: (pod: Pod) => (
        <button
          onClick={(e) => {
            e.stopPropagation()
            handleDebugPod(pod)
          }}
          className="p-1 border border-green-400 text-green-400 hover:bg-green-400 hover:text-black transition-colors"
          title="Debug Pod"
        >
          <Terminal size={16} />
        </button>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      {/* Clear Filter Button */}
      {searchQuery && (
        <div className="flex items-center justify-between border border-white/20 p-3">
          <span className="text-sm font-mono opacity-60">
            Filtered by: "{searchQuery}"
          </span>
          <button
            onClick={() => setSearchQuery('')}
            className="flex items-center space-x-1 px-2 py-1 border border-red-400 text-red-400 hover:bg-red-400 hover:text-black transition-colors font-mono text-xs"
          >
            <X size={12} />
            <span>CLEAR</span>
          </button>
        </div>
      )}

      {error && (
        <div className="border border-red-400 bg-red-900/20 p-4">
          <p className="text-red-400 font-mono">{error}</p>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-4">
          <SkeletonLoader variant="table" count={8} />
        </div>
      ) : (
        <VirtualizedTable
          data={filteredAndSortedPods}
          columns={columns}
          containerHeight={500}
          rowHeight={48}
          loading={false}
          loadingMessage="LOADING PODS..."
          emptyMessage={searchQuery ? `NO PODS MATCHING "${searchQuery}"` : "NO PODS FOUND"}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSort={handleSort}
          className="w-full"
        />
      )}

      {/* Debug Panel */}
      {selectedPod && (
        <PodDebugPanel
          pod={selectedPod}
          isOpen={isDebugPanelOpen}
          onClose={() => {
            setIsDebugPanelOpen(false)
            setSelectedPod(null)
          }}
        />
      )}
    </div>
  )
}

export default PodsView
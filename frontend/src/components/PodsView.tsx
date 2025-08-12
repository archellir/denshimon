import { useState, useEffect, useMemo } from 'react'
import type { FC } from 'react'
import { Server, AlertCircle, CheckCircle, RefreshCw, Terminal } from 'lucide-react'
import VirtualizedTable, { Column } from '@components/common/VirtualizedTable'
import PodDebugPanel from '@components/pods/PodDebugPanel'
import SkeletonLoader from '@components/common/SkeletonLoader'

interface Container {
  name: string
  image: string
  ready: boolean
  restartCount: number
  state: string
}

interface Pod {
  name: string
  namespace: string
  status: string
  ready: string
  restarts: number
  age: string
  node: string
  ip: string
  labels: Record<string, string>
  containers?: Container[]
}

const PodsView: FC = () => {
  const [pods, setPods] = useState<Pod[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedNamespace, setSelectedNamespace] = useState<string>('all')
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

  const fetchPods = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const token = localStorage.getItem('auth_token')
      const url = selectedNamespace === 'all' 
        ? '/api/k8s/pods' 
        : `/api/k8s/pods?namespace=${selectedNamespace}`

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(errorText)
      }

      const data = await response.json()
      setPods(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch pods')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchPods()
  }, [selectedNamespace])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Running':
        return <CheckCircle className="text-green-400" size={16} />
      case 'CrashLoopBackOff':
      case 'Failed':
        return <AlertCircle className="text-red-400" size={16} />
      default:
        return <Server className="text-yellow-400" size={16} />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Running':
        return 'text-green-400'
      case 'CrashLoopBackOff':
      case 'Failed':
        return 'text-red-400'
      default:
        return 'text-yellow-400'
    }
  }

  const namespaces = ['all', 'denshimon-test', 'monitoring', 'production', 'default']

  const filteredAndSortedPods = useMemo(() => {
    let filtered = selectedNamespace === 'all' 
      ? pods 
      : pods.filter(pod => pod.namespace === selectedNamespace)

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(pod => 
        pod.name.toLowerCase().includes(query) ||
        pod.namespace.toLowerCase().includes(query) ||
        pod.status.toLowerCase().includes(query) ||
        pod.node?.toLowerCase().includes(query) ||
        pod.ip?.toLowerCase().includes(query)
      )
    }

    return filtered.sort((a, b) => {
      let valueA: any, valueB: any
      
      switch (sortBy) {
        case 'namespace':
          valueA = a.namespace
          valueB = b.namespace
          break
        case 'status':
          valueA = a.status
          valueB = b.status
          break
        case 'restarts':
          valueA = a.restarts
          valueB = b.restarts
          break
        case 'age':
          valueA = a.age
          valueB = b.age
          break
        case 'node':
          valueA = a.node || ''
          valueB = b.node || ''
          break
        default:
          valueA = a.name
          valueB = b.name
      }

      if (typeof valueA === 'number' && typeof valueB === 'number') {
        return sortOrder === 'asc' ? valueA - valueB : valueB - valueA
      }
      
      const comparison = valueA.toString().localeCompare(valueB.toString())
      return sortOrder === 'asc' ? comparison : -comparison
    })
  }, [pods, selectedNamespace, sortBy, sortOrder, searchQuery])

  const handleSort = (key: string, order: 'asc' | 'desc') => {
    setSortBy(key)
    setSortOrder(order)
  }

  const handleDebugPod = (pod: Pod) => {
    // Add default containers if not present (for backward compatibility)
    const podWithContainers = {
      ...pod,
      containers: pod.containers || [{
        name: 'main',
        image: 'unknown',
        ready: pod.status === 'Running',
        restartCount: pod.restarts,
        state: pod.status
      }]
    }
    setSelectedPod(podWithContainers)
    setIsDebugPanelOpen(true)
  }

  const columns: Column<Pod>[] = [
    {
      key: 'status',
      title: 'STATUS',
      width: 120,
      sortable: true,
      render: (pod: Pod) => (
        <div className="flex items-center space-x-2">
          {getStatusIcon(pod.status)}
          <span className={`text-xs ${getStatusColor(pod.status)}`}>
            {pod.status}
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
        <span className="font-mono text-sm">{pod.ready}</span>
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
    <div className="p-6 bg-black text-white min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-mono">KUBERNETES PODS</h1>
          <div className="flex items-center space-x-4">
            <select
              value={selectedNamespace}
              onChange={(e) => setSelectedNamespace(e.target.value)}
              className="bg-black border border-white text-white p-2 font-mono"
            >
              {namespaces.map(ns => (
                <option key={ns} value={ns}>
                  {ns.toUpperCase()}
                </option>
              ))}
            </select>
            <button
              onClick={fetchPods}
              disabled={isLoading}
              className="flex items-center space-x-2 px-4 py-2 border border-white hover:bg-white hover:text-black transition-colors font-mono"
            >
              <RefreshCw className={isLoading ? 'animate-spin' : ''} size={16} />
              <span>REFRESH</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="border border-red-400 bg-red-900/20 p-4 mb-6">
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
      </div>

      {/* Debug Panel */}
      {selectedPod && (
        <PodDebugPanel
          pod={{ ...selectedPod, containers: selectedPod.containers || [] }}
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
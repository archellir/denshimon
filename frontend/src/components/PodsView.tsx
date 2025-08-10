import { useState, useEffect } from 'react'
import type { FC } from 'react'
import { Server, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react'

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
}

const PodsView: FC = () => {
  const [pods, setPods] = useState<Pod[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedNamespace, setSelectedNamespace] = useState<string>('all')

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

        <div className="border border-white overflow-hidden">
          <table className="w-full">
            <thead className="bg-white text-black">
              <tr>
                <th className="px-4 py-3 text-left font-mono">STATUS</th>
                <th className="px-4 py-3 text-left font-mono">NAME</th>
                <th className="px-4 py-3 text-left font-mono">NAMESPACE</th>
                <th className="px-4 py-3 text-left font-mono">READY</th>
                <th className="px-4 py-3 text-left font-mono">RESTARTS</th>
                <th className="px-4 py-3 text-left font-mono">AGE</th>
                <th className="px-4 py-3 text-left font-mono">NODE</th>
                <th className="px-4 py-3 text-left font-mono">IP</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center">
                    <div className="flex items-center justify-center space-x-2">
                      <RefreshCw className="animate-spin" size={16} />
                      <span className="font-mono">LOADING...</span>
                    </div>
                  </td>
                </tr>
              ) : pods.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center font-mono text-gray-400">
                    NO PODS FOUND
                  </td>
                </tr>
              ) : (
                pods.map((pod, index) => (
                  <tr 
                    key={pod.name} 
                    className={`border-t border-white/20 hover:bg-white/5 ${
                      index % 2 === 0 ? 'bg-black' : 'bg-gray-900/50'
                    }`}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(pod.status)}
                        <span className={`font-mono text-sm ${getStatusColor(pod.status)}`}>
                          {pod.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-sm">{pod.name}</td>
                    <td className="px-4 py-3 font-mono text-sm">{pod.namespace}</td>
                    <td className="px-4 py-3 font-mono text-sm">{pod.ready}</td>
                    <td className="px-4 py-3 font-mono text-sm">{pod.restarts}</td>
                    <td className="px-4 py-3 font-mono text-sm">{pod.age}</td>
                    <td className="px-4 py-3 font-mono text-sm">{pod.node || 'N/A'}</td>
                    <td className="px-4 py-3 font-mono text-sm">{pod.ip || 'N/A'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {pods.length > 0 && (
          <div className="mt-4 text-sm font-mono text-gray-400">
            Total: {pods.length} pods
          </div>
        )}
      </div>
    </div>
  )
}

export default PodsView
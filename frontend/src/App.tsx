import { useState } from 'react'
import type { FC } from 'react'

const App: FC = () => {
  const [count, setCount] = useState<number>(0)

  return (
    <div className="min-h-screen bg-black text-white font-mono scan-lines">
      <div className="matrix-bg">
        {/* Header */}
        <header className="border-b border-white/20 p-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold cursor">
              K8S-WEBUI_INIT
            </h1>
            <div className="text-sm text-green-500">
              [SYSTEM_ONLINE]
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto p-8">
          <div className="border border-white/30 p-6 bg-black/90">
            
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <span className="text-green-500">$</span>
                <span className="cursor">initializing_k8s_webui</span>
              </div>
              
              <div className="border border-green-500/30 p-4 bg-gray-900/50">
                <p className="text-green-400">
                  [INFO] Vite + React + Tailwind CSS initialized
                </p>
                <p className="text-green-400">
                  [INFO] Cyberpunk theme loaded
                </p>
                <p className="text-green-400">
                  [INFO] Backend Go 1.24.6 ready
                </p>
              </div>

              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setCount((count) => count + 1)}
                  className="px-4 py-2 border border-white text-white bg-black hover:bg-white hover:text-black transition-colors font-mono"
                >
                  INCREMENT [{count}]
                </button>
                
                <div className="text-sm text-gray-400">
                  Click to test reactivity
                </div>
              </div>

              <div className="mt-8 grid grid-cols-3 gap-4 text-center">
                <div className="border border-white/20 p-4">
                  <div className="text-green-500 text-2xl font-bold">GitOps</div>
                  <div className="text-xs text-gray-400">ArgoCD-like</div>
                </div>
                <div className="border border-white/20 p-4">
                  <div className="text-green-500 text-2xl font-bold">Monitor</div>
                  <div className="text-xs text-gray-400">Grafana-like</div>
                </div>
                <div className="border border-white/20 p-4">
                  <div className="text-green-500 text-2xl font-bold">Logs</div>
                  <div className="text-xs text-gray-400">Loki-like</div>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="fixed bottom-0 left-0 right-0 border-t border-white/20 bg-black/90 p-2">
          <div className="flex justify-between items-center text-xs">
            <span>STATUS: <span className="text-green-500">READY</span></span>
            <span>CPU: 12% | MEM: 256MB | UPTIME: 00:01:23</span>
            <span className="cursor">READY_FOR_INPUT</span>
          </div>
        </footer>
      </div>
    </div>
  )
}

export default App
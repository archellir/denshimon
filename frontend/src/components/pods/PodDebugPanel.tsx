import { useState, useEffect } from 'react';
import type { FC } from 'react';
import { 
  Terminal as TerminalIcon, 
  Download, 
  Upload, 
  Play, 
  Square, 
  ExternalLink,
  FileText,
  Network,
  AlertTriangle
} from 'lucide-react';
import Terminal from '@components/common/Terminal';

interface Pod {
  name: string;
  namespace: string;
  status: string;
  containers: Container[];
  restarts: number;
  age: string;
  node?: string;
  ip?: string;
}

interface Container {
  name: string;
  image: string;
  ready: boolean;
  restartCount: number;
  state: string;
}

interface PortForward {
  id: string;
  localPort: number;
  remotePort: number;
  status: 'active' | 'starting' | 'failed';
  url?: string;
}

interface PodDebugPanelProps {
  pod: Pod;
  isOpen: boolean;
  onClose: () => void;
}

const PodDebugPanel: FC<PodDebugPanelProps> = ({ pod, isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'terminal' | 'logs' | 'files' | 'ports'>('terminal');
  const [selectedContainer, setSelectedContainer] = useState<string>('');
  const [portForwards, setPortForwards] = useState<PortForward[]>([]);
  const [logs, _setLogs] = useState<string>('');
  const [isFollowingLogs, setIsFollowingLogs] = useState(false);
  
  // Select first container by default
  useEffect(() => {
    if (pod.containers.length > 0 && !selectedContainer) {
      setSelectedContainer(pod.containers[0].name);
    }
  }, [pod.containers, selectedContainer]);


  const handlePortForward = (remotePort: number) => {
    // Generate local port (8000-9000 range)
    const localPort = 8000 + Math.floor(Math.random() * 1000);
    
    const newPortForward: PortForward = {
      id: `${pod.name}-${remotePort}-${Date.now()}`,
      localPort,
      remotePort,
      status: 'starting'
    };
    
    setPortForwards(prev => [...prev, newPortForward]);
    
    // Simulate port forward creation
    setTimeout(() => {
      setPortForwards(prev => 
        prev.map(pf => 
          pf.id === newPortForward.id 
            ? { ...pf, status: 'active' as const, url: `http://localhost:${localPort}` }
            : pf
        )
      );
    }, 2000);
  };

  const handleStopPortForward = (id: string) => {
    setPortForwards(prev => prev.filter(pf => pf.id !== id));
  };

  const handleDownloadLogs = () => {
    const blob = new Blob([logs], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${pod.name}-${selectedContainer}-logs.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    // TODO: Implement file upload to pod
    console.log('Uploading file to pod:', file.name);
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/80 flex items-center justify-center">
        <div className="bg-black border border-white w-[95vw] h-[90vh] max-w-7xl flex flex-col">
          {/* Header */}
          <div className="border-b border-white p-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-mono font-bold">POD DEBUG PANEL</h2>
                <div className="text-sm font-mono opacity-60 mt-1">
                  {pod.namespace}/{pod.name} • {pod.status} • {pod.containers.length} containers
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white hover:text-black transition-colors"
              >
                <Square size={20} />
              </button>
            </div>
          </div>

          <div className="flex flex-1 min-h-0">
            {/* Sidebar */}
            <div className="w-80 border-r border-white flex flex-col">
              {/* Container Selection */}
              <div className="p-4 border-b border-white/20">
                <label className="block text-xs font-mono mb-2 opacity-60">CONTAINER</label>
                <select
                  value={selectedContainer}
                  onChange={(e) => setSelectedContainer(e.target.value)}
                  className="w-full bg-black border border-white text-white p-2 font-mono text-sm focus:outline-none focus:border-green-400"
                >
                  {pod.containers.map(container => (
                    <option key={container.name} value={container.name}>
                      {container.name} ({container.state})
                    </option>
                  ))}
                </select>
              </div>

              {/* Quick Actions */}
              <div className="p-4 border-b border-white/20">
                <h3 className="text-sm font-mono mb-3 opacity-60">QUICK ACTIONS</h3>
                <div className="space-y-2">
                  <button
                    onClick={() => setActiveTab('terminal')}
                    className="w-full flex items-center space-x-2 px-3 py-2 border border-white hover:bg-white hover:text-black transition-colors font-mono text-sm"
                  >
                    <TerminalIcon size={16} />
                    <span>Open Terminal</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('logs')}
                    className="w-full flex items-center space-x-2 px-3 py-2 border border-white hover:bg-white hover:text-black transition-colors font-mono text-sm"
                  >
                    <FileText size={16} />
                    <span>View Logs</span>
                  </button>
                </div>
              </div>

              {/* Container Info */}
              <div className="p-4 border-b border-white/20">
                <h3 className="text-sm font-mono mb-3 opacity-60">CONTAINER INFO</h3>
                {selectedContainer && (
                  <div className="space-y-2 text-xs font-mono">
                    {(() => {
                      const container = pod.containers.find(c => c.name === selectedContainer);
                      return container ? (
                        <>
                          <div>
                            <span className="opacity-60">Image:</span>
                            <div className="break-all">{container.image}</div>
                          </div>
                          <div>
                            <span className="opacity-60">State:</span>
                            <span className={`ml-2 ${
                              container.ready ? 'text-green-400' : 'text-red-400'
                            }`}>
                              {container.state}
                            </span>
                          </div>
                          <div>
                            <span className="opacity-60">Restarts:</span>
                            <span className="ml-2">{container.restartCount}</span>
                          </div>
                        </>
                      ) : null;
                    })()}
                  </div>
                )}
              </div>

              {/* Port Forwards */}
              <div className="p-4 flex-1">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-mono opacity-60">PORT FORWARDS</h3>
                  <button
                    onClick={() => setActiveTab('ports')}
                    className="text-xs font-mono text-blue-400 hover:underline"
                  >
                    Manage
                  </button>
                </div>
                <div className="space-y-2">
                  {portForwards.map(pf => (
                    <div key={pf.id} className="flex items-center justify-between text-xs font-mono">
                      <div>
                        <span className="opacity-60">{pf.localPort}→{pf.remotePort}</span>
                        <span className={`ml-2 ${
                          pf.status === 'active' ? 'text-green-400' : 
                          pf.status === 'starting' ? 'text-yellow-400' : 'text-red-400'
                        }`}>
                          {pf.status}
                        </span>
                      </div>
                      {pf.status === 'active' && (
                        <button
                          onClick={() => window.open(pf.url, '_blank')}
                          className="p-1 hover:bg-white/10"
                        >
                          <ExternalLink size={12} />
                        </button>
                      )}
                    </div>
                  ))}
                  {portForwards.length === 0 && (
                    <div className="text-xs font-mono opacity-40">
                      No active port forwards
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col">
              {/* Tab Navigation */}
              <div className="border-b border-white/20">
                <div className="flex">
                  {[
                    { id: 'terminal', label: 'Terminal', icon: TerminalIcon },
                    { id: 'logs', label: 'Logs', icon: FileText },
                    { id: 'files', label: 'Files', icon: Upload },
                    { id: 'ports', label: 'Port Forward', icon: Network },
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`flex items-center space-x-2 px-4 py-3 border-r border-white/20 font-mono text-sm transition-colors ${
                        activeTab === tab.id 
                          ? 'bg-white text-black' 
                          : 'hover:bg-white/10'
                      }`}
                    >
                      <tab.icon size={16} />
                      <span>{tab.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Tab Content */}
              <div className="flex-1 p-4">
                {activeTab === 'terminal' && (
                  <div className="h-full flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-mono">TERMINAL</h3>
                      <div className="flex items-center space-x-2 text-xs font-mono opacity-60">
                        <span>Pod: {pod.name}</span>
                        <span>•</span>
                        <span>Shell: /bin/bash</span>
                      </div>
                    </div>
                    <div className="flex-1 border border-white bg-black">
                      <Terminal
                        isOpen={true}
                        onClose={() => {}} // No close functionality for embedded terminal
                        initialOptions={{
                          pod: pod.name,
                          namespace: pod.namespace,
                          container: pod.containers[0]?.name || 'main',
                          command: '/bin/bash'
                        }}
                      />
                    </div>
                  </div>
                )}

                {activeTab === 'logs' && (
                  <div className="h-full flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-mono">CONTAINER LOGS</h3>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setIsFollowingLogs(!isFollowingLogs)}
                          className={`flex items-center space-x-2 px-3 py-1 border font-mono text-xs transition-colors ${
                            isFollowingLogs 
                              ? 'border-green-400 text-green-400 bg-green-400/20' 
                              : 'border-white hover:bg-white hover:text-black'
                          }`}
                        >
                          <Play size={12} />
                          <span>{isFollowingLogs ? 'Following' : 'Follow'}</span>
                        </button>
                        <button
                          onClick={handleDownloadLogs}
                          className="flex items-center space-x-2 px-3 py-1 border border-white hover:bg-white hover:text-black transition-colors font-mono text-xs"
                        >
                          <Download size={12} />
                          <span>Download</span>
                        </button>
                      </div>
                    </div>
                    <div className="flex-1 border border-white p-3 bg-black text-green-400 font-mono text-xs overflow-auto">
                      <pre className="whitespace-pre-wrap">{logs || 'No logs available'}</pre>
                    </div>
                  </div>
                )}

                {activeTab === 'files' && (
                  <div className="h-full flex flex-col items-center justify-center space-y-4">
                    <Upload size={48} className="opacity-40" />
                    <div className="text-center">
                      <h3 className="font-mono text-lg mb-2">FILE TRANSFER</h3>
                      <p className="font-mono text-sm opacity-60 mb-4">
                        Upload and download files to/from the container
                      </p>
                      <div className="space-y-3">
                        <label className="flex items-center space-x-2 px-4 py-2 border border-white hover:bg-white hover:text-black transition-colors font-mono cursor-pointer">
                          <Upload size={16} />
                          <span>Upload File</span>
                          <input
                            type="file"
                            className="hidden"
                            onChange={handleFileUpload}
                          />
                        </label>
                        <button
                          className="flex items-center space-x-2 px-4 py-2 border border-white hover:bg-white hover:text-black transition-colors font-mono"
                        >
                          <Download size={16} />
                          <span>Browse & Download</span>
                        </button>
                      </div>
                    </div>
                    <div className="text-xs font-mono opacity-60 text-center">
                      <AlertTriangle size={12} className="inline mr-1" />
                      File transfer functionality is under development
                    </div>
                  </div>
                )}

                {activeTab === 'ports' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-mono">PORT FORWARDING</h3>
                    </div>
                    
                    <div className="space-y-3">
                      {[80, 443, 3000, 8000, 8080, 9000].map(port => (
                        <div key={port} className="flex items-center justify-between p-3 border border-white/20">
                          <div className="font-mono text-sm">
                            <span className="opacity-60">Container Port:</span>
                            <span className="ml-2">{port}</span>
                          </div>
                          <button
                            onClick={() => handlePortForward(port)}
                            className="flex items-center space-x-2 px-3 py-1 border border-white hover:bg-white hover:text-black transition-colors font-mono text-xs"
                          >
                            <Network size={12} />
                            <span>Forward</span>
                          </button>
                        </div>
                      ))}
                    </div>
                    
                    {portForwards.length > 0 && (
                      <div>
                        <h4 className="font-mono text-sm mb-3 opacity-60">ACTIVE FORWARDS</h4>
                        <div className="space-y-2">
                          {portForwards.map(pf => (
                            <div key={pf.id} className="flex items-center justify-between p-3 border border-white/20">
                              <div className="font-mono text-sm">
                                <span>localhost:{pf.localPort} → {pf.remotePort}</span>
                                <span className={`ml-3 text-xs ${
                                  pf.status === 'active' ? 'text-green-400' : 'text-yellow-400'
                                }`}>
                                  {pf.status}
                                </span>
                              </div>
                              <div className="flex space-x-2">
                                {pf.status === 'active' && pf.url && (
                                  <button
                                    onClick={() => window.open(pf.url, '_blank')}
                                    className="p-1 border border-blue-400 text-blue-400 hover:bg-blue-400 hover:text-black transition-colors"
                                  >
                                    <ExternalLink size={12} />
                                  </button>
                                )}
                                <button
                                  onClick={() => handleStopPortForward(pf.id)}
                                  className="p-1 border border-red-400 text-red-400 hover:bg-red-400 hover:text-black transition-colors"
                                >
                                  <Square size={12} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

    </>
  );
};

export default PodDebugPanel;
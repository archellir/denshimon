import { useState, useEffect, useRef, useCallback } from 'react';
import type { FC } from 'react';
import { Terminal as TerminalIcon, X, Maximize2, Minimize2, RefreshCw, Settings, Copy } from 'lucide-react';
import { useTerminal, TerminalOptions } from '@hooks/useTerminal';

interface TerminalProps {
  isOpen: boolean;
  onClose: () => void;
  initialOptions?: TerminalOptions;
  className?: string;
}

const Terminal: FC<TerminalProps> = ({ isOpen, onClose, initialOptions, className = '' }) => {
  const [isMaximized, setIsMaximized] = useState(false);
  const [fontSize, setFontSize] = useState(14);
  const [showSettings, setShowSettings] = useState(false);
  const [currentInput, setCurrentInput] = useState('');
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  
  const terminalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const {
    isConnected,
    isConnecting,
    output,
    error,
    connect,
    disconnect,
    sendInput,
    resize,
    clear
  } = useTerminal();

  // Auto-connect when opened with initial options
  useEffect(() => {
    if (isOpen && initialOptions && !isConnected && !isConnecting) {
      connect(initialOptions);
    }
  }, [isOpen, initialOptions, isConnected, isConnecting, connect]);

  // Auto-scroll to bottom when new output arrives
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [output]);

  // Handle terminal resize
  useEffect(() => {
    const handleResize = () => {
      if (terminalRef.current && isConnected) {
        const element = terminalRef.current;
        const rect = element.getBoundingClientRect();
        const charWidth = 8; // Approximate character width in monospace
        const lineHeight = fontSize + 2; // Font size + line spacing
        
        const cols = Math.floor(rect.width / charWidth);
        const rows = Math.floor(rect.height / lineHeight);
        
        resize(rows, cols);
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Initial resize

    return () => window.removeEventListener('resize', handleResize);
  }, [isConnected, fontSize, resize]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    switch (e.key) {
      case 'Enter':
        if (currentInput.trim()) {
          // Add to history
          setCommandHistory(prev => [...prev, currentInput]);
          setHistoryIndex(-1);
          
          // Send to terminal
          sendInput(currentInput + '\n');
          setCurrentInput('');
        }
        break;
        
      case 'ArrowUp':
        e.preventDefault();
        if (commandHistory.length > 0) {
          const newIndex = historyIndex === -1 
            ? commandHistory.length - 1 
            : Math.max(0, historyIndex - 1);
          setHistoryIndex(newIndex);
          setCurrentInput(commandHistory[newIndex]);
        }
        break;
        
      case 'ArrowDown':
        e.preventDefault();
        if (historyIndex >= 0) {
          const newIndex = historyIndex + 1;
          if (newIndex >= commandHistory.length) {
            setHistoryIndex(-1);
            setCurrentInput('');
          } else {
            setHistoryIndex(newIndex);
            setCurrentInput(commandHistory[newIndex]);
          }
        }
        break;
        
      case 'Tab':
        e.preventDefault();
        // TODO: Implement tab completion
        break;
        
      case 'c':
        if (e.ctrlKey) {
          e.preventDefault();
          sendInput('\x03'); // Ctrl+C
        }
        break;
        
      case 'd':
        if (e.ctrlKey) {
          e.preventDefault();
          sendInput('\x04'); // Ctrl+D
        }
        break;
    }
  }, [currentInput, commandHistory, historyIndex, sendInput]);

  const handleCopyOutput = useCallback(() => {
    if (output) {
      navigator.clipboard.writeText(output.replace(/\r/g, ''));
    }
  }, [output]);

  const getConnectionStatus = () => {
    if (isConnecting) return { text: 'Connecting...', color: 'text-yellow-400' };
    if (isConnected) return { text: 'Connected', color: 'text-green-400' };
    return { text: 'Disconnected', color: 'text-red-400' };
  };

  const status = getConnectionStatus();

  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 z-50 bg-black/80 flex items-center justify-center ${className}`}>
      <div className={`bg-black border-2 border-green-400 shadow-lg shadow-green-400/20 ${
        isMaximized 
          ? 'w-full h-full' 
          : 'w-[90vw] h-[80vh] max-w-6xl max-h-4xl'
      } flex flex-col`}>
        
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-green-400/50 bg-gray-900/50">
          <div className="flex items-center space-x-3">
            <TerminalIcon size={18} className="text-green-400" />
            <span className="font-mono text-green-400 text-sm">TERMINAL</span>
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'} animate-pulse`} />
              <span className={`text-xs font-mono ${status.color}`}>{status.text}</span>
            </div>
            {initialOptions && (
              <span className="text-xs font-mono text-gray-400">
                {initialOptions.namespace}/{initialOptions.pod}
                {initialOptions.container && `/${initialOptions.container}`}
              </span>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopyOutput}
              className="p-1 hover:bg-green-400/20 text-green-400 transition-colors"
              title="Copy Output"
            >
              <Copy size={16} />
            </button>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-1 hover:bg-green-400/20 text-green-400 transition-colors"
              title="Settings"
            >
              <Settings size={16} />
            </button>
            <button
              onClick={clear}
              className="p-1 hover:bg-green-400/20 text-green-400 transition-colors"
              title="Clear Terminal"
            >
              <RefreshCw size={16} />
            </button>
            <button
              onClick={() => setIsMaximized(!isMaximized)}
              className="p-1 hover:bg-green-400/20 text-green-400 transition-colors"
            >
              {isMaximized ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>
            <button
              onClick={onClose}
              className="p-1 hover:bg-red-400/20 text-red-400 transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div className="border-b border-green-400/50 bg-gray-900/30 p-3">
            <div className="flex items-center space-x-4">
              <label className="text-xs font-mono text-green-400">
                Font Size:
                <input
                  type="range"
                  min="10"
                  max="24"
                  value={fontSize}
                  onChange={(e) => setFontSize(parseInt(e.target.value))}
                  className="ml-2 w-20"
                />
                <span className="ml-2">{fontSize}px</span>
              </label>
            </div>
          </div>
        )}

        {/* Terminal Output */}
        <div 
          ref={terminalRef}
          className="flex-1 p-3 font-mono bg-black text-green-400 overflow-auto whitespace-pre-wrap break-words"
          style={{ fontSize: `${fontSize}px`, lineHeight: 1.2 }}
        >
          {error && (
            <div className="text-red-400 mb-2">
              ERROR: {error}
            </div>
          )}
          
          {!isConnected && !isConnecting && (
            <div className="text-yellow-400 mb-2">
              Terminal not connected. Use the debug panel to connect to a pod.
            </div>
          )}
          
          <div className="whitespace-pre-wrap">
            {output}
          </div>
        </div>

        {/* Input Line */}
        <div className="border-t border-green-400/50 p-3 bg-gray-900/20">
          <div className="flex items-center space-x-2">
            <span className="font-mono text-green-400 text-sm">$</span>
            <input
              ref={inputRef}
              type="text"
              value={currentInput}
              onChange={(e) => setCurrentInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={!isConnected}
              className="flex-1 bg-transparent border-none outline-none font-mono text-green-400 text-sm disabled:opacity-50"
              placeholder={isConnected ? "Type command..." : "Not connected"}
              autoComplete="off"
              spellCheck={false}
            />
            
            {isConnected && (
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => sendInput('\x03')}
                  className="px-2 py-1 text-xs font-mono border border-red-400/50 text-red-400 hover:bg-red-400/20 transition-colors"
                  title="Ctrl+C"
                >
                  ^C
                </button>
                <button
                  onClick={() => sendInput('\x04')}
                  className="px-2 py-1 text-xs font-mono border border-yellow-400/50 text-yellow-400 hover:bg-yellow-400/20 transition-colors"
                  title="Ctrl+D"
                >
                  ^D
                </button>
              </div>
            )}
          </div>
          
          <div className="text-xs font-mono text-gray-500 mt-1">
            {isConnected 
              ? "Press Enter to execute • ↑↓ for history • Tab for completion • Ctrl+C/D for signals"
              : "Connect to a pod to start using the terminal"
            }
          </div>
        </div>
      </div>
    </div>
  );
};

export default Terminal;
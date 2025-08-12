import { useState, useEffect, useRef, useCallback } from 'react';
import type { FC } from 'react';
import { RefreshCw, Copy, Settings } from 'lucide-react';
import { useTerminal, TerminalOptions } from '@hooks/useTerminal';

interface EmbeddedTerminalProps {
  options: TerminalOptions;
  className?: string;
}

const EmbeddedTerminal: FC<EmbeddedTerminalProps> = ({ options, className = '' }) => {
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
    sendInput,
    resize,
    clear
  } = useTerminal();

  // Auto-connect when options change
  useEffect(() => {
    if (options && !isConnected && !isConnecting) {
      connect(options);
    }
  }, [options, isConnected, isConnecting, connect]);

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

  return (
    <div className={`h-full flex flex-col bg-black ${className}`}>
      {/* Compact Status Bar */}
      <div className="flex items-center justify-between p-2 border-b border-white/20 bg-gray-900/20">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'} animate-pulse`} />
            <span className={`text-xs font-mono ${status.color}`}>{status.text}</span>
          </div>
          <span className="text-xs font-mono text-gray-400">
            {options.namespace}/{options.pod}/{options.container || 'default'}
          </span>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={handleCopyOutput}
            className="p-1 hover:bg-green-400/20 text-green-400 transition-colors"
            title="Copy Output"
          >
            <Copy size={12} />
          </button>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-1 hover:bg-green-400/20 text-green-400 transition-colors"
            title="Settings"
          >
            <Settings size={12} />
          </button>
          <button
            onClick={clear}
            className="p-1 hover:bg-green-400/20 text-green-400 transition-colors"
            title="Clear Terminal"
          >
            <RefreshCw size={12} />
          </button>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="border-b border-white bg-gray-900/30 p-3">
          <div className="flex items-center space-x-4">
            <label className="text-xs font-mono text-green-400">
              Font Size:
              <input
                type="range"
                min="10"
                max="20"
                value={fontSize}
                onChange={(e) => setFontSize(parseInt(e.target.value))}
                className="ml-2 w-16"
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
            Connecting to {options.pod}/{options.container || 'default'}...
          </div>
        )}
        
        <div className="whitespace-pre-wrap">
          {output}
        </div>
      </div>

      {/* Input Line */}
      <div className="border-t border-white p-3 bg-gray-900/20">
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
            placeholder={isConnected ? "Type command..." : "Connecting..."}
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
            ? "Press Enter to execute • ↑↓ for history • Ctrl+C/D for signals"
            : "Connecting to pod container..."
          }
        </div>
      </div>
    </div>
  );
};

export default EmbeddedTerminal;
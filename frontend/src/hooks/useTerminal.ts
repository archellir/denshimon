import { useState, useEffect, useRef, useCallback } from 'react';
import { TerminalMessageType, StorageKey } from '@constants';
import { TerminalData } from '@/types';

export interface TerminalMessage {
  type: TerminalMessageType;
  data: string | TerminalData | { rows: number; cols: number };
}

export interface TerminalOptions {
  namespace: string;
  pod: string;
  container?: string;
  command?: string;
}

export interface UseTerminalReturn {
  isConnected: boolean;
  isConnecting: boolean;
  output: string;
  error: string | null;
  connect: (options: TerminalOptions) => void;
  disconnect: () => void;
  sendInput: (input: string) => void;
  resize: (rows: number, cols: number) => void;
  clear: () => void;
}

export const useTerminal = (): UseTerminalReturn => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [output, setOutput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 3;

  const connect = useCallback((options: TerminalOptions) => {
    if (isConnecting || isConnected) {
      return;
    }

    setIsConnecting(true);
    setError(null);

    const token = localStorage.getItem(StorageKey.AUTH_TOKEN);
    if (!token) {
      setError('Authentication token not found');
      setIsConnecting(false);
      return;
    }

    // Build WebSocket URL
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const params = new URLSearchParams({
      namespace: options.namespace,
      pod: options.pod,
      ...(options.container && { container: options.container }),
      ...(options.command && { command: options.command }),
    });

    const wsUrl = `${protocol}//${host}/api/k8s/pods/exec?${params}`;

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        setIsConnecting(false);
        setError(null);
        reconnectAttempts.current = 0;
        
        // Send authentication
        ws.send(JSON.stringify({
          type: 'auth',
          data: { token }
        }));

        // Initialize terminal
        setOutput(prev => prev + `\r\n🔗 Connected to ${options.pod}/${options.container || 'default'}\r\n`);
      };

      ws.onmessage = (event) => {
        try {
          const message: TerminalMessage = JSON.parse(event.data);
          
          switch (message.type) {
            case TerminalMessageType.DATA:
              setOutput(prev => prev + message.data);
              break;
            case TerminalMessageType.ERROR:
              setError(message.data as string);
              break;
            default:
              console.warn('Unknown terminal message type:', message.type);
          }
        } catch (err) {
          console.error('Failed to parse terminal message:', err);
          setError('Failed to parse server message');
        }
      };

      ws.onclose = (event) => {
        setIsConnected(false);
        setIsConnecting(false);
        wsRef.current = null;

        if (event.code !== 1000 && reconnectAttempts.current < maxReconnectAttempts) {
          // Attempt to reconnect
          reconnectAttempts.current++;
          setOutput(prev => prev + `\r\n🔄 Connection lost. Reconnecting... (${reconnectAttempts.current}/${maxReconnectAttempts})\r\n`);
          
          setTimeout(() => {
            connect(options);
          }, 2000 * reconnectAttempts.current);
        } else {
          setOutput(prev => prev + '\r\n❌ Connection closed\r\n');
        }
      };

      ws.onerror = (event) => {
        console.error('WebSocket error:', event);
        setError('WebSocket connection error');
        setIsConnecting(false);
      };

    } catch (err) {
      console.error('Failed to create WebSocket connection:', err);
      setError('Failed to create terminal connection');
      setIsConnecting(false);
    }
  }, [isConnecting, isConnected]);

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close(1000, 'User disconnect');
      wsRef.current = null;
    }
    setIsConnected(false);
    setIsConnecting(false);
  }, []);

  const sendInput = useCallback((input: string) => {
    if (wsRef.current && isConnected) {
      const message: TerminalMessage = {
        type: TerminalMessageType.DATA,
        data: input
      };
      wsRef.current.send(JSON.stringify(message));
    }
  }, [isConnected]);

  const resize = useCallback((rows: number, cols: number) => {
    if (wsRef.current && isConnected) {
      const message: TerminalMessage = {
        type: TerminalMessageType.RESIZE,
        data: { rows, cols }
      };
      wsRef.current.send(JSON.stringify(message));
    }
  }, [isConnected]);

  const clear = useCallback(() => {
    setOutput('');
    setError(null);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  return {
    isConnected,
    isConnecting,
    output,
    error,
    connect,
    disconnect,
    sendInput,
    resize,
    clear,
  };
};
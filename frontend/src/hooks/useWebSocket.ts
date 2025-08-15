import { useEffect, useState, useCallback, useRef } from 'react';
import { getWebSocketInstance, WebSocketMessage } from '@services/websocket';
import { WebSocketEventType, WebSocketState } from '@constants';
import type { LogEntry } from '@/types/logs';

export interface UseWebSocketOptions {
  enabled?: boolean;
  immediate?: boolean;
}

export interface WebSocketConnectionState {
  state: WebSocketState;
  reconnectAttempts: number;
}

export function useWebSocket<T = Record<string, unknown>>(
  messageType: WebSocketEventType | 'connection',
  options: UseWebSocketOptions = {}
) {
  const { enabled = true, immediate = true } = options;
  
  const [data, setData] = useState<T | null>(null);
  const [connectionState, setConnectionState] = useState<WebSocketConnectionState>({
    state: WebSocketState.DISCONNECTED,
    reconnectAttempts: 0
  });
  const [error, setError] = useState<Error | null>(null);
  const subscriptionIdRef = useRef<string | null>(null);
  const wsRef = useRef(getWebSocketInstance());

  const handleMessage = useCallback((receivedData: Record<string, unknown>) => {
    if (messageType === 'connection') {
      setConnectionState(receivedData as unknown as WebSocketConnectionState);
    } else {
      setData(receivedData as unknown as T);
    }
    setError(null);
  }, [messageType]);

  const handleError = useCallback((err: unknown) => {
    setError(err instanceof Error ? err : new Error(String(err)));
  }, []);

  useEffect(() => {
    if (!enabled) return;

    try {
      const ws = wsRef.current;
      if (!ws) {
        throw new Error('WebSocket instance not available');
      }

      if (immediate) {
        subscriptionIdRef.current = ws.subscribe(messageType, handleMessage);
      }

      // Also subscribe to connection state changes if not already subscing to them
      if (messageType !== 'connection') {
        const connectionSubscriptionId = ws.subscribe('connection', (data) => setConnectionState(data as unknown as WebSocketConnectionState));
        
        return () => {
          if (subscriptionIdRef.current) {
            ws.unsubscribe(subscriptionIdRef.current);
          }
          ws.unsubscribe(connectionSubscriptionId);
        };
      }

      return () => {
        if (subscriptionIdRef.current) {
          ws.unsubscribe(subscriptionIdRef.current);
        }
      };
    } catch (err) {
      handleError(err);
    }
  }, [enabled, immediate, messageType, handleMessage, handleError]);

  const subscribe = useCallback(() => {
    if (subscriptionIdRef.current) return; // Already subscribed

    try {
      const ws = wsRef.current;
      subscriptionIdRef.current = ws.subscribe(messageType, handleMessage);
    } catch (err) {
      handleError(err);
    }
  }, [messageType, handleMessage, handleError]);

  const unsubscribe = useCallback(() => {
    if (!subscriptionIdRef.current) return;

    try {
      const ws = wsRef.current;
      ws.unsubscribe(subscriptionIdRef.current);
      subscriptionIdRef.current = null;
    } catch (err) {
      handleError(err);
    }
  }, [handleError]);

  const send = useCallback((messageData: Record<string, unknown>) => {
    try {
      const ws = wsRef.current;
      ws.send({
        type: messageType as WebSocketMessage['type'],
        data: messageData
      });
    } catch (err) {
      handleError(err);
    }
  }, [messageType, handleError]);

  const isConnected = connectionState.state === WebSocketState.CONNECTED;
  const isConnecting = connectionState.state === WebSocketState.CONNECTING;
  const isError = connectionState.state === WebSocketState.ERROR;

  return {
    data,
    connectionState,
    error,
    isConnected,
    isConnecting,
    isError,
    subscribe,
    unsubscribe,
    send
  };
}

// Specialized hooks for common use cases
export function useMetricsWebSocket(options?: UseWebSocketOptions) {
  return useWebSocket(WebSocketEventType.METRICS, options);
}

export function useLogsWebSocket(options?: UseWebSocketOptions) {
  return useWebSocket<LogEntry>(WebSocketEventType.LOGS, options);
}

export function useEventsWebSocket(options?: UseWebSocketOptions) {
  return useWebSocket(WebSocketEventType.EVENTS, options);
}

export function useWorkflowsWebSocket(options?: UseWebSocketOptions) {
  return useWebSocket(WebSocketEventType.WORKFLOWS, options);
}

export function usePodsWebSocket(options?: UseWebSocketOptions) {
  return useWebSocket(WebSocketEventType.PODS, options);
}

export function useDeploymentsWebSocket(options?: UseWebSocketOptions) {
  return useWebSocket(WebSocketEventType.DEPLOYMENTS, options);
}

export function useAlertsWebSocket(options?: UseWebSocketOptions) {
  return useWebSocket(WebSocketEventType.ALERTS, options);
}

export function useConnectionState() {
  return useWebSocket('connection');
}

// Batch subscription hook for multiple message types
export function useMultipleWebSocket(messageTypes: WebSocketMessage['type'][]) {
  const [data, setData] = useState<Record<string, Record<string, unknown>>>({});
  const [connectionState, setConnectionState] = useState<WebSocketConnectionState>({
    state: WebSocketState.DISCONNECTED,
    reconnectAttempts: 0
  });
  const subscriptionIdsRef = useRef<string[]>([]);
  const wsRef = useRef(getWebSocketInstance());

  useEffect(() => {
    const ws = wsRef.current;
    if (!ws) return;

    // Subscribe to all message types
    messageTypes.forEach(messageType => {
      const subscriptionId = ws.subscribe(messageType, (receivedData) => {
        setData(prev => ({
          ...prev,
          [messageType]: receivedData
        }));
      });
      subscriptionIdsRef.current.push(subscriptionId);
    });

    // Subscribe to connection state
    const connectionSubscriptionId = ws.subscribe('connection', (data) => setConnectionState(data as unknown as WebSocketConnectionState));
    subscriptionIdsRef.current.push(connectionSubscriptionId);

    return () => {
      subscriptionIdsRef.current.forEach(id => {
        ws.unsubscribe(id);
      });
      subscriptionIdsRef.current = [];
    };
  }, [messageTypes]);

  return {
    data,
    connectionState,
    isConnected: connectionState.state === WebSocketState.CONNECTED
  };
}
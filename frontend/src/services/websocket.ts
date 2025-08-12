export interface WebSocketMessage {
  type: 'metrics' | 'logs' | 'events' | 'workflows' | 'pods' | 'deployments' | 'alerts' | 'heartbeat' | 'connection';
  timestamp: string;
  data: any;
}

export interface WebSocketOptions {
  url: string;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  debug?: boolean;
}

export interface WebSocketSubscription {
  id: string;
  type: WebSocketMessage['type'];
  callback: (data: any) => void;
}

export class DenshimonWebSocket {
  private ws: WebSocket | null = null;
  private options: Required<WebSocketOptions>;
  private subscriptions: Map<string, WebSocketSubscription> = new Map();
  private reconnectAttempts = 0;
  private isReconnecting = false;
  private connectionState: 'connecting' | 'connected' | 'disconnected' | 'error' = 'disconnected';
  private heartbeatInterval: number | null = null;
  private lastHeartbeat = 0;

  constructor(options: WebSocketOptions) {
    this.options = {
      reconnectInterval: 3000,
      maxReconnectAttempts: 10,
      debug: false,
      ...options
    };

    // In development, use mock WebSocket
    if (process.env.NODE_ENV === 'development') {
      this.startMockWebSocket();
    } else {
      this.connect();
    }
  }

  private connect(): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) return;

    this.connectionState = 'connecting';
    this.log('Connecting to WebSocket:', this.options.url);

    try {
      this.ws = new WebSocket(this.options.url);
      this.setupEventListeners();
    } catch (error) {
      this.log('WebSocket connection error:', error);
      this.connectionState = 'error';
      this.scheduleReconnect();
    }
  }

  private setupEventListeners(): void {
    if (!this.ws) return;

    this.ws.onopen = () => {
      this.log('WebSocket connected');
      this.connectionState = 'connected';
      this.reconnectAttempts = 0;
      this.isReconnecting = false;
      this.startHeartbeat();
      this.notifyConnectionStateChange();
    };

    this.ws.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        this.handleMessage(message);
      } catch (error) {
        this.log('Error parsing WebSocket message:', error);
      }
    };

    this.ws.onclose = (event) => {
      this.log('WebSocket closed:', event.code, event.reason);
      this.connectionState = 'disconnected';
      this.stopHeartbeat();
      this.notifyConnectionStateChange();
      
      if (!event.wasClean && this.reconnectAttempts < this.options.maxReconnectAttempts) {
        this.scheduleReconnect();
      }
    };

    this.ws.onerror = (error) => {
      this.log('WebSocket error:', error);
      this.connectionState = 'error';
      this.notifyConnectionStateChange();
    };
  }

  private handleMessage(message: WebSocketMessage): void {
    this.log('Received message:', message.type, message.data);

    // Update last heartbeat time
    if (message.type === 'heartbeat' || message.data?.heartbeat) {
      this.lastHeartbeat = Date.now();
      return;
    }

    // Notify subscribers
    this.subscriptions.forEach((subscription) => {
      if (subscription.type === message.type) {
        try {
          subscription.callback(message.data);
        } catch (error) {
          this.log('Error in subscription callback:', error);
        }
      }
    });
  }

  private scheduleReconnect(): void {
    if (this.isReconnecting) return;

    this.isReconnecting = true;
    this.reconnectAttempts++;

    const delay = this.options.reconnectInterval * Math.pow(1.5, this.reconnectAttempts - 1);
    this.log(`Scheduling reconnect attempt ${this.reconnectAttempts} in ${delay}ms`);

    setTimeout(() => {
      if (this.reconnectAttempts <= this.options.maxReconnectAttempts) {
        this.connect();
      } else {
        this.log('Max reconnect attempts reached');
        this.isReconnecting = false;
      }
    }, delay);
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'ping', timestamp: Date.now() }));
        
        // Check if we missed heartbeats (connection might be dead)
        if (Date.now() - this.lastHeartbeat > 30000) {
          this.log('Heartbeat timeout, reconnecting');
          this.ws.close();
        }
      }
    }, 10000) as unknown as number; // Send ping every 10 seconds
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  private notifyConnectionStateChange(): void {
    // Notify all subscribers about connection state changes
    this.subscriptions.forEach((subscription) => {
      if (subscription.type === 'connection') {
        subscription.callback({
          state: this.connectionState,
          reconnectAttempts: this.reconnectAttempts
        });
      }
    });
  }

  public subscribe(type: WebSocketMessage['type'] | 'connection', callback: (data: any) => void): string {
    const id = `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    this.subscriptions.set(id, {
      id,
      type: type as WebSocketMessage['type'],
      callback
    });

    this.log('Added subscription:', id, type);
    return id;
  }

  public unsubscribe(id: string): void {
    this.subscriptions.delete(id);
    this.log('Removed subscription:', id);
  }

  public send(message: Partial<WebSocketMessage>): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const fullMessage: WebSocketMessage = {
        type: 'metrics',
        timestamp: new Date().toISOString(),
        ...message
      } as WebSocketMessage;

      this.ws.send(JSON.stringify(fullMessage));
    } else {
      this.log('Cannot send message, WebSocket not connected');
    }
  }

  public getConnectionState(): string {
    return this.connectionState;
  }

  public disconnect(): void {
    this.stopHeartbeat();
    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }
    this.subscriptions.clear();
    this.connectionState = 'disconnected';
  }

  private log(...args: any[]): void {
    if (this.options.debug) {
      console.log('[DenshimonWS]', ...args);
    }
  }

  // Mock WebSocket for development
  private startMockWebSocket(): void {
    this.log('Starting mock WebSocket for development');
    this.connectionState = 'connected';
    this.notifyConnectionStateChange();

    // Simulate real-time data updates
    const mockData = {
      metrics: () => ({
        cpu_usage: { usage_percent: Math.random() * 100 },
        memory_usage: { usage_percent: Math.random() * 100 },
        ready_nodes: 3 + Math.floor(Math.random() * 2),
        total_nodes: 5,
        running_pods: 45 + Math.floor(Math.random() * 10),
        total_pods: 60,
        timestamp: new Date().toISOString()
      }),
      
      logs: () => ({
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        level: ['info', 'warn', 'error', 'debug'][Math.floor(Math.random() * 4)],
        source: ['kubernetes-api', 'nginx-ingress', 'application'][Math.floor(Math.random() * 3)],
        message: [
          'Request processed successfully',
          'Database connection established',
          'Configuration reloaded',
          'Health check passed',
          'Authentication successful'
        ][Math.floor(Math.random() * 5)],
        metadata: {
          namespace: ['production', 'staging', 'default'][Math.floor(Math.random() * 3)]
        }
      }),

      workflows: () => ({
        id: `workflow-${Date.now()}`,
        name: ['CI/CD Pipeline', 'Security Scan', 'Deploy to Production'][Math.floor(Math.random() * 3)],
        status: ['in_progress', 'completed', 'failed', 'queued'][Math.floor(Math.random() * 4)],
        conclusion: ['success', 'failure', 'neutral'][Math.floor(Math.random() * 3)],
        repository: 'company/web-frontend',
        branch: 'main',
        run_number: Math.floor(Math.random() * 100) + 1,
        timestamp: new Date().toISOString()
      }),

      events: () => ({
        id: Date.now().toString(),
        type: 'Normal',
        reason: ['Created', 'Started', 'Pulled', 'Scheduled'][Math.floor(Math.random() * 4)],
        object: 'Pod',
        message: 'Successfully assigned pod to node',
        timestamp: new Date().toISOString(),
        namespace: 'production'
      }),

      alerts: () => ({
        id: Date.now().toString(),
        severity: ['critical', 'warning', 'info'][Math.floor(Math.random() * 3)],
        title: 'High CPU usage detected',
        description: 'CPU usage has exceeded 80% for the last 5 minutes',
        source: 'prometheus',
        timestamp: new Date().toISOString(),
        resolved: false
      })
    };

    // Send mock data at different intervals
    Object.entries(mockData).forEach(([type, generator]) => {
      const interval = {
        metrics: 2000,  // Every 2 seconds
        logs: 1000,     // Every 1 second  
        workflows: 5000, // Every 5 seconds
        events: 3000,   // Every 3 seconds
        alerts: 10000   // Every 10 seconds
      }[type] || 5000;

      setInterval(() => {
        const message: WebSocketMessage = {
          type: type as WebSocketMessage['type'],
          timestamp: new Date().toISOString(),
          data: generator()
        };
        
        // Small delay to simulate network latency
        setTimeout(() => {
          this.handleMessage(message);
        }, Math.random() * 100);
      }, interval + Math.random() * 1000); // Add some jitter
    });

    // Simulate connection issues occasionally in development
    if (Math.random() < 0.1) { // 10% chance
      setTimeout(() => {
        this.log('Simulating connection issue');
        this.connectionState = 'disconnected';
        this.notifyConnectionStateChange();
        
        setTimeout(() => {
          this.connectionState = 'connected';
          this.notifyConnectionStateChange();
        }, 2000);
      }, 30000 + Math.random() * 30000);
    }
  }
}

// Singleton instance
let wsInstance: DenshimonWebSocket | null = null;

export const getWebSocketInstance = (options?: WebSocketOptions): DenshimonWebSocket => {
  if (!wsInstance && options) {
    wsInstance = new DenshimonWebSocket(options);
  }
  return wsInstance!;
};

export const initializeWebSocket = (url: string): DenshimonWebSocket => {
  if (wsInstance) {
    wsInstance.disconnect();
  }
  
  wsInstance = new DenshimonWebSocket({
    url,
    debug: process.env.NODE_ENV === 'development'
  });
  
  return wsInstance;
};
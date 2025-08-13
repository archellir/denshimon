import { WebSocketEventType, ServiceStatus, CircuitBreakerStatus, SERVICE_IDS } from '@/constants';

export interface WebSocketMessage {
  type: WebSocketEventType;
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
  type: WebSocketEventType;
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

    try {
      this.ws = new WebSocket(this.options.url);
      this.setupEventListeners();
    } catch (error) {
      this.connectionState = 'error';
      this.scheduleReconnect();
    }
  }

  private setupEventListeners(): void {
    if (!this.ws) return;

    this.ws.onopen = () => {
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
      }
    };

    this.ws.onclose = (event) => {
      this.connectionState = 'disconnected';
      this.stopHeartbeat();
      this.notifyConnectionStateChange();
      
      if (!event.wasClean && this.reconnectAttempts < this.options.maxReconnectAttempts) {
        this.scheduleReconnect();
      }
    };

    this.ws.onerror = () => {
      this.connectionState = 'error';
      this.notifyConnectionStateChange();
    };
  }

  private handleMessage(message: WebSocketMessage): void {

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
        }
      }
    });
  }

  private scheduleReconnect(): void {
    if (this.isReconnecting) return;

    this.isReconnecting = true;
    this.reconnectAttempts++;

    const delay = this.options.reconnectInterval * Math.pow(1.5, this.reconnectAttempts - 1);

    setTimeout(() => {
      if (this.reconnectAttempts <= this.options.maxReconnectAttempts) {
        this.connect();
      } else {
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

    return id;
  }

  public unsubscribe(id: string): void {
    this.subscriptions.delete(id);
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


  // Mock WebSocket for development
  private async startMockWebSocket(): Promise<void> {
    this.connectionState = 'connected';
    this.notifyConnectionStateChange();

    // Import master data for consistent mock data
    const { 
      MASTER_PODS, 
      MASTER_NODES,
      MASTER_DEPLOYMENTS
    } = await import('@mocks/masterData');
    
    // Import webhook mock generators
    const { 
      generateMockPipelineUpdate,
      generateMockGitHubWebhook,
      generateMockGiteaWebhook
    } = await import('@mocks/webhooks/pipelineUpdates');

    // Store base values for consistent incremental updates
    let baseCpu = 45 + Math.random() * 20;
    let baseMemory = 55 + Math.random() * 15;
    let basePods: number = MASTER_PODS.length;

    // Simulate real-time data updates
    const mockData = {
      metrics: () => {
        // Create realistic fluctuations
        baseCpu += (Math.random() - 0.5) * 5;
        baseCpu = Math.max(20, Math.min(90, baseCpu));
        
        baseMemory += (Math.random() - 0.5) * 3;
        baseMemory = Math.max(30, Math.min(85, baseMemory));
        
        basePods += Math.floor((Math.random() - 0.5) * 3);
        basePods = Math.max(40, Math.min(60, basePods));

        return {
          cluster: {
            cpu_usage: { 
              usage_percent: baseCpu,
              used: baseCpu * 10,
              total: 1000,
              available: 1000 - (baseCpu * 10)
            },
            memory_usage: { 
              usage_percent: baseMemory,
              used: baseMemory * 100 * 1024 * 1024,
              total: 10000 * 1024 * 1024,
              available: (10000 - baseMemory * 100) * 1024 * 1024
            },
            storage_usage: {
              usage_percent: 65 + Math.random() * 5,
              used: 650 * 1024 * 1024 * 1024,
              total: 1000 * 1024 * 1024 * 1024,
              available: 350 * 1024 * 1024 * 1024
            },
            ready_nodes: MASTER_NODES.length - 1, // One node might be not ready
            total_nodes: MASTER_NODES.length,
            running_pods: basePods,
            total_pods: MASTER_PODS.length,
            timestamp: new Date().toISOString()
          }
        };
      },
      
      logs: () => {
        const randomPod = MASTER_PODS[Math.floor(Math.random() * MASTER_PODS.length)];
        const logMessages = [
          'Request processed successfully',
          'Database connection established',
          'Configuration reloaded',
          'Health check passed',
          'Authentication successful',
          'Cache invalidated',
          'Metrics collected',
          'Backup completed'
        ];
        
        return {
          id: Date.now().toString(),
          timestamp: new Date().toISOString(),
          level: ['info', 'warn', 'error', 'debug'][Math.floor(Math.random() * 4)],
          source: randomPod.name,
          namespace: randomPod.namespace,
          message: logMessages[Math.floor(Math.random() * logMessages.length)],
          metadata: {
            pod: randomPod.name,
            namespace: randomPod.namespace,
            node: randomPod.node
          }
        };
      },

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

      alerts: () => {
        const randomPod = MASTER_PODS[Math.floor(Math.random() * MASTER_PODS.length)];
        const alertTypes = [
          { title: 'High CPU usage detected', description: `Pod ${randomPod.name} CPU usage exceeded 80%` },
          { title: 'Memory pressure', description: `Node ${randomPod.node} memory usage above threshold` },
          { title: 'Pod restart detected', description: `Pod ${randomPod.name} restarted 3 times` },
          { title: 'Service unavailable', description: `Service endpoints not responding` }
        ];
        const alert = alertTypes[Math.floor(Math.random() * alertTypes.length)];
        
        return {
          id: Date.now().toString(),
          severity: ['critical', 'warning', 'info'][Math.floor(Math.random() * 3)],
          title: alert.title,
          description: alert.description,
          source: 'prometheus',
          namespace: randomPod.namespace,
          timestamp: new Date().toISOString(),
          resolved: false
        };
      },

      pods: () => {
        const randomPod = MASTER_PODS[Math.floor(Math.random() * MASTER_PODS.length)];
        const statuses = ['Running', 'Pending', 'Failed', 'Succeeded', 'Terminating'];
        const newStatus = Math.random() > 0.8 ? statuses[Math.floor(Math.random() * statuses.length)] : 'Running';
        
        return {
          action: 'update',
          pod: {
            name: randomPod.name,
            namespace: randomPod.namespace,
            node: randomPod.node,
            status: newStatus,
            cpu: Math.floor(Math.random() * 100) + 'Mi',
            memory: Math.floor(Math.random() * 512) + 'Mi',
            restarts: Math.floor(Math.random() * 3),
            age: `${Math.floor(Math.random() * 7) + 1}d`,
            ready: newStatus === 'Running' ? '1/1' : '0/1'
          }
        };
      },

      deployments: () => {
        const randomDeployment = MASTER_DEPLOYMENTS[Math.floor(Math.random() * MASTER_DEPLOYMENTS.length)];
        return {
          name: randomDeployment.name,
          namespace: randomDeployment.namespace,
          replicas: {
            desired: 3,
            current: 3,
            ready: Math.floor(Math.random() * 4),
            available: Math.floor(Math.random() * 4)
          },
          conditions: [
            { type: 'Available', status: 'True' },
            { type: 'Progressing', status: Math.random() > 0.2 ? 'True' : 'False' }
          ],
          timestamp: new Date().toISOString()
        };
      },

      services: () => {
        const serviceId = SERVICE_IDS[Math.floor(Math.random() * SERVICE_IDS.length)];
        const statuses = Object.values(ServiceStatus);
        const cbStatuses = Object.values(CircuitBreakerStatus);
        
        return {
          serviceId,
          status: Math.random() > 0.8 ? statuses[Math.floor(Math.random() * statuses.length)] : ServiceStatus.HEALTHY,
          metrics: {
            requestRate: Math.max(10, Math.floor(Math.random() * 500)),
            errorRate: Math.random() * 5,
            latency: {
              p95: Math.max(20, Math.floor(Math.random() * 200))
            }
          },
          circuitBreakerStatus: Math.random() > 0.9 ? cbStatuses[Math.floor(Math.random() * cbStatuses.length)] : CircuitBreakerStatus.CLOSED,
          lastTripped: Math.random() > 0.95 ? new Date().toISOString() : null,
          timestamp: new Date().toISOString()
        };
      },

      // GitOps Webhook events
      pipeline_update: () => generateMockPipelineUpdate(),
      gitea_webhook: () => generateMockGiteaWebhook(),
      github_webhook: () => generateMockGitHubWebhook()
    };

    // Send mock data at different intervals
    Object.entries(mockData).forEach(([type, generator]) => {
      const interval = {
        metrics: 2000,        // Every 2 seconds
        logs: 500,            // Every 0.5 seconds for real-time feel
        workflows: 5000,      // Every 5 seconds
        events: 3000,         // Every 3 seconds
        alerts: 10000,        // Every 10 seconds
        pods: 4000,           // Every 4 seconds
        deployments: 8000,    // Every 8 seconds
        services: 6000,       // Every 6 seconds
        pipeline_update: 15000, // Every 15 seconds for pipeline updates
        gitea_webhook: 20000,   // Every 20 seconds for Gitea webhooks
        github_webhook: 30000   // Every 30 seconds for GitHub webhooks
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
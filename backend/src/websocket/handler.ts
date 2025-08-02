import type { WSContext } from 'hono/ws'
import { k8sClient } from '@/lib/kubernetes'
import { config } from '@/config/config'

interface WebSocketMessage {
  type: string
  data?: any
}

interface ConnectedClient {
  ws: WSContext
  subscriptions: Set<string>
}

class WebSocketManager {
  private clients = new Map<string, ConnectedClient>()
  private updateInterval: NodeJS.Timeout | null = null

  addClient(clientId: string, ws: WSContext) {
    this.clients.set(clientId, {
      ws,
      subscriptions: new Set()
    })

    console.log(`Client ${clientId} connected. Total clients: ${this.clients.size}`)

    // Start periodic updates if this is the first client
    if (this.clients.size === 1) {
      this.startPeriodicUpdates()
    }
  }

  removeClient(clientId: string) {
    this.clients.delete(clientId)
    console.log(`Client ${clientId} disconnected. Total clients: ${this.clients.size}`)

    // Stop periodic updates if no clients remain
    if (this.clients.size === 0) {
      this.stopPeriodicUpdates()
    }
  }

  subscribe(clientId: string, subscription: string) {
    const client = this.clients.get(clientId)
    if (client) {
      client.subscriptions.add(subscription)
      console.log(`Client ${clientId} subscribed to ${subscription}`)
    }
  }

  unsubscribe(clientId: string, subscription: string) {
    const client = this.clients.get(clientId)
    if (client) {
      client.subscriptions.delete(subscription)
      console.log(`Client ${clientId} unsubscribed from ${subscription}`)
    }
  }

  broadcast(message: WebSocketMessage, subscription?: string) {
    this.clients.forEach((client, clientId) => {
      try {
        // Send to all clients if no subscription filter, or if client is subscribed
        if (!subscription || client.subscriptions.has(subscription)) {
          client.ws.send(JSON.stringify(message))
        }
      } catch (error) {
        console.error(`Failed to send message to client ${clientId}:`, error)
        this.removeClient(clientId)
      }
    })
  }

  private startPeriodicUpdates() {
    console.log('Starting periodic Kubernetes updates')
    
    this.updateInterval = setInterval(async () => {
      try {
        await this.sendClusterUpdates()
      } catch (error) {
        console.error('Error sending cluster updates:', error)
      }
    }, 10000) // Update every 10 seconds
  }

  private stopPeriodicUpdates() {
    if (this.updateInterval) {
      console.log('Stopping periodic Kubernetes updates')
      clearInterval(this.updateInterval)
      this.updateInterval = null
    }
  }

  private async sendClusterUpdates() {
    try {
      // Get cluster status
      const [pods, services, deployments, statefulsets] = await Promise.all([
        k8sClient.getPods().catch(() => []),
        k8sClient.getServices().catch(() => []),
        k8sClient.getDeployments().catch(() => []),
        k8sClient.getStatefulSets().catch(() => [])
      ])

      // Send cluster overview
      this.broadcast({
        type: 'cluster_update',
        data: {
          timestamp: new Date().toISOString(),
          summary: {
            pods: pods.length,
            services: services.length,
            deployments: deployments.length,
            statefulsets: statefulsets.length
          }
        }
      }, 'cluster')

      // Send infrastructure services status
      const infraServices = Object.entries(config.INFRASTRUCTURE_SERVICES).map(([key, serviceConfig]) => {
        const relatedPods = pods.filter(pod => 
          pod.metadata?.labels?.app === serviceConfig.name
        )
        
        const relatedDeployment = deployments.find(dep => 
          dep.metadata?.name === serviceConfig.name
        )
        
        const relatedStatefulSet = statefulsets.find(sts => 
          sts.metadata?.name === serviceConfig.name
        )

        let status = 'unknown'
        let replicas = { ready: 0, desired: 0 }
        
        if (relatedDeployment) {
          replicas.desired = relatedDeployment.spec?.replicas || 0
          replicas.ready = relatedDeployment.status?.readyReplicas || 0
          status = replicas.ready === replicas.desired && replicas.desired > 0 ? 'running' : 'degraded'
        } else if (relatedStatefulSet) {
          replicas.desired = relatedStatefulSet.spec?.replicas || 0
          replicas.ready = relatedStatefulSet.status?.readyReplicas || 0
          status = replicas.ready === replicas.desired && replicas.desired > 0 ? 'running' : 'degraded'
        }

        return {
          id: key,
          name: serviceConfig.name,
          status,
          replicas,
          pods: relatedPods.length
        }
      })

      this.broadcast({
        type: 'infrastructure_update',
        data: {
          timestamp: new Date().toISOString(),
          services: infraServices
        }
      }, 'infrastructure')

    } catch (error) {
      console.error('Failed to get cluster updates:', error)
    }
  }
}

const wsManager = new WebSocketManager()

export const websocketHandler = (ws: WSContext) => {
  const clientId = Math.random().toString(36).substring(2, 15)
  
  ws.onopen = () => {
    wsManager.addClient(clientId, ws)
    
    // Send initial connection message
    ws.send(JSON.stringify({
      type: 'connection',
      data: { clientId, message: 'Connected to K8s WebUI' }
    }))
  }

  ws.onmessage = (event) => {
    try {
      const message: WebSocketMessage = JSON.parse(event.data.toString())
      
      switch (message.type) {
        case 'subscribe':
          if (message.data?.subscription) {
            wsManager.subscribe(clientId, message.data.subscription)
          }
          break
          
        case 'unsubscribe':
          if (message.data?.subscription) {
            wsManager.unsubscribe(clientId, message.data.subscription)
          }
          break
          
        case 'ping':
          ws.send(JSON.stringify({ type: 'pong', data: { timestamp: new Date().toISOString() } }))
          break
          
        default:
          console.log(`Unknown message type: ${message.type}`)
      }
    } catch (error) {
      console.error('Error handling WebSocket message:', error)
    }
  }

  ws.onclose = () => {
    wsManager.removeClient(clientId)
  }

  ws.onerror = (error) => {
    console.error(`WebSocket error for client ${clientId}:`, error)
    wsManager.removeClient(clientId)
  }
}
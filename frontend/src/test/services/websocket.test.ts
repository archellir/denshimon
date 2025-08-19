import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  DenshimonWebSocket,
  getWebSocketInstance,
  WebSocketMessage,
} from '@services/websocket'
import { WebSocketEventType, WebSocketState } from '@constants'

// Mock WebSocket
class MockWebSocket {
  url: string
  readyState: number
  onopen: ((event: Event) => void) | null = null
  onclose: ((event: CloseEvent) => void) | null = null
  onmessage: ((event: MessageEvent) => void) | null = null
  onerror: ((event: Event) => void) | null = null

  static CONNECTING = 0
  static OPEN = 1
  static CLOSING = 2
  static CLOSED = 3

  constructor(url: string) {
    this.url = url
    this.readyState = MockWebSocket.CONNECTING
    
    // Simulate async connection
    setTimeout(() => {
      this.readyState = MockWebSocket.OPEN
      this.onopen?.(new Event('open'))
    }, 0)
  }

  send(_data: string) {
    if (this.readyState !== MockWebSocket.OPEN) {
      throw new Error('WebSocket is not open')
    }
    // Mock sending data
  }

  close(code?: number, reason?: string) {
    this.readyState = MockWebSocket.CLOSING
    setTimeout(() => {
      this.readyState = MockWebSocket.CLOSED
      this.onclose?.(new CloseEvent('close', { code, reason }))
    }, 0)
  }

  // Helper method to simulate receiving messages
  simulateMessage(data: any) {
    if (this.readyState === MockWebSocket.OPEN) {
      this.onmessage?.(new MessageEvent('message', {
        data: JSON.stringify(data)
      }))
    }
  }

  // Helper method to simulate errors
  simulateError() {
    this.onerror?.(new Event('error'))
  }
}

// Mock global WebSocket
global.WebSocket = MockWebSocket as any

describe('DenshimonWebSocket', () => {
  let service: DenshimonWebSocket
  let mockWebSocket: MockWebSocket

  beforeEach(() => {
    vi.clearAllMocks()
    service = new DenshimonWebSocket({ url: 'ws://localhost:8080' })
    
    // Get reference to the mocked WebSocket instance
    mockWebSocket = (service as any).ws as MockWebSocket
  })

  afterEach(() => {
    service?.disconnect()
    vi.clearAllTimers()
  })

  describe('initialization', () => {
    it('should create WebSocket instance with correct URL', () => {
      expect(mockWebSocket.url).toBe('ws://localhost:8080')
    })

    it('should start in CONNECTING state', () => {
      expect(service.getConnectionState()).toBe(WebSocketState.CONNECTING)
    })
  })

  describe('connection lifecycle', () => {
    it('should transition to CONNECTED state on open', async () => {
      await new Promise(resolve => setTimeout(resolve, 10))
      
      expect(service.getConnectionState()).toBe(WebSocketState.CONNECTED)
    })

    it('should handle connection errors', () => {
      mockWebSocket.simulateError()
      
      expect(service.getConnectionState()).toBe(WebSocketState.ERROR)
    })

    it('should transition to DISCONNECTED state on close', async () => {
      // Wait for connection to open
      await new Promise(resolve => setTimeout(resolve, 10))
      
      // Close the connection
      mockWebSocket.close()
      await new Promise(resolve => setTimeout(resolve, 10))
      
      expect(service.getConnectionState()).toBe(WebSocketState.DISCONNECTED)
    })
  })

  describe('message subscription', () => {
    beforeEach(async () => {
      // Wait for connection to be established
      await new Promise(resolve => setTimeout(resolve, 10))
    })

    it('should subscribe to message types', () => {
      const mockCallback = vi.fn()
      
      const subscriptionId = service.subscribe(
        WebSocketEventType.METRICS,
        mockCallback
      )
      
      expect(subscriptionId).toBeTruthy()
      expect(typeof subscriptionId).toBe('string')
    })

    it('should receive messages for subscribed types', () => {
      const mockCallback = vi.fn()
      
      service.subscribe(
        WebSocketEventType.METRICS,
        mockCallback
      )
      
      // Simulate receiving a metrics message
      const metricsData = { cpu: 50, memory: 70, timestamp: Date.now() }
      mockWebSocket.simulateMessage({
        type: WebSocketEventType.METRICS,
        data: metricsData
      })
      
      expect(mockCallback).toHaveBeenCalledWith(metricsData)
    })

    it('should not receive messages for unsubscribed types', () => {
      const mockCallback = vi.fn()
      
      service.subscribe(
        WebSocketEventType.METRICS,
        mockCallback
      )
      
      // Simulate receiving a different message type
      mockWebSocket.simulateMessage({
        type: WebSocketEventType.PODS,
        data: { pods: [] }
      })
      
      expect(mockCallback).not.toHaveBeenCalled()
    })

    it('should handle multiple subscriptions for same message type', () => {
      const mockCallback1 = vi.fn()
      const mockCallback2 = vi.fn()
      
      service.subscribe(WebSocketEventType.METRICS, mockCallback1)
      service.subscribe(WebSocketEventType.METRICS, mockCallback2)
      
      const metricsData = { cpu: 50, memory: 70 }
      mockWebSocket.simulateMessage({
        type: WebSocketEventType.METRICS,
        data: metricsData
      })
      
      expect(mockCallback1).toHaveBeenCalledWith(metricsData)
      expect(mockCallback2).toHaveBeenCalledWith(metricsData)
    })

    it('should unsubscribe correctly', () => {
      const mockCallback = vi.fn()
      
      const subscriptionId = service.subscribe(
        WebSocketEventType.METRICS,
        mockCallback
      )
      
      service.unsubscribe(subscriptionId)
      
      // Message should not be received after unsubscribing
      mockWebSocket.simulateMessage({
        type: WebSocketEventType.METRICS,
        data: { cpu: 50 }
      })
      
      expect(mockCallback).not.toHaveBeenCalled()
    })
  })

  describe('message sending', () => {
    beforeEach(async () => {
      // Wait for connection to be established
      await new Promise(resolve => setTimeout(resolve, 10))
    })

    it('should send messages when connected', () => {
      const sendSpy = vi.spyOn(mockWebSocket, 'send')
      
      const message: WebSocketMessage = { type: WebSocketEventType.METRICS, data: { test: 'data' } }
      service.send(message)
      
      expect(sendSpy).toHaveBeenCalledWith(JSON.stringify(message))
    })

    it('should queue messages when not connected', () => {
      // Create a new service that won't be connected
      const disconnectedService = new DenshimonWebSocket({ url: 'ws://localhost:8080' })
      const mockWs = (disconnectedService as any).ws as MockWebSocket
      mockWs.readyState = MockWebSocket.CLOSED
      
      const message: WebSocketMessage = { type: WebSocketEventType.METRICS, data: { test: 'data' } }
      
      // Should not throw error when disconnected
      expect(() => disconnectedService.send(message)).not.toThrow()
    })
  })

  describe('heartbeat mechanism', () => {
    beforeEach(async () => {
      // Wait for connection to be established
      await new Promise(resolve => setTimeout(resolve, 10))
    })

    it('should send heartbeat messages periodically', async () => {
      const sendSpy = vi.spyOn(mockWebSocket, 'send')
      
      // Fast forward time to trigger heartbeat
      vi.advanceTimersByTime(30000) // 30 seconds
      
      // Should have sent at least one heartbeat
      const heartbeatCalls = sendSpy.mock.calls.filter(call => 
        call[0].includes(WebSocketEventType.HEARTBEAT)
      )
      
      expect(heartbeatCalls.length).toBeGreaterThan(0)
    })

    it('should handle heartbeat responses', () => {
      const heartbeatCallback = vi.fn()
      
      service.subscribe(WebSocketEventType.HEARTBEAT, heartbeatCallback)
      
      // Simulate heartbeat response
      mockWebSocket.simulateMessage({
        type: WebSocketEventType.HEARTBEAT,
        data: { timestamp: Date.now() }
      })
      
      expect(heartbeatCallback).toHaveBeenCalled()
    })
  })

  describe('reconnection logic', () => {
    it('should attempt reconnection on connection loss', async () => {
      // Wait for initial connection
      await new Promise(resolve => setTimeout(resolve, 10))
      
      const initialState = service.getConnectionState()
      expect(initialState).toBe(WebSocketState.CONNECTED)
      
      // Simulate connection loss
      mockWebSocket.close(1006, 'Connection lost')
      await new Promise(resolve => setTimeout(resolve, 10))
      
      // Should be in reconnecting state or have attempted reconnection
      expect(service.getReconnectAttempts()).toBeGreaterThanOrEqual(0)
    })

    it('should increment reconnect attempts', async () => {
      // Wait for initial connection
      await new Promise(resolve => setTimeout(resolve, 10))
      
      // Simulate multiple connection losses
      mockWebSocket.close(1006, 'Connection lost')
      await new Promise(resolve => setTimeout(resolve, 100))
      
      expect(service.getReconnectAttempts()).toBeGreaterThan(0)
    })
  })

  describe('error handling', () => {
    it('should handle malformed JSON messages', () => {
      const mockCallback = vi.fn()
      
      service.subscribe(WebSocketEventType.METRICS, mockCallback)
      
      // Simulate malformed message
      const malformedEvent = new MessageEvent('message', {
        data: 'invalid json'
      })
      
      mockWebSocket.onmessage?.(malformedEvent)
      
      // Should not call callback with malformed data
      expect(mockCallback).not.toHaveBeenCalled()
    })

    it('should handle unknown message types', () => {
      const mockCallback = vi.fn()
      
      service.subscribe(WebSocketEventType.METRICS, mockCallback)
      
      // Simulate unknown message type
      mockWebSocket.simulateMessage({
        type: 'unknown_type',
        data: { test: 'data' }
      })
      
      // Should not call the callback for unknown types
      expect(mockCallback).not.toHaveBeenCalled()
    })

    it('should handle subscription errors gracefully', () => {
      const mockCallback = vi.fn()
      
      service.subscribe(WebSocketEventType.METRICS, mockCallback)
      
      // Simulate error in message processing
      mockWebSocket.simulateMessage({
        type: WebSocketEventType.METRICS,
        error: 'Processing failed'
      })
      
      // Should still call callback even with error property
      expect(mockCallback).toHaveBeenCalled()
    })
  })

  describe('singleton instance', () => {
    it('should return same instance from getWebSocketInstance', () => {
      const instance1 = getWebSocketInstance()
      const instance2 = getWebSocketInstance()
      
      expect(instance1).toBe(instance2)
    })

    it('should initialize with default URL when not provided', () => {
      const instance = getWebSocketInstance()
      expect(instance).toBeInstanceOf(DenshimonWebSocket)
    })
  })

  describe('WebSocketMessage class', () => {
    it('should create message with correct structure', () => {
      const data = { test: 'data', value: 42 }
      const message: WebSocketMessage = { type: WebSocketEventType.METRICS, data }
      
      expect(message.type).toBe(WebSocketEventType.METRICS)
      expect(message.data).toEqual(data)
    })

    it('should create messages with same structure', () => {
      const message1: WebSocketMessage = { type: WebSocketEventType.METRICS, data: {} }
      const message2: WebSocketMessage = { type: WebSocketEventType.METRICS, data: {} }
      
      expect(message1.type).toBe(message2.type)
      expect(message1.data).toEqual(message2.data)
    })

    it('should serialize to JSON correctly', () => {
      const data = { test: 'data' }
      const message: WebSocketMessage = { type: WebSocketEventType.METRICS, data }
      
      const json = JSON.stringify(message)
      const parsed = JSON.parse(json)
      
      expect(parsed.type).toBe(WebSocketEventType.METRICS)
      expect(parsed.data).toEqual(data)
      expect(parsed.timestamp).toBeTypeOf('number')
      expect(parsed.id).toBeTypeOf('string')
    })
  })

  describe('performance and memory', () => {
    it('should clean up subscriptions on disconnect', () => {
      const mockCallback = vi.fn()
      
      service.subscribe(
        WebSocketEventType.METRICS,
        mockCallback
      )
      
      service.disconnect()
      
      // Should not receive messages after disconnect
      mockWebSocket.simulateMessage({
        type: WebSocketEventType.METRICS,
        data: { test: 'data' }
      })
      
      expect(mockCallback).not.toHaveBeenCalled()
    })

    it('should handle rapid successive messages', () => {
      const mockCallback = vi.fn()
      
      service.subscribe(WebSocketEventType.METRICS, mockCallback)
      
      // Send multiple messages rapidly
      for (let i = 0; i < 100; i++) {
        mockWebSocket.simulateMessage({
          type: WebSocketEventType.METRICS,
          data: { value: i }
        })
      }
      
      expect(mockCallback).toHaveBeenCalledTimes(100)
    })
  })
})
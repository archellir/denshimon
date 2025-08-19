import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useWebSocket } from '@hooks/useWebSocket'
import { WebSocketEventType, WebSocketState } from '@constants'

// Mock the WebSocket service
const mockSubscribe = vi.fn()
const mockUnsubscribe = vi.fn()
const mockGetConnectionState = vi.fn()
const mockConnect = vi.fn()
const mockDisconnect = vi.fn()

vi.mock('@services/websocket', () => ({
  getWebSocketInstance: vi.fn(() => ({
    subscribe: mockSubscribe,
    unsubscribe: mockUnsubscribe,
    getConnectionState: mockGetConnectionState,
    connect: mockConnect,
    disconnect: mockDisconnect,
  })),
  WebSocketMessage: vi.fn(),
}))

describe('useWebSocket', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetConnectionState.mockReturnValue({
      state: WebSocketState.DISCONNECTED,
      reconnectAttempts: 0,
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('initialization', () => {
    it('should initialize with correct default state', () => {
      const { result } = renderHook(() => 
        useWebSocket(WebSocketEventType.METRICS)
      )

      expect(result.current.data).toBeNull()
      expect(result.current.connectionState).toEqual({
        state: WebSocketState.DISCONNECTED,
        reconnectAttempts: 0,
      })
      expect(result.current.error).toBeNull()
    })

    it('should not subscribe when disabled', () => {
      renderHook(() => 
        useWebSocket(WebSocketEventType.METRICS, { enabled: false })
      )

      expect(mockSubscribe).not.toHaveBeenCalled()
    })

    it('should subscribe when enabled', () => {
      renderHook(() => 
        useWebSocket(WebSocketEventType.METRICS, { enabled: true })
      )

      expect(mockSubscribe).toHaveBeenCalledWith(
        WebSocketEventType.METRICS,
        expect.any(Function),
        expect.any(Function)
      )
    })
  })

  describe('message handling', () => {
    it('should handle incoming data messages', () => {
      mockSubscribe.mockImplementation((_type, onMessage) => {
        // Simulate receiving a message
        setTimeout(() => {
          onMessage({ cpu: 50, memory: 70 })
        }, 0)
        return 'subscription-id'
      })

      const { result } = renderHook(() => 
        useWebSocket<{ cpu: number; memory: number }>(WebSocketEventType.METRICS)
      )

      // Wait for the message to be processed
      act(() => {
        vi.runAllTimers()
      })

      expect(result.current.data).toEqual({ cpu: 50, memory: 70 })
      expect(result.current.error).toBeNull()
    })

    it('should handle connection state messages', () => {
      mockSubscribe.mockImplementation((_type, onMessage) => {
        // Simulate receiving a connection state update
        setTimeout(() => {
          onMessage({
            state: WebSocketState.CONNECTED,
            reconnectAttempts: 1,
          })
        }, 0)
        return 'subscription-id'
      })

      const { result } = renderHook(() => 
        useWebSocket('connection')
      )

      act(() => {
        vi.runAllTimers()
      })

      expect(result.current.connectionState).toEqual({
        state: WebSocketState.CONNECTED,
        reconnectAttempts: 1,
      })
    })

    it('should handle error messages', () => {
      mockSubscribe.mockImplementation((_type, _onMessage, onError) => {
        // Simulate receiving an error
        setTimeout(() => {
          onError(new Error('Connection failed'))
        }, 0)
        return 'subscription-id'
      })

      const { result } = renderHook(() => 
        useWebSocket(WebSocketEventType.METRICS)
      )

      act(() => {
        vi.runAllTimers()
      })

      expect(result.current.error).toBeInstanceOf(Error)
      expect(result.current.error?.message).toBe('Connection failed')
    })

    it('should handle non-Error objects as errors', () => {
      mockSubscribe.mockImplementation((_type, _onMessage, onError) => {
        // Simulate receiving a non-Error object as error
        setTimeout(() => {
          onError('String error message')
        }, 0)
        return 'subscription-id'
      })

      const { result } = renderHook(() => 
        useWebSocket(WebSocketEventType.METRICS)
      )

      act(() => {
        vi.runAllTimers()
      })

      expect(result.current.error).toBeInstanceOf(Error)
      expect(result.current.error?.message).toBe('String error message')
    })
  })

  describe('subscription management', () => {
    it('should unsubscribe on unmount', () => {
      mockSubscribe.mockReturnValue('subscription-id')

      const { unmount } = renderHook(() => 
        useWebSocket(WebSocketEventType.METRICS)
      )

      unmount()

      expect(mockUnsubscribe).toHaveBeenCalledWith('subscription-id')
    })

    it('should resubscribe when messageType changes', () => {
      mockSubscribe.mockReturnValue('subscription-id')

      const { rerender } = renderHook(
        ({ messageType }) => useWebSocket(messageType),
        { initialProps: { messageType: WebSocketEventType.METRICS } }
      )

      expect(mockSubscribe).toHaveBeenCalledWith(
        WebSocketEventType.METRICS,
        expect.any(Function),
        expect.any(Function)
      )

      // Change the message type
      rerender({ messageType: WebSocketEventType.PODS })

      expect(mockUnsubscribe).toHaveBeenCalledWith('subscription-id')
      expect(mockSubscribe).toHaveBeenCalledWith(
        WebSocketEventType.PODS,
        expect.any(Function),
        expect.any(Function)
      )
    })

    it('should handle subscription when WebSocket instance is not available', () => {
      // Mock getWebSocketInstance to return null
      vi.mocked(require('@services/websocket').getWebSocketInstance).mockReturnValue(null)

      const { result } = renderHook(() => 
        useWebSocket(WebSocketEventType.METRICS)
      )

      expect(result.current.error).toBeInstanceOf(Error)
      expect(result.current.error?.message).toBe('WebSocket instance not available')
    })
  })

  describe('options handling', () => {
    it('should respect enabled option', () => {
      const { rerender } = renderHook(
        ({ enabled }) => useWebSocket(WebSocketEventType.METRICS, { enabled }),
        { initialProps: { enabled: false } }
      )

      expect(mockSubscribe).not.toHaveBeenCalled()

      // Enable the hook
      rerender({ enabled: true })

      expect(mockSubscribe).toHaveBeenCalledWith(
        WebSocketEventType.METRICS,
        expect.any(Function),
        expect.any(Function)
      )
    })

    it('should unsubscribe when disabled', () => {
      mockSubscribe.mockReturnValue('subscription-id')

      const { rerender } = renderHook(
        ({ enabled }) => useWebSocket(WebSocketEventType.METRICS, { enabled }),
        { initialProps: { enabled: true } }
      )

      expect(mockSubscribe).toHaveBeenCalled()

      // Disable the hook
      rerender({ enabled: false })

      expect(mockUnsubscribe).toHaveBeenCalledWith('subscription-id')
    })

    it('should handle immediate option', () => {
      renderHook(() => 
        useWebSocket(WebSocketEventType.METRICS, { immediate: false })
      )

      // Should still subscribe (immediate affects connection, not subscription)
      expect(mockSubscribe).toHaveBeenCalled()
    })
  })

  describe('type safety', () => {
    it('should maintain type safety for data', () => {
      type MetricsData = {
        cpu: number
        memory: number
        timestamp: string
      }

      mockSubscribe.mockImplementation((_type, onMessage) => {
        setTimeout(() => {
          onMessage({
            cpu: 75,
            memory: 80,
            timestamp: '2023-01-01T00:00:00Z',
          })
        }, 0)
        return 'subscription-id'
      })

      const { result } = renderHook(() => 
        useWebSocket<MetricsData>(WebSocketEventType.METRICS)
      )

      act(() => {
        vi.runAllTimers()
      })

      // TypeScript should infer the correct type
      expect(result.current.data?.cpu).toBe(75)
      expect(result.current.data?.memory).toBe(80)
      expect(result.current.data?.timestamp).toBe('2023-01-01T00:00:00Z')
    })
  })

  describe('multiple subscriptions', () => {
    it('should handle multiple hook instances independently', () => {
      renderHook(() => 
        useWebSocket(WebSocketEventType.METRICS)
      )

      renderHook(() => 
        useWebSocket(WebSocketEventType.PODS)
      )

      expect(mockSubscribe).toHaveBeenCalledTimes(2)
      expect(mockSubscribe).toHaveBeenNthCalledWith(
        1,
        WebSocketEventType.METRICS,
        expect.any(Function),
        expect.any(Function)
      )
      expect(mockSubscribe).toHaveBeenNthCalledWith(
        2,
        WebSocketEventType.PODS,
        expect.any(Function),
        expect.any(Function)
      )
    })
  })

  describe('cleanup', () => {
    it('should clean up subscription on component unmount', () => {
      mockSubscribe.mockReturnValue('subscription-id')

      const { unmount } = renderHook(() => 
        useWebSocket(WebSocketEventType.METRICS)
      )

      expect(mockSubscribe).toHaveBeenCalled()

      unmount()

      expect(mockUnsubscribe).toHaveBeenCalledWith('subscription-id')
    })

    it('should handle cleanup when subscription ID is null', () => {
      mockSubscribe.mockReturnValue(null)

      const { unmount } = renderHook(() => 
        useWebSocket(WebSocketEventType.METRICS)
      )

      // Should not throw error when unsubscribing with null ID
      expect(() => unmount()).not.toThrow()
    })
  })

  describe('WebSocket states', () => {
    it('should handle different WebSocket states', () => {
      const states = [
        WebSocketState.CONNECTING,
        WebSocketState.CONNECTED,
        WebSocketState.DISCONNECTED,
        WebSocketState.ERROR,
      ]

      states.forEach(state => {
        mockSubscribe.mockImplementation((_type, onMessage) => {
          if (_type === 'connection') {
            setTimeout(() => {
              onMessage({ state, reconnectAttempts: 0 })
            }, 0)
          }
          return 'subscription-id'
        })

        const { result } = renderHook(() => useWebSocket('connection'))

        act(() => {
          vi.runAllTimers()
        })

        expect(result.current.connectionState.state).toBe(state)
      })
    })
  })

  describe('edge cases', () => {
    it('should handle rapid message updates', () => {
      mockSubscribe.mockImplementation((_type, onMessage) => {
        // Simulate rapid messages
        setTimeout(() => onMessage({ value: 1 }), 0)
        setTimeout(() => onMessage({ value: 2 }), 5)
        setTimeout(() => onMessage({ value: 3 }), 10)
        return 'subscription-id'
      })

      const { result } = renderHook(() => 
        useWebSocket<{ value: number }>(WebSocketEventType.METRICS)
      )

      act(() => {
        vi.runAllTimers()
      })

      // Should have the latest value
      expect(result.current.data?.value).toBe(3)
    })

    it('should clear error on successful message', () => {
      mockSubscribe.mockImplementation((_type, _onMessage, onError) => {
        // First send error, then success
        setTimeout(() => onError(new Error('Test error')), 0)
        setTimeout(() => _onMessage({ success: true }), 5)
        return 'subscription-id'
      })

      const { result } = renderHook(() => 
        useWebSocket<{ success: boolean }>(WebSocketEventType.METRICS)
      )

      act(() => {
        vi.runAllTimers()
      })

      // Error should be cleared after successful message
      expect(result.current.error).toBeNull()
      expect(result.current.data?.success).toBe(true)
    })
  })
})
import '@testing-library/jest-dom'
import { beforeAll, afterEach, vi } from 'vitest'

// Mock console methods to reduce noise in tests
beforeAll(() => {
  // Mock console.warn and console.error unless explicitly testing them
  global.console = {
    ...console,
    warn: vi.fn(),
    error: vi.fn(),
  }
})

// Mock WebSocket constructor
const MockWebSocketConstructor = vi.fn().mockImplementation(() => ({
  close: vi.fn(),
  send: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  readyState: 0, // CONNECTING
})) as any

// Add static constants to the constructor
MockWebSocketConstructor.CONNECTING = 0
MockWebSocketConstructor.OPEN = 1
MockWebSocketConstructor.CLOSING = 2
MockWebSocketConstructor.CLOSED = 3

// Set as global WebSocket
global.WebSocket = MockWebSocketConstructor

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock scrollTo
Object.defineProperty(window, 'scrollTo', {
  writable: true,
  value: vi.fn(),
})

// Clean up after each test
afterEach(() => {
  vi.clearAllMocks()
})
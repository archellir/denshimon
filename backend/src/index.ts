import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { serve } from '@hono/node-server'
import { createNodeWebSocket } from '@hono/node-ws'
import { kubernetesRoutes } from './routes/kubernetes'
import { authRoutes } from './routes/auth'
import { infrastructureRoutes } from './routes/infrastructure'
import { authMiddleware } from './middleware/auth'
import { websocketHandler } from './websocket/handler'
import { config } from './config/config'

const { injectWebSocket, upgradeWebSocket } = createNodeWebSocket({ serve })

const app = new Hono()

// Inject WebSocket support
injectWebSocket(app)

// Middleware
app.use('*', cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}))
app.use('*', logger())

// Health check
app.get('/health', (c) => c.json({ status: 'ok', timestamp: new Date().toISOString() }))

// WebSocket for real-time updates
app.get('/ws', upgradeWebSocket(websocketHandler))

// Routes
app.route('/api/auth', authRoutes)

// Protected routes - require authentication
app.use('/api/k8s/*', authMiddleware)
app.use('/api/infrastructure/*', authMiddleware)

app.route('/api/k8s', kubernetesRoutes)
app.route('/api/infrastructure', infrastructureRoutes)

// Start server
const port = config.PORT
console.log(`🚀 K8s WebUI Backend running on port ${port}`)

serve({
  fetch: app.fetch,
  port
})
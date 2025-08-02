import { Hono } from 'hono'
import { authService } from '@/lib/auth'
import { config } from '@/config/config'

export const authRoutes = new Hono()

// Simple auth for demo - in production use proper authentication
authRoutes.post('/login', async (c) => {
  try {
    const { username, password } = await c.req.json()
    
    // Basic demo auth - replace with proper authentication
    if (username === 'admin' && password === 'admin') {
      const token = await authService.createToken(username, 'admin')
      
      return c.json({
        token,
        user: { username, role: 'admin' },
        expiresIn: config.TOKEN_EXPIRES_IN
      })
    }
    
    return c.json({ error: 'Invalid credentials' }, 401)
  } catch (error) {
    return c.json({ error: 'Login failed' }, 500)
  }
})

authRoutes.post('/verify', async (c) => {
  try {
    const authHeader = c.req.header('Authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ error: 'No token provided' }, 401)
    }
    
    const token = authHeader.substring(7)
    const payload = await authService.verifyToken(token)
    
    return c.json({
      valid: true,
      user: { username: payload.username, role: payload.role }
    })
  } catch (error) {
    return c.json({ error: 'Invalid token' }, 401)
  }
})

authRoutes.post('/logout', async (c) => {
  // In a real app, you'd invalidate the token
  return c.json({ message: 'Logged out successfully' })
})
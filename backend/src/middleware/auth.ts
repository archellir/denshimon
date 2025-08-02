import { Context, Next } from 'hono'
import { authService } from '@/lib/auth'

export interface AuthUser {
  username: string;
  role: string;
}

declare module 'hono' {
  interface ContextVariableMap {
    user: AuthUser
  }
}

export const authMiddleware = async (c: Context, next: Next) => {
  try {
    const authHeader = c.req.header('Authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ error: 'Authentication required' }, 401)
    }
    
    const token = authHeader.substring(7)
    const payload = await authService.verifyToken(token)
    
    // Store user info in context for use in routes
    c.set('user', {
      username: payload.username,
      role: payload.role
    })
    
    await next()
  } catch (error) {
    return c.json({ error: 'Invalid or expired token' }, 401)
  }
}

export const requireRole = (requiredRole: string) => {
  return async (c: Context, next: Next) => {
    const user = c.get('user') as AuthUser
    
    if (!user) {
      return c.json({ error: 'Authentication required' }, 401)
    }
    
    if (user.role !== requiredRole && user.role !== 'admin') {
      return c.json({ error: 'Insufficient permissions' }, 403)
    }
    
    await next()
  }
}
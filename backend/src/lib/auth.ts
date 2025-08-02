import { V4 } from 'paseto';
import { config } from '@/config/config';

interface TokenPayload {
  username: string;
  role: string;
  iat: number;
  exp: number;
}

class AuthService {
  private secretKey: Buffer;

  constructor() {
    // Ensure we have a 32-byte key for PASETO v4.local
    const key = config.PASETO_SECRET_KEY;
    if (key.length < 32) {
      // Pad the key to 32 bytes
      this.secretKey = Buffer.from(key.padEnd(32, '0'), 'utf8');
    } else {
      this.secretKey = Buffer.from(key.slice(0, 32), 'utf8');
    }
  }

  async createToken(username: string, role: string): Promise<string> {
    const now = Math.floor(Date.now() / 1000);
    const expiresIn = this.parseExpiration(config.TOKEN_EXPIRES_IN);
    
    const payload: TokenPayload = {
      username,
      role,
      iat: now,
      exp: now + expiresIn
    };

    return await V4.encrypt(payload, this.secretKey, {
      audience: 'k8s-webui',
      issuer: 'k8s-webui-backend',
      subject: username
    });
  }

  async verifyToken(token: string): Promise<TokenPayload> {
    try {
      const result = await V4.decrypt(token, this.secretKey, {
        audience: 'k8s-webui',
        issuer: 'k8s-webui-backend'
      });

      const payload = result.payload as TokenPayload;
      
      // Check if token has expired
      const now = Math.floor(Date.now() / 1000);
      if (payload.exp && payload.exp < now) {
        throw new Error('Token has expired');
      }

      return payload;
    } catch (error) {
      throw new Error('Invalid token');
    }
  }

  private parseExpiration(expiresIn: string): number {
    // Parse duration strings like "24h", "7d", "30m"
    const match = expiresIn.match(/^(\d+)([smhd])$/);
    if (!match) {
      return 24 * 60 * 60; // Default to 24 hours
    }

    const value = parseInt(match[1]);
    const unit = match[2];

    switch (unit) {
      case 's': return value;
      case 'm': return value * 60;
      case 'h': return value * 60 * 60;
      case 'd': return value * 24 * 60 * 60;
      default: return 24 * 60 * 60;
    }
  }

  generateSecretKey(): string {
    // Generate a cryptographically secure 32-byte key
    return Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }
}

export const authService = new AuthService();
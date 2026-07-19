
import { Request, Response, NextFunction } from 'express';

/**
 * Rate Limiter for Webhook Endpoints
 * Prevents abuse and DoS attacks
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

class RateLimiter {
  private limits: Map<string, RateLimitEntry> = new Map();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Clean up expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  private cleanup() {
    const now = Date.now();
    for (const [key, entry] of this.limits.entries()) {
      if (entry.resetAt < now) {
        this.limits.delete(key);
      }
    }
  }

  /**
   * Check if request should be allowed
   */
  check(
    identifier: string,
    maxRequests: number = 100,
    windowMs: number = 60000 // 1 minute
  ): { allowed: boolean; retryAfter?: number } {
    const now = Date.now();
    const entry = this.limits.get(identifier);

    if (!entry || entry.resetAt < now) {
      // New window
      this.limits.set(identifier, {
        count: 1,
        resetAt: now + windowMs,
      });
      return { allowed: true };
    }

    if (entry.count >= maxRequests) {
      // Rate limit exceeded
      const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
      return { allowed: false, retryAfter };
    }

    // Increment counter
    entry.count++;
    return { allowed: true };
  }

  destroy() {
    clearInterval(this.cleanupInterval);
  }
}

const rateLimiter = new RateLimiter();

/**
 * Express middleware for rate limiting
 */
export function rateLimitMiddleware(
  maxRequests: number = 100,
  windowMs: number = 60000
) {
  return (req: Request, res: Response, next: NextFunction) => {
    // Use IP address as identifier
    const identifier = req.ip || req.connection.remoteAddress || 'unknown';
    
    const { allowed, retryAfter } = rateLimiter.check(
      identifier,
      maxRequests,
      windowMs
    );

    if (!allowed) {
      res.setHeader('Retry-After', retryAfter || 60);
      res.setHeader('X-RateLimit-Limit', maxRequests);
      res.setHeader('X-RateLimit-Remaining', 0);
      res.setHeader('X-RateLimit-Reset', new Date(Date.now() + (retryAfter || 60) * 1000).toISOString());
      
      return res.status(429).json({
        error: 'Too many requests',
        message: `Rate limit exceeded. Retry after ${retryAfter} seconds.`,
      });
    }

    next();
  };
}

/**
 * Rate limit specifically for webhook endpoints
 */
export function webhookRateLimiter() {
  // Allow 200 requests per minute per IP for webhooks
  return rateLimitMiddleware(200, 60000);
}

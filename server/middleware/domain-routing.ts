
import { Request, Response, NextFunction } from 'express';
import { db } from '../db';
import { customDomains } from '@shared/schema';
import { eq, and } from 'drizzle-orm';

// Simple in-memory cache with 5-minute TTL
interface CacheEntry {
  businessSlug: string;
  domainType: 'full' | 'quote_subdomain';
  timestamp: number;
}

const domainCache = new Map<string, CacheEntry>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Domain Routing Middleware
 * Intercepts requests by hostname and routes to correct business
 */
export async function domainRoutingMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const hostname = req.hostname || req.get('host')?.split(':')[0] || '';
    
    // Skip if localhost or default Replit domain
    if (
      hostname.includes('localhost') ||
      hostname.includes('repl.co') ||
      hostname.includes('replit.app') ||
      hostname.includes('replit.dev')
    ) {
      return next();
    }

    // Check cache first
    const cached = domainCache.get(hostname);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      attachBusinessContext(req, cached.businessSlug, cached.domainType);
      return next();
    }

    // Query database for custom domain
    const [domain] = await db
      .select({
        businessSlug: customDomains.businessId,
        domainType: customDomains.domainType,
      })
      .from(customDomains)
      .where(
        and(
          eq(customDomains.domain, hostname),
          eq(customDomains.status, 'verified')
        )
      )
      .limit(1);

    if (!domain) {
      // No custom domain found, continue with path-based routing
      return next();
    }

    // Get business slug from businessId
    const { businesses } = await import('@shared/schema');
    const [business] = await db
      .select({ slug: businesses.slug })
      .from(businesses)
      .where(eq(businesses.id, domain.businessSlug))
      .limit(1);

    if (!business) {
      console.error(`Business not found for domain ${hostname}`);
      return next();
    }

    // Cache the result
    domainCache.set(hostname, {
      businessSlug: business.slug,
      domainType: domain.domainType,
      timestamp: Date.now(),
    });

    // Attach business context and rewrite URL
    attachBusinessContext(req, business.slug, domain.domainType);
    
    next();
  } catch (error) {
    console.error('Domain routing error:', error);
    // On error, fall back to path-based routing
    next();
  }
}

/**
 * Attach business context to request and rewrite URL
 */
function attachBusinessContext(
  req: Request,
  businessSlug: string,
  domainType: 'full' | 'quote_subdomain'
) {
  // Store original URL for logging
  (req as any).originalCustomDomainUrl = req.url;
  
  // Rewrite URL based on domain type
  if (domainType === 'full') {
    // Full domain: example.com/quote -> /businessslug/quote
    // Full domain: example.com/ -> /businessslug
    if (req.path === '/') {
      req.url = `/${businessSlug}`;
    } else {
      req.url = `/${businessSlug}${req.url}`;
    }
  } else if (domainType === 'quote_subdomain') {
    // Quote subdomain: quote.example.com/* -> /businessslug/quote
    // Always route to quote page
    req.url = `/${businessSlug}/quote`;
  }

  // Attach metadata to request for downstream handlers
  (req as any).customDomain = {
    businessSlug,
    domainType,
    originalHostname: req.hostname,
  };

  console.log(`🌐 Custom domain routing: ${req.hostname} -> ${req.url}`);
}

/**
 * Clear cache for a specific domain (call when domain is updated/deleted)
 */
export function clearDomainCache(domain: string) {
  domainCache.delete(domain);
  console.log(`🗑️ Cleared domain cache for: ${domain}`);
}

/**
 * Clear entire domain cache (call on server restart or periodic cleanup)
 */
export function clearAllDomainCache() {
  domainCache.clear();
  console.log('🗑️ Cleared entire domain cache');
}

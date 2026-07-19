
import { Request, Response, NextFunction } from "express";
import { getCurrentBusinessId } from "../current-business";

// Extend Express session types
declare module 'express-session' {
  interface SessionData {
    userId: string;
    businessId: string;
    role: 'owner' | 'admin' | 'technician';
  }
}

// NOTE: `Express.User` (and therefore `Request.user`) is declared in
// server/googleAuth.ts, which is the fuller/canonical shape because Passport
// populates it. This module deliberately does NOT re-declare it — a second,
// narrower declaration produced TS2717 ("subsequent property declarations must
// have the same type").

/**
 * requireAuth - Ensures user is authenticated
 * Rejects requests without valid session
 */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  // Check if user is authenticated via Google OAuth
  if (req.isAuthenticated && req.isAuthenticated()) {
    return next();
  }
  
  // Check if user is authenticated via session (email/password)
  if (req.session?.userId) {
    return next();
  }
  
  return res.status(401).json({ 
    message: "Unauthorized - Please log in" 
  });
}

/**
 * attachBusinessContext - Adds user context to the request.
 * Must be used after requireAuth middleware.
 *
 * Single-business note: this is the one choke point where business scope is
 * decided. Rather than reading a tenant id off the session, it pins every
 * request to the single configured business. Route handlers downstream keep
 * using req.user.businessId exactly as before, so they need no changes.
 */
export async function attachBusinessContext(req: Request, res: Response, next: NextFunction) {
  try {
    const businessId = await getCurrentBusinessId();

    if (req.user) {
      // Passport populated req.user; ensure it carries the pinned business.
      req.user.businessId = businessId;
      return next();
    }

    if (req.session?.userId) {
      // Session-based (email/password) login. Passport is not involved here, so
      // we synthesise the Express.User shape from the session. Only id /
      // businessId / role are actually known at this point; the remaining
      // fields are declared on Express.User (see server/googleAuth.ts) and are
      // filled with nulls rather than triggering an extra DB round-trip.
      req.user = {
        id: req.session.userId,
        businessId,
        role: req.session.role || 'owner',
        email: null,
        firstName: null,
        lastName: null,
        profileImageUrl: null,
        isActive: true,
      };
    }

    next();
  } catch (error) {
    next(error);
  }
}

/**
 * requireBusinessContext - Ensures business context is present
 * Prevents requests without proper tenant isolation
 */
export function requireBusinessContext(req: Request, res: Response, next: NextFunction) {
  if (!req.user?.businessId) {
    return res.status(403).json({ 
      message: "No business context - tenant isolation required" 
    });
  }
  next();
}

/**
 * requireRole - Role-based access control
 * @param allowedRoles - Array of roles that can access this route
 */
export function requireRole(...allowedRoles: Array<'owner' | 'admin' | 'technician'>) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user?.role) {
      return res.status(403).json({ 
        message: "No user role found" 
      });
    }
    
    // Express.User declares `role` as a plain string (it comes from the DB),
    // so widen the allowed list for the membership check instead of narrowing
    // the value — behaviour is identical.
    if (!(allowedRoles as string[]).includes(req.user.role)) {
      return res.status(403).json({ 
        message: "Insufficient permissions for this action" 
      });
    }
    
    next();
  };
}

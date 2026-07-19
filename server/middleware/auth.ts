
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

// Extend Express Request to include user context
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        businessId: string;
        role: 'owner' | 'admin' | 'technician';
      };
    }
  }
}

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
      req.user = {
        id: req.session.userId,
        businessId,
        role: req.session.role || 'owner'
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
    
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: "Insufficient permissions for this action" 
      });
    }
    
    next();
  };
}

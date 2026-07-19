
import { Request, Response, NextFunction } from "express";
import { z } from "zod";

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public isOperational = true
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

/**
 * Global error handler middleware
 */
export function errorHandler(
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Payload too large errors
  // `type` is set by body-parser (e.g. 'entity.too.large'); it is not part of
  // the base Error shape, so read it defensively.
  if ((err as { type?: string }).type === 'entity.too.large') {
    return res.status(413).json({
      message: "File or request too large. Maximum upload size is 50MB total."
    });
  }

  // Zod validation errors
  if (err instanceof z.ZodError) {
    return res.status(400).json({
      message: "Validation error",
      errors: err.errors.map(e => ({
        field: e.path.join('.'),
        message: e.message
      }))
    });
  }

  // Application errors
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      message: err.message
    });
  }

  // Database errors
  if (err.message?.includes('duplicate key') || err.message?.includes('unique constraint')) {
    return res.status(409).json({
      message: "A record with this information already exists"
    });
  }

  if (err.message?.includes('foreign key constraint')) {
    return res.status(400).json({
      message: "Invalid reference - related record does not exist"
    });
  }

  // Log unexpected errors
  console.error('Unexpected error:', err);

  // Production vs Development responses
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  return res.status(500).json({
    message: "Internal server error",
    ...(isDevelopment && { error: err.message, stack: err.stack })
  });
}

/**
 * Async handler wrapper to catch errors in async route handlers
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

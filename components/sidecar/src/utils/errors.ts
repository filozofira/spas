/**
 * Error Handler Utilities
 *
 * Provides consistent error response format for all handlers.
 */

import { Request, Response, NextFunction } from 'express';

/**
 * Standard error response format.
 */
export interface ErrorResponse {
  error: string;
  message?: string;
  code?: string;
  details?: unknown;
  timestamp: string;
  path?: string;
  traceId?: string;
}

/**
 * Application error with additional context.
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: unknown;

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = 'INTERNAL_ERROR',
    details?: unknown
  ) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

/**
 * Common error codes.
 */
export const ErrorCodes = {
  // 400 Bad Request
  INVALID_REQUEST: 'INVALID_REQUEST',
  MISSING_HEADERS: 'MISSING_HEADERS',
  INVALID_BODY: 'INVALID_BODY',
  ROUTING_ERROR: 'ROUTING_ERROR',
  COMMAND_NOT_FOUND: 'COMMAND_NOT_FOUND',

  // 500 Internal Server Error
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  PUBLISH_FAILED: 'PUBLISH_FAILED',
  INVOKE_FAILED: 'INVOKE_FAILED',
  TRANSFORM_FAILED: 'TRANSFORM_FAILED',
  REDIS_ERROR: 'REDIS_ERROR',

  // 502 Bad Gateway
  SERVICE_ERROR: 'SERVICE_ERROR',
  UPSTREAM_ERROR: 'UPSTREAM_ERROR',

  // 503 Service Unavailable
  NOT_READY: 'NOT_READY',
} as const;

/**
 * Create a standard error response.
 */
export function createErrorResponse(
  error: string,
  req: Request,
  options?: {
    message?: string;
    code?: string;
    details?: unknown;
  }
): ErrorResponse {
  const response: ErrorResponse = {
    error,
    timestamp: new Date().toISOString(),
    path: req.path,
  };

  if (options?.message) {
    response.message = options.message;
  }

  if (options?.code) {
    response.code = options.code;
  }

  if (options?.details) {
    response.details = options.details;
  }

  // Include trace ID if present
  const traceparent = req.headers['traceparent'];
  if (traceparent && typeof traceparent === 'string') {
    const parts = traceparent.split('-');
    if (parts.length >= 2) {
      response.traceId = parts[1];
    }
  }

  return response;
}

/**
 * Send a 400 Bad Request response.
 */
export function sendBadRequest(
  res: Response,
  req: Request,
  message: string,
  code: string = ErrorCodes.INVALID_REQUEST,
  details?: unknown
): void {
  const response = createErrorResponse('Bad Request', req, { message, code, details });
  res.status(400).json(response);
}

/**
 * Send a 404 Not Found response.
 */
export function sendNotFound(
  res: Response,
  req: Request,
  message: string,
  code: string = ErrorCodes.COMMAND_NOT_FOUND
): void {
  const response = createErrorResponse('Not Found', req, { message, code });
  res.status(404).json(response);
}

/**
 * Send a 500 Internal Server Error response.
 */
export function sendInternalError(
  res: Response,
  req: Request,
  message: string,
  code: string = ErrorCodes.INTERNAL_ERROR
): void {
  const response = createErrorResponse('Internal Server Error', req, { message, code });
  res.status(500).json(response);
}

/**
 * Send a 502 Bad Gateway response.
 */
export function sendBadGateway(
  res: Response,
  req: Request,
  message: string,
  code: string = ErrorCodes.SERVICE_ERROR
): void {
  const response = createErrorResponse('Bad Gateway', req, { message, code });
  res.status(502).json(response);
}

/**
 * Send a 503 Service Unavailable response.
 */
export function sendServiceUnavailable(
  res: Response,
  req: Request,
  message: string,
  code: string = ErrorCodes.NOT_READY
): void {
  const response = createErrorResponse('Service Unavailable', req, { message, code });
  res.status(503).json(response);
}

/**
 * Global error handler middleware.
 */
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  console.error(`[error] ${err.message}`, {
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  if (err instanceof AppError) {
    const response = createErrorResponse(err.message, req, {
      code: err.code,
      details: err.details,
    });
    res.status(err.statusCode).json(response);
    return;
  }

  // Default to 500 for unknown errors
  const response = createErrorResponse('Internal Server Error', req, {
    message: err.message,
    code: ErrorCodes.INTERNAL_ERROR,
  });
  res.status(500).json(response);
}

/**
 * Async handler wrapper to catch errors.
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
): (req: Request, res: Response, next: NextFunction) => void {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Base application error class
 */
export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public isOperational: boolean = true
  ) {
    super(message)
    this.name = 'AppError'
    Error.captureStackTrace?.(this, this.constructor)
  }
}

/**
 * Validation error for invalid input
 */
export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR', 400)
    this.name = 'ValidationError'
  }
}

/**
 * Authentication error for unauthenticated requests
 */
export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, 'AUTH_ERROR', 401)
    this.name = 'AuthenticationError'
  }
}

/**
 * Authorization error for forbidden requests
 */
export class AuthorizationError extends AppError {
  constructor(message: string = 'Access denied') {
    super(message, 'FORBIDDEN', 403)
    this.name = 'AuthorizationError'
  }
}

/**
 * Not found error for missing resources
 */
export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} not found`, 'NOT_FOUND', 404)
    this.name = 'NotFoundError'
  }
}

/**
 * Rate limit error for too many requests
 */
export class RateLimitError extends AppError {
  constructor(retryAfter?: number) {
    super(
      retryAfter
        ? `Rate limit exceeded. Please try again in ${retryAfter} seconds.`
        : 'Rate limit exceeded. Please try again later.',
      'RATE_LIMIT',
      429
    )
    this.name = 'RateLimitError'
  }
}

/**
 * Database error for database operations
 */
export class DatabaseError extends AppError {
  constructor(message: string = 'Database operation failed') {
    super(message, 'DATABASE_ERROR', 500, false)
    this.name = 'DatabaseError'
  }
}

/**
 * External service error (e.g., AI API)
 */
export class ExternalServiceError extends AppError {
  constructor(service: string, message?: string) {
    super(
      message || `${service} service is temporarily unavailable`,
      'EXTERNAL_SERVICE_ERROR',
      503
    )
    this.name = 'ExternalServiceError'
  }
}

/**
 * Format error for API response
 */
export function formatErrorResponse(error: unknown): {
  error: string
  code?: string
  statusCode: number
} {
  if (error instanceof AppError) {
    return {
      error: error.message,
      code: error.code,
      statusCode: error.statusCode,
    }
  }

  if (error instanceof Error) {
    return {
      error: error.message,
      statusCode: 500,
    }
  }

  return {
    error: 'An unexpected error occurred',
    statusCode: 500,
  }
}

/**
 * Check if error is operational (expected/recoverable)
 */
export function isOperationalError(error: unknown): boolean {
  if (error instanceof AppError) {
    return error.isOperational
  }
  return false
}

import { NextResponse } from 'next/server';

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
  details?: any;
}

export class ValidationError extends Error implements AppError {
  statusCode = 400;
  code = 'VALIDATION_ERROR';
  
  constructor(message: string, public details?: any) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends Error implements AppError {
  statusCode = 401;
  code = 'AUTHENTICATION_ERROR';
  
  constructor(message: string = 'Authentication required') {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends Error implements AppError {
  statusCode = 403;
  code = 'AUTHORIZATION_ERROR';
  
  constructor(message: string = 'Access denied') {
    super(message);
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends Error implements AppError {
  statusCode = 404;
  code = 'NOT_FOUND';
  
  constructor(message: string = 'Resource not found') {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends Error implements AppError {
  statusCode = 409;
  code = 'CONFLICT';
  
  constructor(message: string = 'Resource conflict') {
    super(message);
    this.name = 'ConflictError';
  }
}

// Custom error for rate limiting
export class RateLimitError extends Error implements AppError {
  statusCode = 429;
  code = 'RATE_LIMIT_EXCEEDED';
  
  constructor(message: string = 'Too many requests') {
    super(message);
    this.name = 'RateLimitError';
  }
}

export function handleError(error: unknown): NextResponse {
  // Log the error with structured logging
  logError(error, 'API_ERROR_HANDLER');
  
  // Handle known application errors
  if (error instanceof ValidationError) {
    return NextResponse.json(
      {
        error: error.message,
        code: error.code,
        details: error.details,
        timestamp: new Date().toISOString(),
      },
      { status: error.statusCode }
    );
  }
  
  if (error instanceof AuthenticationError) {
    return NextResponse.json(
      {
        error: error.message,
        code: error.code,
        timestamp: new Date().toISOString(),
      },
      { status: error.statusCode }
    );
  }
  
  if (error instanceof AuthorizationError) {
    return NextResponse.json(
      {
        error: error.message,
        code: error.code,
        timestamp: new Date().toISOString(),
      },
      { status: error.statusCode }
    );
  }
  
  if (error instanceof NotFoundError) {
    return NextResponse.json(
      {
        error: error.message,
        code: error.code,
        timestamp: new Date().toISOString(),
      },
      { status: error.statusCode }
    );
  }
  
  if (error instanceof ConflictError) {
    return NextResponse.json(
      {
        error: error.message,
        code: error.code,
        timestamp: new Date().toISOString(),
      },
      { status: error.statusCode }
    );
  }
  
  if (error instanceof RateLimitError) {
    return NextResponse.json(
      {
        error: error.message,
        code: error.code,
        timestamp: new Date().toISOString(),
      },
      { status: error.statusCode }
    );
  }
  
  // Handle Prisma errors
  if (error && typeof error === 'object' && 'code' in error) {
    const prismaError = error as any;
    
    switch (prismaError.code) {
      case 'P2002':
        return NextResponse.json(
          {
            error: 'A record with this information already exists',
            code: 'DUPLICATE_ENTRY',
            timestamp: new Date().toISOString(),
          },
          { status: 409 }
        );
      case 'P2025':
        return NextResponse.json(
          {
            error: 'Record not found',
            code: 'NOT_FOUND',
            timestamp: new Date().toISOString(),
          },
          { status: 404 }
        );
      case 'P2003':
        return NextResponse.json(
          {
            error: 'Invalid reference',
            code: 'INVALID_REFERENCE',
            timestamp: new Date().toISOString(),
          },
          { status: 400 }
        );
    }
  }
  
  // Handle generic errors
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  return NextResponse.json(
    {
      error: isDevelopment ? (error as Error)?.message || 'Internal server error' : 'Internal server error',
      code: 'INTERNAL_ERROR',
      timestamp: new Date().toISOString(),
      ...(isDevelopment && { stack: (error as Error)?.stack }),
    },
    { status: 500 }
  );
}

export function logError(error: unknown, context?: string): void {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorStack = error instanceof Error ? error.stack : undefined;
  const errorName = error instanceof Error ? error.name : 'UnknownError';
  
  // Structured logging
  const logEntry = {
    level: 'error',
    message: errorMessage,
    name: errorName,
    stack: errorStack,
    context: context || 'APP',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    // Add request ID if available in future
  };
  
  // In production, you might want to send this to a logging service
  if (process.env.NODE_ENV === 'production') {
    // Example: send to external logging service
    // await sendToLoggingService(logEntry);
    console.error(JSON.stringify(logEntry));
  } else {
    console.error(`[${context || 'APP'}] ${errorName}:`, {
      message: errorMessage,
      stack: errorStack,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
    });
  }
}

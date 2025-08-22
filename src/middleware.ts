import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { RateLimitError } from '@/lib/error-handler';

// Simple in-memory rate limiting (for production, use Redis or similar)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

// Get rate limit from environment or use default
const RATE_LIMIT_WINDOW = parseInt(process.env.RATE_LIMIT_WINDOW || '60000'); // 1 minute
const MAX_REQUESTS = parseInt(process.env.API_RATE_LIMIT || '100'); // Max requests per window

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return false;
  }

  if (record.count >= MAX_REQUESTS) {
    return true;
  }

  record.count++;
  return false;
}

// Validate origin for CORS
function isValidOrigin(origin: string | null): boolean {
  if (!origin) return true; // Allow requests with no origin (mobile apps, curl, etc.)
  
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [];
  return allowedOrigins.some(allowed => origin === allowed.trim());
}

export function middleware(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') ||
             request.headers.get('x-real-ip') ||
             'unknown';
  
  // Validate origin for API routes
  const origin = request.headers.get('origin');
  if (request.nextUrl.pathname.startsWith('/api/') && origin && !isValidOrigin(origin)) {
    return new NextResponse(
      JSON.stringify({
        error: 'CORS not allowed',
        code: 'CORS_ERROR',
        timestamp: new Date().toISOString()
      }),
      {
        status: 403,
        headers: {
          'Content-Type': 'application/json',
        }
      }
    );
  }
  
  // Rate limiting for API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    if (isRateLimited(ip)) {
      // Use the custom RateLimitError class
      const error = new RateLimitError('Too many requests. Please try again later.');
      return new NextResponse(
        JSON.stringify({
          error: error.message,
          code: error.code,
          timestamp: new Date().toISOString()
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': '60'
          }
        }
      );
    }
  }

  // Security headers
  const response = NextResponse.next();
  
  // Security headers
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'origin-when-cross-origin');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  
  // Content Security Policy
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:; frame-ancestors 'none';"
  );

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
};

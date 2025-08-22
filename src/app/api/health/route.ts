import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  const startTime = Date.now();
  
  try {
    // Check database connectivity with more detailed information
    const dbCheck = await prisma.$queryRaw`SELECT 1`;
    
    // Get database connection info
    const dbInfo = await prisma.$queryRaw`SELECT version(), current_database(), current_user`;
    
    const responseTime = Date.now() - startTime;
    
    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      database: {
        status: 'connected',
        responseTime: `${responseTime}ms`,
        info: Array.isArray(dbInfo) && dbInfo.length > 0 ? dbInfo[0] : null,
      },
      version: process.env.npm_package_version || '1.0.0',
    });
  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development',
        database: {
          status: 'disconnected',
          responseTime: `${responseTime}ms`,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
        version: process.env.npm_package_version || '1.0.0',
      },
      { status: 503 }
    );
  }
}

import { PrismaClient } from '@prisma/client';

// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit.
const globalForPrisma = global as unknown as { prisma: PrismaClient };

// Configure Prisma Client with connection pooling
const prismaOptions = {
  log: ['query', 'info', 'warn', 'error'] as ('query' | 'info' | 'warn' | 'error')[],
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
};

const prisma = globalForPrisma.prisma || new PrismaClient(prismaOptions);

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;
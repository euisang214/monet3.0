import { PrismaClient } from '@prisma/client';

// Ensure that the Prisma Client picks up the connection string at runtime.
// Next.js' bundling can inline environment variables which may result in the
// client attempting to connect to an outdated or missing database URL. By
// explicitly passing the datasource URL we read from `process.env` when the
// module is evaluated.
const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    datasourceUrl: process.env.DATABASE_URL,
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
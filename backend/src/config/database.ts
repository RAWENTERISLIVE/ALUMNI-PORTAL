// Database configuration has been migrated to Prisma ORM
// See /backend/src/config/prisma.ts for Prisma client setup
// Prisma handles all database connections and migrations automatically

import prisma from './prisma';

export const connectDB = async (): Promise<void> => {
  try {
    // Verify Prisma can connect to PostgreSQL
    await prisma.$queryRaw`SELECT 1`;
    console.log('✅ PostgreSQL Connected via Prisma');
  } catch (error) {
    console.error('Error connecting to PostgreSQL:', error);
    process.exit(1);
  }
};

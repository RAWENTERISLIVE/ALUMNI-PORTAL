import express from 'express';
import prisma from '../config/prisma';

const router = express.Router();

// Test cleanup endpoint - ONLY available in development/test environments
if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
  
  // Delete test users (emails containing 'testuser_' or '@example.com')
  router.delete('/cleanup-test-users', async (_req, res) => {
    try {
      const result = await prisma.user.deleteMany({
        where: {
          OR: [
            { email: { contains: 'testuser_', mode: 'insensitive' } },
            { email: { endsWith: '@example.com', mode: 'insensitive' } },
            { admissionNumber: { startsWith: 'TEST', mode: 'insensitive' } }
          ]
        }
      });

      res.json({
        success: true,
        message: `Deleted ${result.count} test users`,
        deletedCount: result.count
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error cleaning up test users:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to cleanup test users',
        details: errorMessage
      });
    }
  });

  // Get count of test users
  router.get('/test-users-count', async (_req, res) => {
    try {
      const count = await prisma.user.count({
        where: {
          OR: [
            { email: { contains: 'testuser_', mode: 'insensitive' } },
            { email: { endsWith: '@example.com', mode: 'insensitive' } },
            { admissionNumber: { startsWith: 'TEST', mode: 'insensitive' } }
          ]
        }
      });

      res.json({
        success: true,
        count,
        message: `Found ${count} test users`
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error counting test users:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to count test users',
        details: errorMessage
      });
    }
  });

  console.log('🧪 Test utility endpoints enabled (development mode)');
} else {
  router.all('*', (_req, res) => {
    res.status(404).json({
      success: false,
      error: 'Test utilities are not available in production'
    });
  });
}

export default router;

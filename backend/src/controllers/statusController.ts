import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';

export const getStatus = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  res.status(200).json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

export const getHealth = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  res.status(200).json({
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

export const healthCheck = getHealth;

export const getPhase1Status = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
  res.status(200).json({
    success: true,
    phase: 'phase1',
    status: 'active',
    timestamp: new Date().toISOString()
  });
});

export const getSystemStatus = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
  res.status(200).json({
    success: true,
    system: {
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      nodeVersion: process.version,
      environment: process.env.NODE_ENV || 'development'
    },
    timestamp: new Date().toISOString()
  });
});

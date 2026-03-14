import { Request, Response, NextFunction } from 'express';

interface ErrorWithStatus extends Error {
  statusCode?: number;
}

export const errorHandler = (
  err: ErrorWithStatus,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  let error = { ...err };
  error.message = err.message;

  console.error(err);

  // Prisma validation errors
  if ((err as any).code === 'P2002') {
    const message = 'Duplicate field value entered';
    error = { statusCode: 400, message } as ErrorWithStatus;
  }

  // Prisma not found errors
  if ((err as any).code === 'P2025') {
    const message = 'Resource not found';
    error = { statusCode: 404, message } as ErrorWithStatus;
  }

  // Prisma invalid ID format
  if ((err as any).code === 'P2023') {
    const message = 'Invalid ID format';
    error = { statusCode: 400, message } as ErrorWithStatus;
  }

  res.status(error.statusCode || 500).json({
    success: false,
    error: error.message || 'Server Error'
  });
};

export const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) =>
  Promise.resolve(fn(req, res, next)).catch(next);

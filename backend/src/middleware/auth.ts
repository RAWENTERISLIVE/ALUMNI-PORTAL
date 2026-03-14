import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import UserModel, { IUser, UserRole, User as NamedUser } from '../models/User';

const User: any = (UserModel as any)?.findOne ? UserModel : (NamedUser as any);

export interface AuthRequest extends Request {
  user?: IUser;
}

export const authMiddleware = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      res.status(401).json({ 
        success: false,
        message: 'No token, authorization denied',
        code: 'NO_TOKEN'
      });
      return;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as { userId: string };
    const user = await User.findById(decoded.userId)
      .select('-password -refreshTokens -passwordResetToken -emailVerificationToken');

    if (!user) {
      res.status(401).json({ 
        success: false,
        message: 'Token is not valid - user not found',
        code: 'INVALID_TOKEN'
      });
      return;
    }

    // Enhanced status checks for Phase 1
    if (user.status === 'suspended') {
      res.status(403).json({ 
        success: false,
        message: 'Account has been suspended. Please contact administrator.',
        code: 'ACCOUNT_SUSPENDED'
      });
      return;
    }

    if (user.status === 'deleted') {
      res.status(403).json({ 
        success: false,
        message: 'Account no longer exists',
        code: 'ACCOUNT_DELETED'
      });
      return;
    }

    if (user.status === 'pending') {
      res.status(403).json({ 
        success: false,
        message: 'Account is pending approval',
        code: 'ACCOUNT_PENDING'
      });
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ 
        success: false,
        message: 'Token has expired',
        code: 'TOKEN_EXPIRED'
      });
      return;
    }

    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ 
        success: false,
        message: 'Invalid token format',
        code: 'INVALID_TOKEN_FORMAT'
      });
      return;
    }

    res.status(401).json({ 
      success: false,
      message: 'Token is not valid',
      code: 'TOKEN_INVALID'
    });
  }
};

export const requireRole = (roles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({ message: 'Insufficient permissions' });
      return;
    }

    next();
  };
};

export const requireSuperAdmin = requireRole([UserRole.SUPER_ADMIN]);
export const requireAdmin = requireRole([UserRole.MODERATOR, UserRole.ADMIN, UserRole.SUPER_ADMIN]);

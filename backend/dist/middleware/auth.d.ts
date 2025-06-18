import { Request, Response, NextFunction } from 'express';
import { IUser, UserRole } from '../models/User';
interface AuthRequest extends Request {
    user?: IUser;
}
export declare const authMiddleware: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const requireRole: (roles: UserRole[]) => (req: AuthRequest, res: Response, next: NextFunction) => void;
export declare const requireSuperAdmin: (req: AuthRequest, res: Response, next: NextFunction) => void;
export declare const requireAdmin: (req: AuthRequest, res: Response, next: NextFunction) => void;
export {};
//# sourceMappingURL=auth.d.ts.map
import { Request, Response, NextFunction } from 'express';
interface AuthenticatedRequest extends Request {
    user?: {
        id: string;
        role: string;
        email: string;
        name: string;
    };
}
export declare const getJobs: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const getJobById: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const createJob: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const updateJob: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const deleteJob: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const toggleSaveJob: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const getSavedJobs: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const incrementApplicationCount: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const getJobStats: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
export {};
//# sourceMappingURL=jobController.d.ts.map
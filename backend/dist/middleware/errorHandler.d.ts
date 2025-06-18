import { Request, Response, NextFunction } from 'express';
interface ErrorWithStatus extends Error {
    statusCode?: number;
}
export declare const errorHandler: (err: ErrorWithStatus, _req: Request, res: Response, _next: NextFunction) => void;
export declare const asyncHandler: (fn: Function) => (req: Request, res: Response, next: NextFunction) => Promise<any>;
export {};
//# sourceMappingURL=errorHandler.d.ts.map
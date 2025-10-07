import { Request, Response } from 'express';
export declare const sendConnectionRequest: (req: Request, res: Response, next: import("express").NextFunction) => Promise<any>;
export declare const acceptConnectionRequest: (req: Request, res: Response, next: import("express").NextFunction) => Promise<any>;
export declare const rejectConnectionRequest: (req: Request, res: Response, next: import("express").NextFunction) => Promise<any>;
export declare const getReceivedConnectionRequests: (req: Request, res: Response, next: import("express").NextFunction) => Promise<any>;
export declare const getSentConnectionRequests: (req: Request, res: Response, next: import("express").NextFunction) => Promise<any>;
export declare const getUserConnections: (req: Request, res: Response, next: import("express").NextFunction) => Promise<any>;
export declare const getConnectionStatus: (req: Request, res: Response, next: import("express").NextFunction) => Promise<any>;
export declare const removeConnection: (req: Request, res: Response, next: import("express").NextFunction) => Promise<any>;
//# sourceMappingURL=connectionController.d.ts.map
import { Request, Response } from 'express';
export declare const getAllUsers: (req: Request, res: Response, next: import("express").NextFunction) => Promise<any>;
export declare const getPendingUsers: (req: Request, res: Response, next: import("express").NextFunction) => Promise<any>;
export declare const approveUser: (req: Request, res: Response, next: import("express").NextFunction) => Promise<any>;
export declare const rejectUser: (req: Request, res: Response, next: import("express").NextFunction) => Promise<any>;
export declare const suspendUser: (req: Request, res: Response, next: import("express").NextFunction) => Promise<any>;
export declare const reactivateUser: (req: Request, res: Response, next: import("express").NextFunction) => Promise<any>;
export declare const promoteToAdmin: (req: Request, res: Response, next: import("express").NextFunction) => Promise<any>;
export declare const demoteAdmin: (req: Request, res: Response, next: import("express").NextFunction) => Promise<any>;
export declare const deleteUser: (req: Request, res: Response, next: import("express").NextFunction) => Promise<any>;
export declare const getAlumniDirectory: (_req: Request, res: Response) => Promise<void>;
export declare const getUserStats: (req: Request, res: Response, next: import("express").NextFunction) => Promise<any>;
export declare const updateUserProfile: (req: Request, res: Response, next: import("express").NextFunction) => Promise<any>;
export declare const getUserById: (req: Request, res: Response, next: import("express").NextFunction) => Promise<any>;
export declare const getUserSuggestions: (req: Request, res: Response, next: import("express").NextFunction) => Promise<any>;
//# sourceMappingURL=userController.d.ts.map
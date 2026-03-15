import { Request, Response } from 'express';
export declare const register: (req: Request, res: Response, next: import("express").NextFunction) => Promise<any>;
export declare const login: (req: Request, res: Response, next: import("express").NextFunction) => Promise<any>;
export declare const refreshToken: (req: Request, res: Response, next: import("express").NextFunction) => Promise<any>;
export declare const logout: (req: Request, res: Response, next: import("express").NextFunction) => Promise<any>;
export declare const getActiveSessions: (req: Request, res: Response, next: import("express").NextFunction) => Promise<any>;
export declare const logoutOtherSessions: (req: Request, res: Response, next: import("express").NextFunction) => Promise<any>;
export declare const deactivateAccount: (req: Request, res: Response, next: import("express").NextFunction) => Promise<any>;
export declare const getMe: (req: Request, res: Response, next: import("express").NextFunction) => Promise<any>;
export declare const uploadVerificationId: (req: Request, res: Response, next: import("express").NextFunction) => Promise<any>;
export declare const forgotPassword: (req: Request, res: Response, next: import("express").NextFunction) => Promise<any>;
export declare const resetPassword: (req: Request, res: Response, next: import("express").NextFunction) => Promise<any>;
export declare const changePassword: (req: Request, res: Response, next: import("express").NextFunction) => Promise<any>;
export declare const updateNotificationSettings: (req: Request, res: Response, next: import("express").NextFunction) => Promise<any>;
export declare const updatePrivacySettings: (req: Request, res: Response, next: import("express").NextFunction) => Promise<any>;
//# sourceMappingURL=authController.d.ts.map
import { Request, Response } from 'express';
export declare const getJobs: (req: Request, res: Response, next: import("express").NextFunction) => Promise<any>;
export declare const getJobById: (req: Request, res: Response, next: import("express").NextFunction) => Promise<any>;
export declare const createJob: (req: Request, res: Response, next: import("express").NextFunction) => Promise<any>;
export declare const updateJob: (req: Request, res: Response, next: import("express").NextFunction) => Promise<any>;
export declare const deleteJob: (req: Request, res: Response, next: import("express").NextFunction) => Promise<any>;
export declare const saveJob: (req: Request, res: Response, next: import("express").NextFunction) => Promise<any>;
export declare const unsaveJob: (req: Request, res: Response, next: import("express").NextFunction) => Promise<any>;
export declare const getSavedJobs: (req: Request, res: Response, next: import("express").NextFunction) => Promise<any>;
export declare const getAppliedJobs: (req: Request, res: Response, next: import("express").NextFunction) => Promise<any>;
export declare const toggleSaveJob: (req: Request, res: Response, next: import("express").NextFunction) => Promise<any>;
export declare const incrementApplicationCount: (req: Request, res: Response, next: import("express").NextFunction) => Promise<any>;
export declare const getJobApplications: (req: Request, res: Response, next: import("express").NextFunction) => Promise<any>;
export declare const searchJobs: (req: Request, res: Response, next: import("express").NextFunction) => Promise<any>;
export declare const getJobStats: (req: Request, res: Response, next: import("express").NextFunction) => Promise<any>;
//# sourceMappingURL=jobController.d.ts.map
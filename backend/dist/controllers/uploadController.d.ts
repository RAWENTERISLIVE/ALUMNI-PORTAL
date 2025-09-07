import { Request, Response } from 'express';
import multer from 'multer';
export declare const upload: multer.Multer;
export declare const uploadFile: (req: Request, res: Response, next: import("express").NextFunction) => Promise<any>;
export declare const uploadMultipleFiles: (req: Request, res: Response, next: import("express").NextFunction) => Promise<any>;
export declare const serveFile: (req: Request, res: Response, next: import("express").NextFunction) => Promise<any>;
//# sourceMappingURL=uploadController.d.ts.map
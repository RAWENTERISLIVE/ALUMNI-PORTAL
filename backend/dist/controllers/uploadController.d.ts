import { NextFunction, Request, Response } from 'express';
import multer from 'multer';
export declare const upload: multer.Multer;
export declare const handleUploadError: (err: any, _req: Request, res: Response, next: NextFunction) => void;
export declare const uploadFile: (req: Request, res: Response, next: NextFunction) => Promise<any>;
export declare const uploadMultipleFiles: (req: Request, res: Response, next: NextFunction) => Promise<any>;
export declare const serveFile: (req: Request, res: Response, next: NextFunction) => Promise<any>;
//# sourceMappingURL=uploadController.d.ts.map
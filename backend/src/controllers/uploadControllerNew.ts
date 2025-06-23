import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import File from '../models/File';

const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req: Request, _file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) => {
    cb(null, uploadsDir);
  },
  filename: (_req: Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const multerUpload = multer({ storage }).single('file');

export const uploadFile = (req: Request, res: Response, next: NextFunction): void => {
  multerUpload(req, res, async (err: any) => {
    if (err) {
      return res.status(400).json({ success: false, message: 'File upload failed.', error: err.message });
    }
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded.' });
    }

    try {
      const { originalname, mimetype, size, filename } = req.file;
      const user = (req as any).user;

      const newFile = new File({
        filename,
        originalName: originalname,
        path: `/uploads/${filename}`,
        mimetype,
        size,
        uploadedBy: user._id,
      });

      await newFile.save();

      res.status(201).json({
        success: true,
        message: 'File uploaded successfully.',
        data: {
          ...newFile.toObject(),
          url: `${req.protocol}://${req.get('host')}/uploads/${filename}`
        }
      });
    } catch (error) {
      next(error);
    }
  });
};

import { NextFunction, Request, Response } from 'express';
import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import { Prisma } from '@prisma/client';
import { asyncHandler } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';
import prisma from '../config/prisma';

const isMissingFileTableError = (error: unknown): boolean => {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return error.code === 'P2021' && String(error.meta?.table || '').includes('File');
  }

  return error instanceof Error && error.message.includes('File') && error.message.includes('does not exist');
};

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    // Generate unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    const basename = path.basename(file.originalname, extension);
    cb(null, `${basename}-${uniqueSuffix}${extension}`);
  }
});

// File filter to allow specific file types
const fileFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = [
    'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/heic', 'image/heif',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain'
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Unsupported file type'));
  }
};

// Configure multer
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  }
});

export const handleUploadError = (
  err: any,
  _req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!err) {
    next();
    return;
  }

  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      res.status(400).json({
        success: false,
        message: 'File is too large. Maximum allowed size is 50MB.'
      });
      return;
    }

    res.status(400).json({
      success: false,
      message: err.message || 'File upload failed.'
    });
    return;
  }

  res.status(400).json({
    success: false,
    message: err.message || 'Unsupported file type'
  });
};

// Upload single file
export const uploadFile = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.file) {
    res.status(400).json({
      success: false,
      message: 'No file uploaded'
    });
    return;
  }

  if (!req.user) {
    res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
    return;
  }

  const fileUrl = `/api/uploads/${req.file.filename}`;
  
  let fileRecord: { id: string } | null = null;
  try {
    // Save file metadata when the File table is available.
    fileRecord = await prisma.file.create({
      data: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        path: req.file.path,
        url: fileUrl,
        uploadedById: req.user._id || req.user.id
      },
      select: { id: true }
    });
  } catch (error) {
    if (!isMissingFileTableError(error)) {
      throw error;
    }

    console.warn('File table missing. Continuing upload without metadata record.');
  }
  
  res.json({
    success: true,
    message: 'File uploaded successfully',
    data: {
      id: fileRecord?.id || null,
      url: fileUrl,
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype
    }
  });
});

// Upload multiple files
export const uploadMultipleFiles = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const files = req.files as Express.Multer.File[];
  
  if (!files || files.length === 0) {
    res.status(400).json({
      success: false,
      message: 'No files uploaded'
    });
    return;
  }

  if (!req.user) {
    res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
    return;
  }

  const uploadedFiles = [];

  for (const file of files) {
    const fileUrl = `/api/uploads/${file.filename}`;
    
    let fileRecord: { id: string } | null = null;
    try {
      fileRecord = await prisma.file.create({
        data: {
          filename: file.filename,
          originalName: file.originalname,
          mimetype: file.mimetype,
          size: file.size,
          path: file.path,
          url: fileUrl,
          uploadedById: req.user._id || req.user.id
        },
        select: { id: true }
      });
    } catch (error) {
      if (!isMissingFileTableError(error)) {
        throw error;
      }

      console.warn('File table missing. Continuing multi-upload without metadata record.');
    }

    uploadedFiles.push({
      id: fileRecord?.id || null,
      url: fileUrl,
      filename: file.filename,
      originalName: file.originalname,
      size: file.size,
      mimetype: file.mimetype
    });
  }

  res.json({
    success: true,
    message: 'Files uploaded successfully',
    data: uploadedFiles
  });
});

// Serve uploaded files
export const serveFile = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { filename } = req.params;
  
  if (!filename || typeof filename !== 'string') {
    res.status(400).json({
      success: false,
      message: 'Filename is required'
    });
    return;
  }

  // Sanitize filename to prevent path traversal
  const sanitizedFilename = path.basename(filename.replace(/\\/g, '/'));
  const filePath = path.join(__dirname, '../../uploads', sanitizedFilename);

  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
    res.status(404).json({
      success: false,
      message: 'File not found'
    });
    return;
  }

  res.sendFile(filePath);
});

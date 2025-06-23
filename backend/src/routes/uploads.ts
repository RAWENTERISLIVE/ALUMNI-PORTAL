import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { upload, uploadFile, uploadMultipleFiles, serveFile } from '../controllers/uploadController';

const router = Router();

// Upload single file
router.post('/single', authMiddleware, upload.single('file') as any, uploadFile);

// Upload multiple files
router.post('/multiple', authMiddleware, upload.array('files', 10) as any, uploadMultipleFiles);

// Serve uploaded files
router.get('/:filename', serveFile);

export default router;

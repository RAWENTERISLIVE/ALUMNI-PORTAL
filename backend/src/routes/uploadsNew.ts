import express from 'express';
import { uploadFile } from '../controllers/uploadControllerNew';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();

router.post('/', authMiddleware, uploadFile);

export default router;

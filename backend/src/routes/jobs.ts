import express from 'express';
import { authMiddleware, requireRole } from '../middleware/auth';
import { UserRole } from '../models/User';
import {
  getJobs,
  getJobById,
  createJob,
  updateJob,
  deleteJob,
  toggleSaveJob,
  getSavedJobs,
  incrementApplicationCount,
  getJobStats
} from '../controllers/jobController';

const router = express.Router();

// Public routes (no authentication required for viewing)
router.get('/', getJobs);
router.get('/:id', getJobById);

// Protected routes (require authentication)
router.get('/saved', authMiddleware, getSavedJobs);
router.get('/stats', authMiddleware, requireRole([UserRole.ADMIN, UserRole.SUPER_ADMIN]), getJobStats);
router.post('/', authMiddleware, createJob);
router.put('/:id', authMiddleware, updateJob);
router.delete('/:id', authMiddleware, deleteJob);
router.post('/:id/save', authMiddleware, toggleSaveJob);
router.post('/:id/apply', authMiddleware, incrementApplicationCount);

export default router;

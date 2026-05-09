import express from 'express';
import { authMiddleware, requireRole } from '../middleware/auth';

import { Role as UserRole } from '@prisma/client';

import {
  getJobs,
  getJobById,
  createJob,
  updateJob,
  deleteJob,
  saveJob,
  unsaveJob,
  toggleSaveJob,
  getSavedJobs,
  getAppliedJobs,
  incrementApplicationCount,
  getJobApplications,
  getJobStats
} from '../controllers/jobController';

const router = express.Router();

// Public routes (no authentication required for viewing)
router.get('/', getJobs);

// Protected routes (require authentication)
router.get('/saved', authMiddleware, getSavedJobs);
router.get('/applied', authMiddleware, getAppliedJobs);
router.get('/stats', authMiddleware, requireRole([UserRole.ADMIN, UserRole.SUPER_ADMIN]), getJobStats);
router.post('/', authMiddleware, createJob);
router.put('/:id', authMiddleware, updateJob);
router.delete('/:id', authMiddleware, deleteJob);
router.post('/:id/save', authMiddleware, saveJob);
router.delete('/:id/save', authMiddleware, unsaveJob);
router.post('/:id/save-toggle', authMiddleware, toggleSaveJob);
router.post('/:id/apply', authMiddleware, incrementApplicationCount);
router.get('/:id/applications', authMiddleware, getJobApplications);
router.get('/:id', getJobById);

export default router;

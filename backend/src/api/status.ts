import express from 'express';
import { getSystemStatus, healthCheck, getPhase1Status } from '../controllers/statusController';
import { authMiddleware, requireAdmin } from '../middleware/auth';

const router = express.Router();

// Public health check
router.get('/health', healthCheck);

// Phase 1 status (admin only)
router.get('/phase1', authMiddleware, requireAdmin, getPhase1Status);

// System status (admin only)
router.get('/system', authMiddleware, requireAdmin, getSystemStatus);

export default router;

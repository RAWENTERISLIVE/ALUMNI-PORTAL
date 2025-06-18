import express from 'express';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();

// TODO: Implement event routes
router.get('/', authMiddleware, (_req, res) => {
  res.json({ message: 'Events routes - to be implemented' });
});

export default router;

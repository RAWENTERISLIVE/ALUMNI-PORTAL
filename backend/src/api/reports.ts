import express from 'express';
import { body } from 'express-validator';
import {
  createReport,
  getAllReports,
  updateReportStatus,
  deleteReport,
  getReportStats
} from '../controllers/reportController';
import { authMiddleware, requireAdmin } from '../middleware/auth';
import { validate } from '../middleware/validation';

const router = express.Router();

// Validation rules
const reportValidationRules = [
  body('type')
    .isIn(['user', 'post', 'comment', 'group', 'job', 'other'])
    .withMessage('Invalid report type'),
  body('description')
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Description must be between 10 and 1000 characters'),
  body('reason')
    .isIn([
      'spam',
      'harassment',
      'inappropriate_content',
      'misinformation',
      'copyright_violation',
      'fake_profile',
      'violence',
      'hate_speech',
      'other'
    ])
    .withMessage('Invalid report reason')
];

const updateStatusValidationRules = [
  body('status')
    .isIn(['pending', 'reviewed', 'resolved', 'dismissed'])
    .withMessage('Invalid status'),
  body('adminNotes')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Admin notes must not exceed 500 characters')
];

// Routes
router.post('/', authMiddleware, reportValidationRules, validate, createReport);
router.get('/', authMiddleware, requireAdmin, getAllReports);
router.get('/stats', authMiddleware, requireAdmin, getReportStats);
router.patch('/:reportId/status', authMiddleware, requireAdmin, updateStatusValidationRules, validate, updateReportStatus);
router.delete('/:reportId', authMiddleware, requireAdmin, deleteReport);

export default router;

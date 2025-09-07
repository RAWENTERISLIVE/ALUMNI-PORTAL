import express from 'express';
import { body } from 'express-validator';
import {
  getAllUsers,
  getPendingUsers,
  approveUser,
  rejectUser,
  suspendUser,
  reactivateUser,
  promoteToAdmin,
  demoteAdmin,
  deleteUser,
  getUserStats,
  updateUserProfile,
  getUserById,
  getAlumniDirectory,
  getUserSuggestions,
  updateUserSkills,
  updateUserInterests,
  updatePrivacySettings
} from '../controllers/userController';
import { authMiddleware, requireAdmin, requireSuperAdmin } from '../middleware/auth';
import { validate } from '../middleware/validation';

const router = express.Router();

// Validation rules
const updateProfileValidation = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2 })
    .withMessage('Name must be at least 2 characters long'),
  body('bio')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Bio must not exceed 500 characters'),
  body('headline')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Headline must not exceed 100 characters'),
  body('city')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('City must not exceed 50 characters'),
  body('country')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Country must not exceed 50 characters'),
  body('company')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Company must not exceed 100 characters'),
  body('jobTitle')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Job title must not exceed 100 characters'),
  body('contactEmail')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid contact email'),
  body('linkedInProfile')
    .optional()
    .isURL()
    .withMessage('Please provide a valid LinkedIn URL')
];

// User management routes (Admin/Super Admin only)
router.get('/', authMiddleware, requireAdmin, getAllUsers);
router.get('/pending', authMiddleware, requireAdmin, getPendingUsers);
router.get('/stats', authMiddleware, requireAdmin, getUserStats);

// User actions (Admin/Super Admin only)
router.patch('/:userId/approve', authMiddleware, requireAdmin, approveUser);
router.patch('/:userId/reject', authMiddleware, requireAdmin, rejectUser);
router.patch('/:userId/suspend', authMiddleware, requireAdmin, suspendUser);
router.patch('/:userId/reactivate', authMiddleware, requireAdmin, reactivateUser);

// Admin management (Super Admin only)
router.patch('/:userId/promote', authMiddleware, requireSuperAdmin, promoteToAdmin);
router.patch('/:userId/demote', authMiddleware, requireSuperAdmin, demoteAdmin);
router.delete('/:userId', authMiddleware, requireSuperAdmin, deleteUser);

// Alumni Directory
router.get('/directory', authMiddleware, getAlumniDirectory);

// User suggestions - must come before /:userId route
router.get('/suggestions', authMiddleware, getUserSuggestions);

// Current user profile endpoint
router.get('/me', authMiddleware, async (req: any, res: any, next: any) => {
  try {
    // Use the current user's ID from the auth middleware
    req.params.userId = req.user._id || req.user.id;
    await getUserById(req, res, next);
  } catch (error) {
    next(error);
  }
});

// Profile routes - /:userId must come after specific routes
router.get('/:userId', authMiddleware, getUserById);
router.patch('/:userId/profile', authMiddleware, updateProfileValidation, validate, updateUserProfile);
router.patch('/:userId/skills', authMiddleware, updateUserSkills);
router.patch('/:userId/interests', authMiddleware, updateUserInterests);
router.patch('/:userId/privacy', authMiddleware, updatePrivacySettings);

export default router;

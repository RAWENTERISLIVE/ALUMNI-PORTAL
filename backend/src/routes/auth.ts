import express from 'express';
import { body } from 'express-validator';
import {
  register,
  login,
  refreshToken,
  logout,
  getMe,
  forgotPassword,
  resetPassword,
  changePassword,
  uploadVerificationId,
  updateNotificationSettings,
  updatePrivacySettings,
  getActiveSessions,
  logoutOtherSessions,
  deactivateAccount
} from '../controllers/authController';
import { upload } from '../controllers/uploadController';
import { authMiddleware } from '../middleware/auth';
import { validate } from '../middleware/validation';
import {
  authLimiter,
  registrationLimiter,
  passwordResetLimiter
} from '../middleware/rateLimiter';

const router = express.Router();

// Validation rules
const registerValidation = [
  body('email')
    .isEmail()
    .customSanitizer((value) =>
      typeof value === 'string' ? value.trim().toLowerCase() : value
    )
    .withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long'),
  body('name')
    .trim()
    .isLength({ min: 2 })
    .withMessage('Name must be at least 2 characters long'),
  body('needsManualVerification')
    .optional()
    .isBoolean(),
  body('forgotAdmissionNumber')
    .optional()
    .isBoolean(),
  body('verificationDetails')
    .optional()
    .isString(),
  body('accountType')
    .optional()
    .isIn(['ALUMNI', 'FACULTY', 'alumni', 'faculty']),
  body('facultyIdCardUrl')
    .optional()
    .isString(),
  body('graduationYear')
    .optional()
    .isString(),
  body('admissionNumber')
    .optional()
    .isString()
];

const loginValidation = [
  body('email')
    .isEmail()
    .customSanitizer((value) =>
      typeof value === 'string' ? value.trim().toLowerCase() : value
    )
    .withMessage('Please provide a valid email'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

const forgotPasswordValidation = [
  body('email')
    .isEmail()
    .customSanitizer((value) =>
      typeof value === 'string' ? value.trim().toLowerCase() : value
    )
    .withMessage('Please provide a valid email')
];

const resetPasswordValidation = [
  body('token')
    .notEmpty()
    .withMessage('Reset token is required'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
];

const changePasswordValidation = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('New password must be at least 8 characters long')
];

const notificationSettingsValidation = [
  body('emailMessages').optional().isBoolean(),
  body('emailJobs').optional().isBoolean(),
  body('emailEvents').optional().isBoolean(),
  body('emailGroups').optional().isBoolean(),
  body('pushMessages').optional().isBoolean(),
  body('pushJobs').optional().isBoolean(),
  body('pushEvents').optional().isBoolean(),
  body('pushGroups').optional().isBoolean()
];

const privacySettingsValidation = [
  body('profileVisibility').optional().isIn(['public', 'alumni', 'connections']),
  body('showEmail').optional().isBoolean(),
  body('showPhone').optional().isBoolean(),
  body('allowMessaging').optional().isBoolean(),
  body('allowConnection').optional().isBoolean(),
  body('allowProfileSearch').optional().isBoolean()
];

// Auth routes
router.post('/upload-verification-id', upload.single('file') as any, uploadVerificationId);
router.post('/register', registrationLimiter, registerValidation, validate, register);
router.post('/login', authLimiter, loginValidation, validate, login);
router.post('/refresh-token', refreshToken);
router.post('/logout', authMiddleware, logout);
router.get('/me', authMiddleware, getMe);
router.post('/forgot-password', passwordResetLimiter, forgotPasswordValidation, validate, forgotPassword);
router.post('/reset-password', resetPasswordValidation, validate, resetPassword);

// Password change endpoint
router.patch('/change-password', authMiddleware, changePasswordValidation, validate, changePassword);

// Settings endpoints  
router.patch('/notification-settings', authMiddleware, notificationSettingsValidation, validate, updateNotificationSettings);
router.patch('/privacy-settings', authMiddleware, privacySettingsValidation, validate, updatePrivacySettings);
router.get('/sessions', authMiddleware, getActiveSessions);
router.post('/logout-other-sessions', authMiddleware, logoutOtherSessions);
router.patch('/deactivate-account', authMiddleware, deactivateAccount);

export default router;

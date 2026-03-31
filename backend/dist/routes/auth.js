"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const express_validator_1 = require("express-validator");
const authController_1 = require("../controllers/authController");
const uploadController_1 = require("../controllers/uploadController");
const auth_1 = require("../middleware/auth");
const validation_1 = require("../middleware/validation");
const router = express_1.default.Router();
const registerValidation = [
    (0, express_validator_1.body)('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email'),
    (0, express_validator_1.body)('password')
        .isLength({ min: 8 })
        .withMessage('Password must be at least 8 characters long'),
    (0, express_validator_1.body)('name')
        .trim()
        .isLength({ min: 2 })
        .withMessage('Name must be at least 2 characters long'),
    (0, express_validator_1.body)('needsManualVerification')
        .optional()
        .isBoolean(),
    (0, express_validator_1.body)('forgotAdmissionNumber')
        .optional()
        .isBoolean(),
    (0, express_validator_1.body)('verificationDetails')
        .optional()
        .isString(),
    (0, express_validator_1.body)('accountType')
        .optional()
        .isIn(['ALUMNI', 'FACULTY', 'alumni', 'faculty']),
    (0, express_validator_1.body)('facultyIdCardUrl')
        .optional()
        .isString(),
    (0, express_validator_1.body)('graduationYear')
        .optional()
        .isString(),
    (0, express_validator_1.body)('admissionNumber')
        .optional()
        .isString()
];
const loginValidation = [
    (0, express_validator_1.body)('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email'),
    (0, express_validator_1.body)('password')
        .notEmpty()
        .withMessage('Password is required')
];
const forgotPasswordValidation = [
    (0, express_validator_1.body)('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email')
];
const resetPasswordValidation = [
    (0, express_validator_1.body)('token')
        .notEmpty()
        .withMessage('Reset token is required'),
    (0, express_validator_1.body)('password')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters long')
];
const changePasswordValidation = [
    (0, express_validator_1.body)('currentPassword')
        .notEmpty()
        .withMessage('Current password is required'),
    (0, express_validator_1.body)('newPassword')
        .isLength({ min: 8 })
        .withMessage('New password must be at least 8 characters long')
];
const notificationSettingsValidation = [
    (0, express_validator_1.body)('emailMessages').optional().isBoolean(),
    (0, express_validator_1.body)('emailJobs').optional().isBoolean(),
    (0, express_validator_1.body)('emailEvents').optional().isBoolean(),
    (0, express_validator_1.body)('emailGroups').optional().isBoolean(),
    (0, express_validator_1.body)('pushMessages').optional().isBoolean(),
    (0, express_validator_1.body)('pushJobs').optional().isBoolean(),
    (0, express_validator_1.body)('pushEvents').optional().isBoolean(),
    (0, express_validator_1.body)('pushGroups').optional().isBoolean()
];
const privacySettingsValidation = [
    (0, express_validator_1.body)('profileVisibility').optional().isIn(['public', 'alumni', 'connections']),
    (0, express_validator_1.body)('showEmail').optional().isBoolean(),
    (0, express_validator_1.body)('showPhone').optional().isBoolean(),
    (0, express_validator_1.body)('allowMessaging').optional().isBoolean(),
    (0, express_validator_1.body)('allowConnection').optional().isBoolean(),
    (0, express_validator_1.body)('allowProfileSearch').optional().isBoolean()
];
router.post('/upload-verification-id', uploadController_1.upload.single('file'), authController_1.uploadVerificationId);
router.post('/register', registerValidation, validation_1.validate, authController_1.register);
router.post('/login', loginValidation, validation_1.validate, authController_1.login);
router.post('/refresh-token', authController_1.refreshToken);
router.post('/logout', auth_1.authMiddleware, authController_1.logout);
router.get('/me', auth_1.authMiddleware, authController_1.getMe);
router.post('/forgot-password', forgotPasswordValidation, validation_1.validate, authController_1.forgotPassword);
router.post('/reset-password', resetPasswordValidation, validation_1.validate, authController_1.resetPassword);
router.patch('/change-password', auth_1.authMiddleware, changePasswordValidation, validation_1.validate, authController_1.changePassword);
router.patch('/notification-settings', auth_1.authMiddleware, notificationSettingsValidation, validation_1.validate, authController_1.updateNotificationSettings);
router.patch('/privacy-settings', auth_1.authMiddleware, privacySettingsValidation, validation_1.validate, authController_1.updatePrivacySettings);
router.get('/sessions', auth_1.authMiddleware, authController_1.getActiveSessions);
router.post('/logout-other-sessions', auth_1.authMiddleware, authController_1.logoutOtherSessions);
router.patch('/deactivate-account', auth_1.authMiddleware, authController_1.deactivateAccount);
exports.default = router;
//# sourceMappingURL=auth.js.map
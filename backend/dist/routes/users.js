"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const express_validator_1 = require("express-validator");
const userController_1 = require("../controllers/userController");
const auth_1 = require("../middleware/auth");
const validation_1 = require("../middleware/validation");
const router = express_1.default.Router();
const updateProfileValidation = [
    (0, express_validator_1.body)('name')
        .optional()
        .trim()
        .isLength({ min: 2 })
        .withMessage('Name must be at least 2 characters long'),
    (0, express_validator_1.body)('bio')
        .optional()
        .isLength({ max: 500 })
        .withMessage('Bio must not exceed 500 characters'),
    (0, express_validator_1.body)('headline')
        .optional()
        .isLength({ max: 100 })
        .withMessage('Headline must not exceed 100 characters'),
    (0, express_validator_1.body)('city')
        .optional()
        .trim()
        .isLength({ max: 50 })
        .withMessage('City must not exceed 50 characters'),
    (0, express_validator_1.body)('country')
        .optional()
        .trim()
        .isLength({ max: 50 })
        .withMessage('Country must not exceed 50 characters'),
    (0, express_validator_1.body)('company')
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage('Company must not exceed 100 characters'),
    (0, express_validator_1.body)('jobTitle')
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage('Job title must not exceed 100 characters'),
    (0, express_validator_1.body)('contactEmail')
        .optional()
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid contact email'),
    (0, express_validator_1.body)('linkedInProfile')
        .optional()
        .isURL()
        .withMessage('Please provide a valid LinkedIn URL')
];
router.get('/', auth_1.authMiddleware, auth_1.requireAdmin, userController_1.getAllUsers);
router.get('/pending', auth_1.authMiddleware, auth_1.requireAdmin, userController_1.getPendingUsers);
router.get('/stats', auth_1.authMiddleware, auth_1.requireAdmin, userController_1.getUserStats);
router.patch('/:userId/approve', auth_1.authMiddleware, auth_1.requireAdmin, userController_1.approveUser);
router.patch('/:userId/reject', auth_1.authMiddleware, auth_1.requireAdmin, userController_1.rejectUser);
router.patch('/:userId/suspend', auth_1.authMiddleware, auth_1.requireAdmin, userController_1.suspendUser);
router.patch('/:userId/reactivate', auth_1.authMiddleware, auth_1.requireAdmin, userController_1.reactivateUser);
router.patch('/:userId/promote', auth_1.authMiddleware, auth_1.requireSuperAdmin, userController_1.promoteToAdmin);
router.patch('/:userId/demote', auth_1.authMiddleware, auth_1.requireSuperAdmin, userController_1.demoteAdmin);
router.delete('/:userId', auth_1.authMiddleware, auth_1.requireSuperAdmin, userController_1.deleteUser);
router.get('/directory', auth_1.authMiddleware, userController_1.getAlumniDirectory);
router.get('/suggestions', auth_1.authMiddleware, userController_1.getUserSuggestions);
router.get('/me', auth_1.authMiddleware, async (req, res, next) => {
    try {
        req.params.userId = req.user._id || req.user.id;
        await (0, userController_1.getUserById)(req, res, next);
    }
    catch (error) {
        next(error);
    }
});
router.get('/:userId', auth_1.authMiddleware, userController_1.getUserById);
router.patch('/:userId/profile', auth_1.authMiddleware, updateProfileValidation, validation_1.validate, userController_1.updateUserProfile);
exports.default = router;
//# sourceMappingURL=users.js.map
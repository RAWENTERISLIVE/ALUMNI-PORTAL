"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const express_validator_1 = require("express-validator");
const reportController_1 = require("../controllers/reportController");
const auth_1 = require("../middleware/auth");
const validation_1 = require("../middleware/validation");
const router = express_1.default.Router();
const reportValidationRules = [
    (0, express_validator_1.body)('type')
        .isIn(['user', 'post', 'comment', 'group', 'job', 'other'])
        .withMessage('Invalid report type'),
    (0, express_validator_1.body)('description')
        .trim()
        .isLength({ min: 10, max: 1000 })
        .withMessage('Description must be between 10 and 1000 characters'),
    (0, express_validator_1.body)('reason')
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
    (0, express_validator_1.body)('status')
        .isIn(['pending', 'reviewed', 'resolved', 'dismissed'])
        .withMessage('Invalid status'),
    (0, express_validator_1.body)('adminNotes')
        .optional()
        .isLength({ max: 500 })
        .withMessage('Admin notes must not exceed 500 characters')
];
router.post('/', auth_1.authMiddleware, reportValidationRules, validation_1.validate, reportController_1.createReport);
router.get('/', auth_1.authMiddleware, auth_1.requireAdmin, reportController_1.getAllReports);
router.get('/stats', auth_1.authMiddleware, auth_1.requireAdmin, reportController_1.getReportStats);
router.patch('/:reportId/status', auth_1.authMiddleware, auth_1.requireAdmin, updateStatusValidationRules, validation_1.validate, reportController_1.updateReportStatus);
router.delete('/:reportId', auth_1.authMiddleware, auth_1.requireAdmin, reportController_1.deleteReport);
exports.default = router;
//# sourceMappingURL=reports.js.map
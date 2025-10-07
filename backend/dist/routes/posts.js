"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const express_validator_1 = require("express-validator");
const postController_1 = require("../controllers/postController");
const auth_1 = require("../middleware/auth");
const validation_1 = require("../middleware/validation");
const router = express_1.default.Router();
const postValidationRules = [
    (0, express_validator_1.body)('content')
        .trim()
        .isLength({ min: 1, max: 2000 })
        .withMessage('Content is required and must be between 1 and 2000 characters'),
    (0, express_validator_1.body)('title')
        .optional()
        .trim()
        .isLength({ max: 200 })
        .withMessage('Title must not exceed 200 characters'),
    (0, express_validator_1.body)('category')
        .optional()
        .isIn(['general', 'career', 'networking', 'events', 'achievements', 'announcements'])
        .withMessage('Invalid category'),
    (0, express_validator_1.body)('visibility')
        .optional()
        .isIn(['public', 'alumni_only', 'faculty_only', 'connections_only'])
        .withMessage('Invalid visibility option'),
    (0, express_validator_1.body)('tags')
        .optional()
        .isArray()
        .withMessage('Tags must be an array'),
    (0, express_validator_1.body)('tags.*')
        .optional()
        .isString()
        .trim()
        .isLength({ max: 50 })
        .withMessage('Each tag must be a string and not exceed 50 characters'),
    (0, express_validator_1.body)('isSchoolUpdate')
        .optional()
        .isBoolean()
        .withMessage('isSchoolUpdate must be a boolean'),
    (0, express_validator_1.body)('attachments')
        .optional()
        .isArray()
        .withMessage('Attachments must be an array'),
    (0, express_validator_1.body)('externalLinks')
        .optional()
        .isArray()
        .withMessage('External links must be an array'),
    (0, express_validator_1.body)('externalLinks.*')
        .optional()
        .isURL()
        .withMessage('Each external link must be a valid URL'),
    (0, express_validator_1.body)('mentions')
        .optional()
        .isArray()
        .withMessage('Mentions must be an array')
];
router.post('/', auth_1.authMiddleware, postValidationRules, validation_1.validate, postController_1.createPost);
router.get('/', postController_1.getAllPosts);
router.get('/featured', postController_1.getFeaturedPosts);
router.get('/bookmarked', auth_1.authMiddleware, postController_1.getBookmarkedPosts);
router.get('/feed', auth_1.authMiddleware, postController_1.getFeedPosts);
router.get('/school-updates', postController_1.getSchoolUpdates);
router.get('/:postId', postController_1.getPostById);
router.patch('/:postId', auth_1.authMiddleware, postValidationRules, validation_1.validate, postController_1.updatePost);
router.delete('/:postId', auth_1.authMiddleware, postController_1.deletePost);
router.post('/:postId/like', auth_1.authMiddleware, postController_1.likePost);
router.post('/:postId/react', auth_1.authMiddleware, [
    (0, express_validator_1.body)('reactionType')
        .isIn(['like', 'love', 'celebrate', 'support', 'insightful', 'funny'])
        .withMessage('Invalid reaction type')
], validation_1.validate, postController_1.likePost);
router.post('/:postId/bookmark', auth_1.authMiddleware, postController_1.bookmarkPost);
router.delete('/:postId/bookmark', auth_1.authMiddleware, postController_1.bookmarkPost);
router.post('/share', auth_1.authMiddleware, [
    (0, express_validator_1.body)('originalPostId')
        .notEmpty()
        .withMessage('Original post ID is required'),
    (0, express_validator_1.body)('content')
        .optional()
        .trim()
        .isLength({ max: 2000 })
        .withMessage('Share content cannot exceed 2000 characters'),
    (0, express_validator_1.body)('visibility')
        .optional()
        .isIn(['public', 'alumni_only', 'faculty_only', 'connections_only'])
        .withMessage('Invalid visibility option'),
    (0, express_validator_1.body)('shareType')
        .optional()
        .isIn(['quote', 'simple'])
        .withMessage('Invalid share type')
], validation_1.validate, postController_1.sharePost);
router.patch('/:postId/feature', auth_1.authMiddleware, auth_1.requireAdmin, postController_1.toggleFeaturePost);
exports.default = router;
//# sourceMappingURL=posts.js.map
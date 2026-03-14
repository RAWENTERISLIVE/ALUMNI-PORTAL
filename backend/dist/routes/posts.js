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
const commonPostValidationRules = [
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
const createPostValidationRules = [
    (0, express_validator_1.body)('content')
        .optional()
        .trim()
        .isLength({ max: 2000 })
        .withMessage('Content must not exceed 2000 characters'),
    (0, express_validator_1.body)().custom((value) => {
        const hasContent = typeof value?.content === 'string' && value.content.trim().length > 0;
        const hasAttachments = Array.isArray(value?.attachments) && value.attachments.length > 0;
        const hasSharedPost = typeof value?.originalPostId === 'string' && value.originalPostId.trim().length > 0;
        if (!hasContent && !hasAttachments && !hasSharedPost) {
            throw new Error('Content, attachments, or shared post is required');
        }
        return true;
    }),
    ...commonPostValidationRules
];
const updatePostValidationRules = [
    (0, express_validator_1.body)('content')
        .optional()
        .trim()
        .isLength({ max: 2000 })
        .withMessage('Content must not exceed 2000 characters'),
    ...commonPostValidationRules
];
router.post('/', auth_1.authMiddleware, createPostValidationRules, validation_1.validate, postController_1.createPost);
router.get('/', postController_1.getAllPosts);
router.get('/featured', postController_1.getFeaturedPosts);
router.get('/bookmarked', auth_1.authMiddleware, postController_1.getBookmarkedPosts);
router.get('/feed', auth_1.authMiddleware, postController_1.getFeedPosts);
router.get('/school-updates', postController_1.getSchoolUpdates);
router.get('/:postId', postController_1.getPostById);
router.patch('/:postId', auth_1.authMiddleware, updatePostValidationRules, validation_1.validate, postController_1.updatePost);
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
router.post('/import-linkedin', auth_1.authMiddleware, [
    (0, express_validator_1.body)('linkedInProfile')
        .optional()
        .isURL()
        .withMessage('linkedInProfile must be a valid URL'),
    (0, express_validator_1.body)('posts')
        .isArray({ min: 1, max: 50 })
        .withMessage('posts must be an array with 1 to 50 items'),
    (0, express_validator_1.body)('posts.*.content')
        .optional()
        .isString()
        .trim()
        .isLength({ min: 1, max: 2000 })
        .withMessage('Each post content must be between 1 and 2000 characters'),
    (0, express_validator_1.body)('posts.*.title')
        .optional()
        .isString()
        .trim()
        .isLength({ max: 200 })
        .withMessage('Each post title must not exceed 200 characters'),
    (0, express_validator_1.body)('posts.*.postUrl')
        .optional()
        .isURL()
        .withMessage('Each postUrl must be a valid URL'),
    (0, express_validator_1.body)('posts.*.publishedAt')
        .optional()
        .isISO8601()
        .withMessage('Each publishedAt must be a valid ISO date')
], validation_1.validate, postController_1.importLinkedInPosts);
router.patch('/:postId/feature', auth_1.authMiddleware, auth_1.requireAdmin, postController_1.toggleFeaturePost);
exports.default = router;
//# sourceMappingURL=posts.js.map
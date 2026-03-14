import express from 'express';
import { body } from 'express-validator';
import {
  createPost,
  getAllPosts,
  getPostById,
  updatePost,
  deletePost,
  likePost,
  toggleFeaturePost,
  getFeaturedPosts,
  getSchoolUpdates,
  bookmarkPost,
  sharePost,
  getBookmarkedPosts,
  getFeedPosts
} from '../controllers/postController';
import { authMiddleware, requireAdmin } from '../middleware/auth';
import { validate } from '../middleware/validation';

const router = express.Router();

const commonPostValidationRules = [
  body('title')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Title must not exceed 200 characters'),
  body('category')
    .optional()
    .isIn(['general', 'career', 'networking', 'events', 'achievements', 'announcements'])
    .withMessage('Invalid category'),
  body('visibility')
    .optional()
    .isIn(['public', 'alumni_only', 'faculty_only', 'connections_only'])
    .withMessage('Invalid visibility option'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  body('tags.*')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Each tag must be a string and not exceed 50 characters'),
  body('isSchoolUpdate')
    .optional()
    .isBoolean()
    .withMessage('isSchoolUpdate must be a boolean'),
  body('attachments')
    .optional()
    .isArray()
    .withMessage('Attachments must be an array'),
  body('externalLinks')
    .optional()
    .isArray()
    .withMessage('External links must be an array'),
  body('externalLinks.*')
    .optional()
    .isURL()
    .withMessage('Each external link must be a valid URL'),
  body('mentions')
    .optional()
    .isArray()
    .withMessage('Mentions must be an array')
];

const createPostValidationRules = [
  body('content')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Content must not exceed 2000 characters'),
  body().custom((value) => {
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
  body('content')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Content must not exceed 2000 characters'),
  ...commonPostValidationRules
];

// Create a new post
router.post('/', authMiddleware, createPostValidationRules, validate, createPost);

// Get all posts (publicly accessible, filtering applied in controller)
router.get('/', getAllPosts);

// Get featured posts
router.get('/featured', getFeaturedPosts);

// Get bookmarked posts (authenticated users only)
router.get('/bookmarked', authMiddleware, getBookmarkedPosts);

// Get feed posts from connections (authenticated users only)
router.get('/feed', authMiddleware, getFeedPosts);

// Get school updates
router.get('/school-updates', getSchoolUpdates);

// Get a single post by ID
router.get('/:postId', getPostById);

// Update a post (author or admin/super_admin)
router.patch('/:postId', authMiddleware, updatePostValidationRules, validate, updatePost);

// Delete a post (author or admin/super_admin)
router.delete('/:postId', authMiddleware, deletePost);

// Reaction endpoints
router.post('/:postId/like', authMiddleware, likePost);

// Post with reaction type (using the same likePost endpoint)
router.post('/:postId/react', authMiddleware, [
  body('reactionType')
    .isIn(['like', 'love', 'celebrate', 'support', 'insightful', 'funny'])
    .withMessage('Invalid reaction type')
], validate, likePost);

// Bookmark endpoints 
router.post('/:postId/bookmark', authMiddleware, bookmarkPost);
router.delete('/:postId/bookmark', authMiddleware, bookmarkPost);

// Share a post
router.post('/share', authMiddleware, [
  body('originalPostId')
    .notEmpty()
    .withMessage('Original post ID is required'),
  body('content')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Share content cannot exceed 2000 characters'),
  body('visibility')
    .optional()
    .isIn(['public', 'alumni_only', 'faculty_only', 'connections_only'])
    .withMessage('Invalid visibility option'),
  body('shareType')
    .optional()
    .isIn(['quote', 'simple'])
    .withMessage('Invalid share type')
], validate, sharePost);

// Feature/unfeature a post (admin only)
router.patch('/:postId/feature', authMiddleware, requireAdmin, toggleFeaturePost);

export default router;

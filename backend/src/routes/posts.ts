import express from 'express';
import { body } from 'express-validator';
import {
  createPost,
  getAllPosts,
  getPostById,
  updatePost,
  deletePost,
  likePost,
  unlikePost,
  toggleFeaturePost,
  getFeaturedPosts,
  getSchoolUpdates
} from '../controllers/postController';
import { authMiddleware, requireAdmin } from '../middleware/auth';
import { validate } from '../middleware/validation';

const router = express.Router();

// Validation rules for creating/updating a post
const postValidationRules = [
  body('content')
    .trim()
    .isLength({ min: 1, max: 2000 })
    .withMessage('Content is required and must be between 1 and 2000 characters'),
  body('title')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Title must not exceed 200 characters'),
  body('category')
    .optional()
    .isIn(['general', 'career', 'networking', 'events', 'achievements', 'announcements'])
    .withMessage('Invalid category'),
  body('imageUrl')
    .optional()
    .custom((value) => {
      if (!value || value === '') return true; // Allow empty strings
      return /^https?:\/\//.test(value); // Validate URL format if provided
    })
    .withMessage('Image URL must be a valid URL'),
  body('visibility')
    .optional()
    .isIn(['public', 'alumni_only', 'private'])
    .withMessage('Invalid visibility option'),
  body('tags').optional().isArray().withMessage('Tags must be an array'),
  body('tags.*').optional().isString().trim().isLength({ max: 50 }).withMessage('Each tag must be a string and not exceed 50 characters'),
  body('isSchoolUpdate').optional().isBoolean().withMessage('isSchoolUpdate must be a boolean')
];

// Create a new post
router.post('/', authMiddleware, postValidationRules, validate, createPost);

// Get all posts (publicly accessible, filtering applied in controller)
router.get('/', getAllPosts);

// Get featured posts
router.get('/featured', getFeaturedPosts);

// Get school updates
router.get('/school-updates', getSchoolUpdates);

// Get a single post by ID
router.get('/:postId', getPostById);

// Update a post (author or admin/super_admin)
router.patch('/:postId', authMiddleware, postValidationRules, validate, updatePost);

// Delete a post (author or admin/super_admin)
router.delete('/:postId', authMiddleware, deletePost);

// Like/Unlike a post
router.post('/:postId/like', authMiddleware, likePost);
router.delete('/:postId/like', authMiddleware, unlikePost);

// Feature/Unfeature a post (Admin/Super Admin only)
router.patch('/:postId/feature', authMiddleware, requireAdmin, toggleFeaturePost);


export default router;

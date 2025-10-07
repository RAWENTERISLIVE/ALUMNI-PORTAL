import express from 'express';
import { body } from 'express-validator';
import {
  createComment,
  getPostComments,
  getCommentReplies,
  likeComment,
  unlikeComment,
  deleteComment
} from '../controllers/commentController';
import { authMiddleware } from '../middleware/auth';
import { validate } from '../middleware/validation';

const router = express.Router();

// Validation rule for creating a comment
const commentValidationRules = [
  body('content')
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Comment content is required and must not exceed 1000 characters')
];

// Routes for comment functionality
router.post(
  '/posts/:postId/comments',
  authMiddleware,
  commentValidationRules,
  validate,
  createComment
);

router.get('/posts/:postId/comments', getPostComments);

router.get('/comments/:commentId/replies', getCommentReplies);

router.post('/comments/:commentId/like', authMiddleware, likeComment);

router.delete('/comments/:commentId/like', authMiddleware, unlikeComment);

router.delete('/comments/:commentId', authMiddleware, deleteComment);

export default router;

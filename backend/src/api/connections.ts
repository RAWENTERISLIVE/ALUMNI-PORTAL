import express from 'express';
import { body } from 'express-validator';
import {
  sendConnectionRequest,
  acceptConnectionRequest,
  rejectConnectionRequest,
  getReceivedConnectionRequests,
  getSentConnectionRequests,
  getUserConnections,
  removeConnection,
  getConnectionStatus
} from '../controllers/connectionController';
import { authMiddleware } from '../middleware/auth';
import { validate } from '../middleware/validation';

const router = express.Router();

// Validation rules
const sendRequestValidation = [
  body('userId').isMongoId().withMessage('Valid user ID is required'),
  body('message')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Message must not exceed 500 characters')
    .trim()
];

// Routes

// Get user's connections
router.get('/', authMiddleware, getUserConnections);

// Get received connection requests
router.get('/requests/received', authMiddleware, getReceivedConnectionRequests);

// Get sent connection requests
router.get('/requests/sent', authMiddleware, getSentConnectionRequests);

// Get connection status with another user
router.get('/:userId/status', authMiddleware, getConnectionStatus);

// Send connection request
router.post('/request', authMiddleware, sendRequestValidation, validate, sendConnectionRequest);

// Accept connection request
router.patch('/accept/:requestId', authMiddleware, acceptConnectionRequest);

// Reject connection request
router.patch('/reject/:requestId', authMiddleware, rejectConnectionRequest);

// Remove connection
router.delete('/:connectionId', authMiddleware, removeConnection);

export default router;

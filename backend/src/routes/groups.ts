import { Router } from 'express';
import {
  createGroup,
  getGroups,
  getGroup,
  joinGroup,
  leaveGroup,
  getGroupMessages,
  postGroupMessage, // Corrected from sendGroupMessage
} from '../controllers/groupController';
import { authMiddleware as protect } from '../middleware/auth'; // Corrected to use authMiddleware

const router = Router();

router.route('/')
  .get(protect, getGroups)
  .post(protect, createGroup);

router.route('/:groupId') // Corrected to use a consistent parameter name
  .get(protect, getGroup);

router.route('/:groupId/join').post(protect, joinGroup);
router.route('/:groupId/leave').post(protect, leaveGroup);

// Add these routes for messages
router.route('/:groupId/messages')
  .get(protect, getGroupMessages)
  .post(protect, postGroupMessage);

export default router;

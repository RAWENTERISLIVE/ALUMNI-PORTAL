import { Router } from 'express';
import {
  createGroup,
  getGroups,
  getUserGroups,
  getGroup,
  updateGroup,
  deleteGroup,
  joinGroup,
  leaveGroup,
  getGroupJoinRequests,
  respondToGroupJoinRequest,
  getGroupMessages,
  postGroupMessage, // Corrected from sendGroupMessage
} from '../controllers/groupController';
import { authMiddleware as protect } from '../middleware/auth'; // Corrected to use authMiddleware

const router = Router();

router.route('/')
  .get(protect, getGroups)
  .post(protect, createGroup);

router.route('/user')
  .get(protect, getUserGroups);

router.route('/my-groups')
  .get(protect, getUserGroups);

router.route('/:groupId') // Corrected to use a consistent parameter name
  .get(protect, getGroup)
  .put(protect, updateGroup)
  .delete(protect, deleteGroup);

router.route('/:groupId/join').post(protect, joinGroup);
router.route('/:groupId/leave').post(protect, leaveGroup);
router.route('/:groupId/join-requests').get(protect, getGroupJoinRequests);
router.route('/:groupId/join-requests/:requestId/respond').patch(protect, respondToGroupJoinRequest);

// Add these routes for messages
router.route('/:groupId/messages')
  .get(protect, getGroupMessages)
  .post(protect, postGroupMessage);

export default router;

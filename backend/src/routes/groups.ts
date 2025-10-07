import { Router } from 'express';
import {
  createGroup,
  getGroups,
  getUserGroups,
  getGroup,
  joinGroup,
  leaveGroup,
  getGroupMessages,
  postGroupMessage,
  getGroupRequests,
  approveJoinRequest,
  rejectJoinRequest,
  makeAdmin,
  removeMember,
  updateGroup,
  deleteGroup,
  getGroupStats
} from '../controllers/groupController';
import { authMiddleware as protect } from '../middleware/auth';

const router = Router();

router.route('/')
  .get(protect, getGroups)
  .post(protect, createGroup);

router.route('/user')
  .get(protect, getUserGroups);

router.route('/:groupId')
  .get(protect, getGroup)
  .patch(protect, updateGroup)
  .delete(protect, deleteGroup);

router.route('/:groupId/join').post(protect, joinGroup);
router.route('/:groupId/leave').post(protect, leaveGroup);

// Admin routes
router.route('/:groupId/requests').get(protect, getGroupRequests);
router.route('/:groupId/approve/:userId').post(protect, approveJoinRequest);
router.route('/:groupId/reject/:userId').post(protect, rejectJoinRequest);
router.route('/:groupId/make-admin/:userId').post(protect, makeAdmin);
router.route('/:groupId/members/:userId').delete(protect, removeMember);
router.route('/:groupId/stats').get(protect, getGroupStats);

// Message routes
router.route('/:groupId/messages')
  .get(protect, getGroupMessages)
  .post(protect, postGroupMessage);

export default router;

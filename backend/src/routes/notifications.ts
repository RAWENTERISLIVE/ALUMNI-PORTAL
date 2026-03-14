import express from 'express';
import { authMiddleware } from '../middleware/auth';
import {
  dismissNotification,
  getNotifications,
  markAllNotificationsSeen,
  markNotificationSeen
} from '../controllers/notificationController';

const router = express.Router();

router.get('/', authMiddleware, getNotifications);
router.patch('/mark-all-seen', authMiddleware, markAllNotificationsSeen);
router.patch('/:notificationId/seen', authMiddleware, markNotificationSeen);
router.delete('/:notificationId', authMiddleware, dismissNotification);

export default router;

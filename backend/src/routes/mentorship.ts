import express from 'express';
import {
  getMentors,
  becomeMentor,
  requestMentorship,
  getMentorshipProfile,
  respondToRequest,
} from '../controllers/mentorshipController';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();

router.get('/mentors', getMentors);
router.post('/become-mentor', authMiddleware, becomeMentor);
router.get('/profile', authMiddleware, getMentorshipProfile);
router.post('/request/:mentorId', authMiddleware, requestMentorship);
router.post('/request/:requestId/:action', authMiddleware, respondToRequest);

export default router;

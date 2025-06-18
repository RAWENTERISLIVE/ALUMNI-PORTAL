import express from 'express';
import {
  getMentors,
  becomeMentor,
  requestMentorship,
  getMentorshipProfile,
  respondToRequest,
} from '../controllers/mentorshipController';

const router = express.Router();

router.get('/mentors', getMentors);
router.post('/become-mentor', becomeMentor);
router.get('/profile', getMentorshipProfile);
router.post('/request/:mentorId', requestMentorship);
router.post('/request/:requestId/:action', respondToRequest);

export default router;

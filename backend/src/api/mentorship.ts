import express from 'express';
import {
  getMentors,
  becomeMentor,
  requestMentorship,
  getMentorshipProfile,
  respondToRequest,
  getMentorRequests,
  getMenteeRequests,
} from '../controllers/mentorshipController';

const router = express.Router();

// Default mentorship endpoint - redirect to mentors
router.get('/', getMentors);
router.get('/mentors', getMentors);
router.post('/become-mentor', becomeMentor);
router.get('/profile', getMentorshipProfile);
router.post('/request/:mentorId', requestMentorship);
router.post('/request/:requestId/:action', respondToRequest);
router.get('/requests/mentor', getMentorRequests);
router.get('/requests/mentee', getMenteeRequests);

export default router;

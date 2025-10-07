import express from 'express';
import { body } from 'express-validator';
import {
  getEvents,
  getUpcomingEvents,
  getEvent,
  createEvent,
  updateEvent,
  deleteEvent,
  rsvpEvent,
  cancelRsvp,
  getUserEvents
} from '../controllers/eventController';
import { authMiddleware } from '../middleware/auth';
import { validate } from '../middleware/validation';

const router = express.Router();

// Validation rules
const createEventValidation = [
  body('title')
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage('Title must be between 3 and 200 characters'),
  body('description')
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage('Description must be between 10 and 2000 characters'),
  body('date')
    .isISO8601()
    .toDate()
    .withMessage('Please provide a valid date'),
  body('time')
    .trim()
    .notEmpty()
    .withMessage('Time is required'),
  body('location')
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage('Location must be between 3 and 200 characters'),
  body('category')
    .optional()
    .isIn(['networking', 'career', 'academic', 'social', 'workshop', 'other'])
    .withMessage('Invalid category'),
  body('isVirtual')
    .optional()
    .isBoolean()
    .withMessage('isVirtual must be a boolean'),
  body('maxAttendees')
    .optional()
    .isInt({ min: 1, max: 10000 })
    .withMessage('Max attendees must be between 1 and 10000')
];

// Routes
router.get('/', authMiddleware, getEvents);
router.get('/upcoming', authMiddleware, getUpcomingEvents);
router.get('/my-events', authMiddleware, getUserEvents);
router.get('/:eventId', authMiddleware, getEvent);

router.post('/', authMiddleware, createEventValidation, validate, createEvent);
router.patch('/:eventId', authMiddleware, createEventValidation, validate, updateEvent);
router.delete('/:eventId', authMiddleware, deleteEvent);

router.post('/:eventId/rsvp', authMiddleware, rsvpEvent);
router.delete('/:eventId/rsvp', authMiddleware, cancelRsvp);

export default router;

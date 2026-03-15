"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const express_validator_1 = require("express-validator");
const eventController_1 = require("../controllers/eventController");
const auth_1 = require("../middleware/auth");
const validation_1 = require("../middleware/validation");
const router = express_1.default.Router();
const createEventValidation = [
    (0, express_validator_1.body)('title')
        .trim()
        .isLength({ min: 3, max: 200 })
        .withMessage('Title must be between 3 and 200 characters'),
    (0, express_validator_1.body)('description')
        .trim()
        .isLength({ min: 10, max: 2000 })
        .withMessage('Description must be between 10 and 2000 characters'),
    (0, express_validator_1.body)('date')
        .isISO8601()
        .toDate()
        .withMessage('Please provide a valid date'),
    (0, express_validator_1.body)('time')
        .trim()
        .notEmpty()
        .withMessage('Time is required'),
    (0, express_validator_1.body)('location')
        .trim()
        .isLength({ min: 3, max: 200 })
        .withMessage('Location must be between 3 and 200 characters'),
    (0, express_validator_1.body)('category')
        .optional()
        .isIn(['networking', 'career', 'academic', 'social', 'workshop', 'other'])
        .withMessage('Invalid category'),
    (0, express_validator_1.body)('isVirtual')
        .optional()
        .isBoolean()
        .withMessage('isVirtual must be a boolean'),
    (0, express_validator_1.body)('maxAttendees')
        .optional()
        .isInt({ min: 1, max: 10000 })
        .withMessage('Max attendees must be between 1 and 10000')
];
router.get('/', auth_1.authMiddleware, eventController_1.getEvents);
router.get('/upcoming', auth_1.authMiddleware, eventController_1.getUpcomingEvents);
router.get('/my-events', auth_1.authMiddleware, eventController_1.getUserEvents);
router.get('/:eventId/attendees', auth_1.authMiddleware, eventController_1.getEventAttendees);
router.get('/:eventId', auth_1.authMiddleware, eventController_1.getEvent);
router.post('/', auth_1.authMiddleware, createEventValidation, validation_1.validate, eventController_1.createEvent);
router.patch('/:eventId', auth_1.authMiddleware, createEventValidation, validation_1.validate, eventController_1.updateEvent);
router.delete('/:eventId', auth_1.authMiddleware, eventController_1.deleteEvent);
router.post('/:eventId/rsvp', auth_1.authMiddleware, eventController_1.rsvpEvent);
router.delete('/:eventId/rsvp', auth_1.authMiddleware, eventController_1.cancelRsvp);
exports.default = router;
//# sourceMappingURL=events.js.map
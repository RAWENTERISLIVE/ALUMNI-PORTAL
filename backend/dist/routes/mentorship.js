"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const mentorshipController_1 = require("../controllers/mentorshipController");
const router = express_1.default.Router();
router.get('/', mentorshipController_1.getMentors);
router.get('/mentors', mentorshipController_1.getMentors);
router.post('/become-mentor', mentorshipController_1.becomeMentor);
router.get('/profile', mentorshipController_1.getMentorshipProfile);
router.post('/request/:mentorId', mentorshipController_1.requestMentorship);
router.post('/request/:requestId/:action', mentorshipController_1.respondToRequest);
router.get('/requests/mentor', mentorshipController_1.getMentorRequests);
router.get('/requests/mentee', mentorshipController_1.getMenteeRequests);
exports.default = router;
//# sourceMappingURL=mentorship.js.map
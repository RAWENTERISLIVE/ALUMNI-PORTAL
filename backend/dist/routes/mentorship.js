"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const mentorshipController_1 = require("../controllers/mentorshipController");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
router.get('/mentors', mentorshipController_1.getMentors);
router.post('/become-mentor', auth_1.authMiddleware, mentorshipController_1.becomeMentor);
router.get('/profile', auth_1.authMiddleware, mentorshipController_1.getMentorshipProfile);
router.post('/request/:mentorId', auth_1.authMiddleware, mentorshipController_1.requestMentorship);
router.post('/request/:requestId/:action', auth_1.authMiddleware, mentorshipController_1.respondToRequest);
exports.default = router;
//# sourceMappingURL=mentorship.js.map
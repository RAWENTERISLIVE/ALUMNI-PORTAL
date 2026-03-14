"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const notificationController_1 = require("../controllers/notificationController");
const router = express_1.default.Router();
router.get('/', auth_1.authMiddleware, notificationController_1.getNotifications);
router.patch('/mark-all-seen', auth_1.authMiddleware, notificationController_1.markAllNotificationsSeen);
router.patch('/:notificationId/seen', auth_1.authMiddleware, notificationController_1.markNotificationSeen);
router.delete('/:notificationId', auth_1.authMiddleware, notificationController_1.dismissNotification);
exports.default = router;
//# sourceMappingURL=notifications.js.map
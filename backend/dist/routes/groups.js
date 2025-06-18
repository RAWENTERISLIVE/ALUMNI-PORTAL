"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const groupController_1 = require("../controllers/groupController");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
router.route('/')
    .post(auth_1.authMiddleware, groupController_1.createGroup)
    .get(auth_1.authMiddleware, groupController_1.getGroups);
router.route('/:groupId')
    .get(auth_1.authMiddleware, groupController_1.getGroup);
router.route('/:groupId/join')
    .post(auth_1.authMiddleware, groupController_1.joinGroup);
router.route('/:groupId/leave')
    .post(auth_1.authMiddleware, groupController_1.leaveGroup);
router.route('/:groupId/messages')
    .get(auth_1.authMiddleware, groupController_1.getGroupMessages)
    .post(auth_1.authMiddleware, groupController_1.postGroupMessage);
exports.default = router;
//# sourceMappingURL=groups.js.map
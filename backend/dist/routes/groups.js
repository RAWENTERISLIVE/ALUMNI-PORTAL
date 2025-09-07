"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const groupController_1 = require("../controllers/groupController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.route('/')
    .get(auth_1.authMiddleware, groupController_1.getGroups)
    .post(auth_1.authMiddleware, groupController_1.createGroup);
router.route('/user')
    .get(auth_1.authMiddleware, groupController_1.getUserGroups);
router.route('/:groupId')
    .get(auth_1.authMiddleware, groupController_1.getGroup);
router.route('/:groupId/join').post(auth_1.authMiddleware, groupController_1.joinGroup);
router.route('/:groupId/leave').post(auth_1.authMiddleware, groupController_1.leaveGroup);
router.route('/:groupId/messages')
    .get(auth_1.authMiddleware, groupController_1.getGroupMessages)
    .post(auth_1.authMiddleware, groupController_1.postGroupMessage);
exports.default = router;
//# sourceMappingURL=groups.js.map
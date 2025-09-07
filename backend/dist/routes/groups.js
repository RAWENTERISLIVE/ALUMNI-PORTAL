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
    .get(auth_1.authMiddleware, groupController_1.getGroup)
    .patch(auth_1.authMiddleware, groupController_1.updateGroup)
    .delete(auth_1.authMiddleware, groupController_1.deleteGroup);
router.route('/:groupId/join').post(auth_1.authMiddleware, groupController_1.joinGroup);
router.route('/:groupId/leave').post(auth_1.authMiddleware, groupController_1.leaveGroup);
router.route('/:groupId/requests').get(auth_1.authMiddleware, groupController_1.getGroupRequests);
router.route('/:groupId/approve/:userId').post(auth_1.authMiddleware, groupController_1.approveJoinRequest);
router.route('/:groupId/reject/:userId').post(auth_1.authMiddleware, groupController_1.rejectJoinRequest);
router.route('/:groupId/make-admin/:userId').post(auth_1.authMiddleware, groupController_1.makeAdmin);
router.route('/:groupId/members/:userId').delete(auth_1.authMiddleware, groupController_1.removeMember);
router.route('/:groupId/stats').get(auth_1.authMiddleware, groupController_1.getGroupStats);
router.route('/:groupId/messages')
    .get(auth_1.authMiddleware, groupController_1.getGroupMessages)
    .post(auth_1.authMiddleware, groupController_1.postGroupMessage);
exports.default = router;
//# sourceMappingURL=groups.js.map
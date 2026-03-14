"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.postGroupMessage = exports.getGroupMessages = exports.getUserGroups = exports.getGroup = exports.leaveGroup = exports.joinGroup = exports.deleteGroup = exports.updateGroup = exports.getGroupById = exports.getGroups = exports.createGroup = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
const errorHandler_1 = require("../middleware/errorHandler");
const getGroupId = (req) => req.params.groupId || req.params.id;
const isUserMember = (members, userId) => members.some((member) => member.id === userId);
const getRequiredGroupId = (req, res) => {
    const groupId = getGroupId(req);
    if (!groupId) {
        res.status(400).json({ message: 'Group ID is required' });
        return null;
    }
    return groupId;
};
exports.createGroup = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    if (!req.user?.id) {
        res.status(401).json({ message: 'Not authenticated' });
        return;
    }
    const group = await prisma_1.default.group.create({
        data: { ...req.body, creatorId: req.user.id, members: { connect: { id: req.user.id } } },
        include: { creator: true, members: true }
    });
    res.status(201).json({ success: true, data: group });
});
exports.getGroups = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    if (!req.user?.id) {
        res.status(401).json({ message: 'Not authenticated' });
        return;
    }
    const groups = await prisma_1.default.group.findMany({
        where: {
            OR: [
                { privacy: 'public' },
                { creatorId: req.user.id },
                { members: { some: { id: req.user.id } } }
            ]
        },
        include: { creator: true, members: true },
        orderBy: { createdAt: 'desc' }
    });
    res.status(200).json({ success: true, data: groups });
});
exports.getGroupById = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    if (!req.user?.id) {
        res.status(401).json({ message: 'Not authenticated' });
        return;
    }
    const groupId = getRequiredGroupId(req, res);
    if (!groupId)
        return;
    const group = await prisma_1.default.group.findUnique({
        where: { id: groupId },
        include: { creator: true, members: true, messages: { take: 20, orderBy: { createdAt: 'desc' } } }
    });
    if (!group) {
        res.status(404).json({ message: 'Group not found' });
        return;
    }
    const canAccess = group.privacy !== 'private' || group.creatorId === req.user.id || isUserMember(group.members, req.user.id);
    if (!canAccess) {
        res.status(403).json({ message: 'Not authorized to access this group' });
        return;
    }
    res.status(200).json({ success: true, data: group });
});
exports.updateGroup = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const groupId = getRequiredGroupId(req, res);
    if (!groupId)
        return;
    const group = await prisma_1.default.group.findUnique({ where: { id: groupId } });
    if (!group || group.creatorId !== req.user?.id) {
        res.status(403).json({ message: 'Not authorized' });
        return;
    }
    const updated = await prisma_1.default.group.update({ where: { id: groupId }, data: req.body, include: { creator: true, members: true } });
    res.status(200).json({ success: true, data: updated });
});
exports.deleteGroup = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const groupId = getRequiredGroupId(req, res);
    if (!groupId)
        return;
    const group = await prisma_1.default.group.findUnique({ where: { id: groupId } });
    if (!group || group.creatorId !== req.user?.id) {
        res.status(403).json({ message: 'Not authorized' });
        return;
    }
    await prisma_1.default.group.delete({ where: { id: groupId } });
    res.status(200).json({ success: true, message: 'Group deleted' });
});
exports.joinGroup = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    if (!req.user?.id) {
        res.status(401).json({ message: 'Not authenticated' });
        return;
    }
    const groupId = getRequiredGroupId(req, res);
    if (!groupId)
        return;
    const group = await prisma_1.default.group.findUnique({
        where: { id: groupId },
        include: { members: { select: { id: true } } }
    });
    if (!group) {
        res.status(404).json({ message: 'Group not found' });
        return;
    }
    if (group.privacy === 'private') {
        res.status(403).json({ success: false, message: 'Private groups require an invitation to join' });
        return;
    }
    if (isUserMember(group.members, req.user.id)) {
        res.status(200).json({ success: true, message: 'Already a member of this group' });
        return;
    }
    await prisma_1.default.group.update({
        where: { id: groupId },
        data: { members: { connect: { id: req.user.id } } }
    });
    res.status(200).json({ success: true, message: 'Joined group' });
});
exports.leaveGroup = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    if (!req.user?.id) {
        res.status(401).json({ message: 'Not authenticated' });
        return;
    }
    const groupId = getRequiredGroupId(req, res);
    if (!groupId)
        return;
    await prisma_1.default.group.update({
        where: { id: groupId },
        data: { members: { disconnect: { id: req.user.id } } }
    });
    res.status(200).json({ success: true, message: 'Left group' });
});
exports.getGroup = exports.getGroupById;
exports.getUserGroups = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    if (!req.user?.id) {
        res.status(401).json({ message: 'Not authenticated' });
        return;
    }
    const groups = await prisma_1.default.group.findMany({
        where: { members: { some: { id: req.user.id } } },
        include: { creator: true, members: true },
        orderBy: { createdAt: 'desc' }
    });
    res.status(200).json({ success: true, data: groups });
});
exports.getGroupMessages = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    if (!req.user?.id) {
        res.status(401).json({ message: 'Not authenticated' });
        return;
    }
    const groupId = getRequiredGroupId(req, res);
    if (!groupId)
        return;
    const group = await prisma_1.default.group.findUnique({
        where: { id: groupId },
        include: { members: { select: { id: true } } }
    });
    if (!group) {
        res.status(404).json({ message: 'Group not found' });
        return;
    }
    const canRead = group.privacy !== 'private' || group.creatorId === req.user.id || isUserMember(group.members, req.user.id);
    if (!canRead) {
        res.status(403).json({ message: 'Not authorized to view messages in this group' });
        return;
    }
    const messages = await prisma_1.default.groupMessage.findMany({
        where: { groupId },
        include: { author: { select: { id: true, name: true, profileImage: true } } },
        orderBy: { createdAt: 'asc' },
        take: 100
    });
    res.status(200).json({ success: true, data: messages });
});
exports.postGroupMessage = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    if (!req.user?.id) {
        res.status(401).json({ message: 'Not authenticated' });
        return;
    }
    const groupId = getRequiredGroupId(req, res);
    if (!groupId)
        return;
    const group = await prisma_1.default.group.findUnique({
        where: { id: groupId },
        include: { members: { select: { id: true } } }
    });
    if (!group) {
        res.status(404).json({ message: 'Group not found' });
        return;
    }
    if (!isUserMember(group.members, req.user.id)) {
        res.status(403).json({ message: 'Join this group to post messages' });
        return;
    }
    const content = String(req.body?.content || '').trim();
    if (!content) {
        res.status(400).json({ message: 'Message content is required' });
        return;
    }
    const message = await prisma_1.default.groupMessage.create({
        data: {
            groupId,
            authorId: req.user.id,
            content
        },
        include: { author: { select: { id: true, name: true, profileImage: true } } }
    });
    await prisma_1.default.group.update({ where: { id: groupId }, data: { lastActivity: new Date() } });
    res.status(201).json({ success: true, data: message });
});
//# sourceMappingURL=groupController.js.map
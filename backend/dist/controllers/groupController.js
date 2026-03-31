"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.postGroupMessage = exports.getGroupMessages = exports.getUserGroups = exports.respondToGroupJoinRequest = exports.getGroupJoinRequests = exports.getGroup = exports.leaveGroup = exports.acceptGroupInviteLink = exports.createGroupInviteLink = exports.getInvitableUsers = exports.inviteGroupMember = exports.joinGroup = exports.deleteGroup = exports.updateGroup = exports.getGroupById = exports.getGroups = exports.createGroup = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_1 = __importDefault(require("../config/prisma"));
const errorHandler_1 = require("../middleware/errorHandler");
const notifications_1 = require("../utils/notifications");
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
const getSafeActorName = async (userId) => {
    const actor = await prisma_1.default.user.findUnique({
        where: { id: userId },
        select: { name: true, firstName: true, email: true }
    });
    return actor?.name || actor?.firstName || actor?.email?.split('@')[0] || 'A member';
};
const createSystemMessage = async (groupId, authorId, content) => {
    await prisma_1.default.groupMessage.create({
        data: {
            groupId,
            authorId,
            content,
            messageType: 'system'
        }
    });
};
const isGroupAdmin = (group, userId) => group.creatorId === userId;
const normalizeRole = (role) => (role || '').toLowerCase();
const isWatcherRole = (role) => {
    const normalized = normalizeRole(role);
    return normalized === 'admin' || normalized === 'super_admin' || normalized === 'moderator';
};
const isSuperAdminRole = (role) => normalizeRole(role) === 'super_admin';
const normalizeInviteEmail = (email) => {
    if (typeof email !== 'string')
        return '';
    return email.trim().toLowerCase();
};
const getInviteTokenSecret = () => process.env.JWT_SECRET || 'your-secret-key';
const getInviteLinkBaseUrl = () => {
    const raw = process.env.FRONTEND_URL || process.env.CLIENT_URL || 'http://localhost';
    return raw.replace(/\/$/, '');
};
const isGroupMemberId = (members, userId) => members.some((member) => member.id === userId);
const getNextAdminCandidateId = async (groupId, currentAdminId, memberIds) => {
    const candidateIds = memberIds.filter((id) => id !== currentAdminId);
    if (candidateIds.length === 0)
        return null;
    const joinMessages = await prisma_1.default.groupMessage.findMany({
        where: {
            groupId,
            messageType: 'system',
            authorId: { in: candidateIds },
            content: {
                contains: 'joined the group',
                mode: 'insensitive'
            }
        },
        select: { authorId: true, createdAt: true },
        orderBy: { createdAt: 'asc' }
    });
    const seen = new Set();
    for (const message of joinMessages) {
        if (!seen.has(message.authorId)) {
            seen.add(message.authorId);
            return message.authorId;
        }
    }
    const fallbackUsers = await prisma_1.default.user.findMany({
        where: { id: { in: candidateIds } },
        select: { id: true, createdAt: true },
        orderBy: { createdAt: 'asc' }
    });
    return fallbackUsers[0]?.id || null;
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
    const isWatcher = isWatcherRole(req.user.role);
    const queryOptions = {
        include: { creator: true, members: true },
        orderBy: { createdAt: 'desc' }
    };
    const groups = isWatcher
        ? await prisma_1.default.group.findMany(queryOptions)
        : await prisma_1.default.group.findMany({
            ...queryOptions,
            where: {
                OR: [
                    { privacy: 'public' },
                    { creatorId: req.user.id },
                    { members: { some: { id: req.user.id } } }
                ]
            }
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
        include: {
            creator: { select: { id: true, name: true, profileImage: true, email: true } },
            members: { select: { id: true, name: true, profileImage: true, email: true } }
        }
    });
    if (!group) {
        res.status(404).json({ message: 'Group not found' });
        return;
    }
    const canAccess = isWatcherRole(req.user.role) ||
        group.privacy !== 'private' ||
        group.creatorId === req.user.id ||
        isUserMember(group.members, req.user.id);
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
    const payload = req.body;
    const updateData = {};
    if (typeof payload.name === 'string')
        updateData.name = payload.name.trim();
    if (typeof payload.description === 'string')
        updateData.description = payload.description.trim();
    if (payload.privacy === 'public' || payload.privacy === 'private')
        updateData.privacy = payload.privacy;
    if (typeof payload.category === 'string')
        updateData.category = payload.category.trim();
    const updated = await prisma_1.default.group.update({
        where: { id: groupId },
        data: updateData,
        include: {
            creator: { select: { id: true, name: true, profileImage: true, email: true } },
            members: { select: { id: true, name: true, profileImage: true, email: true } }
        }
    });
    res.status(200).json({ success: true, data: updated });
});
exports.deleteGroup = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const groupId = getRequiredGroupId(req, res);
    if (!groupId)
        return;
    const group = await prisma_1.default.group.findUnique({ where: { id: groupId } });
    if (!group) {
        res.status(404).json({ success: false, message: 'Group not found' });
        return;
    }
    const canDelete = group.creatorId === req.user?.id || isSuperAdminRole(req.user?.role);
    if (!canDelete) {
        res.status(403).json({ success: false, message: 'Not authorized' });
        return;
    }
    await prisma_1.default.group.delete({ where: { id: groupId } });
    res.status(200).json({ success: true, message: 'Group deleted successfully' });
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
        const existingRequest = await prisma_1.default.groupJoinRequest.findUnique({
            where: {
                groupId_requesterId: {
                    groupId,
                    requesterId: req.user.id
                }
            }
        });
        if (existingRequest?.status === 'invited') {
            const alreadyMember = isUserMember(group.members, req.user.id);
            if (alreadyMember) {
                res.status(200).json({ success: true, message: 'Already a member of this group' });
                return;
            }
            await prisma_1.default.$transaction(async (tx) => {
                await tx.groupJoinRequest.update({
                    where: { id: existingRequest.id },
                    data: {
                        status: 'approved',
                        reviewedById: existingRequest.reviewedById || group.creatorId,
                        reviewedAt: new Date()
                    }
                });
                await tx.group.update({
                    where: { id: groupId },
                    data: {
                        members: { connect: { id: req.user.id } },
                        memberCount: { increment: 1 },
                        lastActivity: new Date()
                    }
                });
            });
            const actorName = await getSafeActorName(req.user.id);
            await createSystemMessage(groupId, req.user.id, `${actorName} joined the group`);
            res.status(200).json({ success: true, message: 'Joined private group invitation' });
            return;
        }
        if (existingRequest?.status === 'pending') {
            res.status(200).json({ success: true, message: 'Join request already pending admin approval', requestStatus: 'pending' });
            return;
        }
        if (existingRequest?.status === 'approved') {
            res.status(200).json({ success: true, message: 'Join request already approved', requestStatus: 'approved' });
            return;
        }
        if (existingRequest) {
            await prisma_1.default.groupJoinRequest.update({
                where: { id: existingRequest.id },
                data: {
                    status: 'pending',
                    reviewedById: null,
                    reviewedAt: null
                }
            });
        }
        else {
            await prisma_1.default.groupJoinRequest.create({
                data: {
                    groupId,
                    requesterId: req.user.id,
                    status: 'pending'
                }
            });
        }
        const actorName = await getSafeActorName(req.user.id);
        await (0, notifications_1.createNotification)({
            userId: group.creatorId,
            title: 'New group join request',
            message: `${actorName} requested to join ${group.name}.`,
            type: 'group_join_request',
            actionUrl: '/groups',
            metadata: { groupId, requesterId: req.user.id }
        });
        res.status(200).json({ success: true, message: 'Join request sent to admin', requestStatus: 'pending' });
        return;
    }
    if (isUserMember(group.members, req.user.id)) {
        res.status(200).json({ success: true, message: 'Already a member of this group' });
        return;
    }
    await prisma_1.default.group.update({
        where: { id: groupId },
        data: {
            members: { connect: { id: req.user.id } },
            memberCount: { increment: 1 },
            lastActivity: new Date()
        }
    });
    const actorName = await getSafeActorName(req.user.id);
    await createSystemMessage(groupId, req.user.id, `${actorName} joined the group`);
    res.status(200).json({ success: true, message: 'Joined group' });
});
exports.inviteGroupMember = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    if (!req.user?.id) {
        res.status(401).json({ success: false, message: 'Not authenticated' });
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
        res.status(404).json({ success: false, message: 'Group not found' });
        return;
    }
    const canInvite = isGroupAdmin(group, req.user.id) || isWatcherRole(req.user.role);
    if (!canInvite) {
        res.status(403).json({ success: false, message: 'Only group admin or watcher roles can invite members' });
        return;
    }
    if (group.privacy !== 'private') {
        res.status(400).json({ success: false, message: 'Invites are available only for private groups' });
        return;
    }
    const payload = req.body;
    const invitedEmail = normalizeInviteEmail(payload.email);
    const invitedUserId = typeof payload.userId === 'string' ? payload.userId.trim() : '';
    if (!invitedEmail && !invitedUserId) {
        res.status(400).json({ success: false, message: 'Provide invite email or userId' });
        return;
    }
    const invitedUser = invitedUserId
        ? await prisma_1.default.user.findUnique({
            where: { id: invitedUserId },
            select: { id: true, email: true, name: true }
        })
        : await prisma_1.default.user.findUnique({
            where: { email: invitedEmail },
            select: { id: true, email: true, name: true }
        });
    if (!invitedUser) {
        res.status(404).json({ success: false, message: 'User not found for provided invite details' });
        return;
    }
    if (invitedUser.id === req.user.id) {
        res.status(400).json({ success: false, message: 'You are already part of this group' });
        return;
    }
    if (isUserMember(group.members, invitedUser.id)) {
        res.status(200).json({ success: true, message: `${invitedUser.name || invitedUser.email} is already a member` });
        return;
    }
    const existingRequest = await prisma_1.default.groupJoinRequest.findUnique({
        where: {
            groupId_requesterId: {
                groupId,
                requesterId: invitedUser.id
            }
        }
    });
    if (existingRequest?.status === 'invited') {
        res.status(200).json({ success: true, message: `Invitation already sent to ${invitedUser.email}` });
        return;
    }
    if (existingRequest) {
        await prisma_1.default.groupJoinRequest.update({
            where: { id: existingRequest.id },
            data: {
                status: 'invited',
                reviewedById: req.user.id,
                reviewedAt: new Date()
            }
        });
    }
    else {
        await prisma_1.default.groupJoinRequest.create({
            data: {
                groupId,
                requesterId: invitedUser.id,
                status: 'invited',
                reviewedById: req.user.id,
                reviewedAt: new Date()
            }
        });
    }
    const inviterName = await getSafeActorName(req.user.id);
    await (0, notifications_1.createNotification)({
        userId: invitedUser.id,
        title: 'Private group invitation',
        message: `${inviterName} invited you to join ${group.name}.`,
        type: 'group_invitation',
        actionUrl: '/groups',
        metadata: {
            groupId,
            inviterId: req.user.id,
            invitedUserId: invitedUser.id
        }
    });
    res.status(200).json({
        success: true,
        message: `Invitation sent to ${invitedUser.email}`,
        data: {
            invitedUser: {
                id: invitedUser.id,
                email: invitedUser.email,
                name: invitedUser.name || invitedUser.email.split('@')[0]
            }
        }
    });
});
exports.getInvitableUsers = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    if (!req.user?.id) {
        res.status(401).json({ success: false, message: 'Not authenticated' });
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
        res.status(404).json({ success: false, message: 'Group not found' });
        return;
    }
    const canInvite = isGroupAdmin(group, req.user.id) || isWatcherRole(req.user.role);
    if (!canInvite) {
        res.status(403).json({ success: false, message: 'Only group admin or watcher roles can search invitable users' });
        return;
    }
    const query = typeof req.query.query === 'string' ? req.query.query.trim() : '';
    const limit = Math.min(Number.parseInt(String(req.query.limit || '20'), 10) || 20, 50);
    const where = {
        status: 'ACTIVE',
        id: {
            notIn: [req.user.id, ...group.members.map((member) => member.id)]
        }
    };
    if (query) {
        where.OR = [
            { name: { contains: query, mode: 'insensitive' } },
            { firstName: { contains: query, mode: 'insensitive' } },
            { lastName: { contains: query, mode: 'insensitive' } },
            { email: { contains: query, mode: 'insensitive' } },
            { location: { contains: query, mode: 'insensitive' } },
            { city: { contains: query, mode: 'insensitive' } },
            { country: { contains: query, mode: 'insensitive' } },
            { company: { contains: query, mode: 'insensitive' } },
            { jobTitle: { contains: query, mode: 'insensitive' } }
        ];
    }
    const users = await prisma_1.default.user.findMany({
        where,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
            id: true,
            name: true,
            firstName: true,
            lastName: true,
            email: true,
            location: true,
            city: true,
            country: true,
            company: true,
            jobTitle: true,
            profileImage: true
        }
    });
    res.status(200).json({ success: true, data: users });
});
exports.createGroupInviteLink = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    if (!req.user?.id) {
        res.status(401).json({ success: false, message: 'Not authenticated' });
        return;
    }
    const groupId = getRequiredGroupId(req, res);
    if (!groupId)
        return;
    const group = await prisma_1.default.group.findUnique({
        where: { id: groupId },
        select: {
            id: true,
            name: true,
            privacy: true,
            creatorId: true
        }
    });
    if (!group) {
        res.status(404).json({ success: false, message: 'Group not found' });
        return;
    }
    const canInvite = isGroupAdmin(group, req.user.id) || isWatcherRole(req.user.role);
    if (!canInvite) {
        res.status(403).json({ success: false, message: 'Only group admin or watcher roles can create invite links' });
        return;
    }
    if (group.privacy !== 'private') {
        res.status(400).json({ success: false, message: 'Invite links are available only for private groups' });
        return;
    }
    const inviteToken = jsonwebtoken_1.default.sign({
        type: 'group_invite',
        groupId: group.id,
        inviterId: req.user.id
    }, getInviteTokenSecret(), { expiresIn: '7d' });
    const inviteLink = `${getInviteLinkBaseUrl()}/groups?inviteToken=${encodeURIComponent(inviteToken)}`;
    res.status(200).json({
        success: true,
        data: {
            inviteToken,
            inviteLink,
            expiresInDays: 7
        }
    });
});
exports.acceptGroupInviteLink = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    if (!req.user?.id) {
        res.status(401).json({ success: false, message: 'Not authenticated' });
        return;
    }
    const token = typeof req.body?.token === 'string' ? req.body.token.trim() : '';
    if (!token) {
        res.status(400).json({ success: false, message: 'Invite token is required' });
        return;
    }
    let payload;
    try {
        const decoded = jsonwebtoken_1.default.verify(token, getInviteTokenSecret());
        if (typeof decoded === 'string') {
            res.status(400).json({ success: false, message: 'Invalid invite token payload' });
            return;
        }
        const type = decoded.type;
        const groupId = decoded.groupId;
        const inviterId = decoded.inviterId;
        if (type !== 'group_invite' || !groupId || !inviterId) {
            res.status(400).json({ success: false, message: 'Invalid invite token' });
            return;
        }
        payload = {
            type: 'group_invite',
            groupId,
            inviterId
        };
    }
    catch {
        res.status(400).json({ success: false, message: 'Invite link is invalid or expired' });
        return;
    }
    const group = await prisma_1.default.group.findUnique({
        where: { id: payload.groupId },
        include: { members: { select: { id: true } } }
    });
    if (!group) {
        res.status(404).json({ success: false, message: 'Group not found for invite link' });
        return;
    }
    if (group.privacy !== 'private') {
        res.status(400).json({ success: false, message: 'This invite link is not applicable to a private group' });
        return;
    }
    if (isGroupMemberId(group.members, req.user.id)) {
        res.status(200).json({ success: true, message: 'You are already a member of this group' });
        return;
    }
    const existingRequest = await prisma_1.default.groupJoinRequest.findUnique({
        where: {
            groupId_requesterId: {
                groupId: group.id,
                requesterId: req.user.id
            }
        }
    });
    if (existingRequest) {
        await prisma_1.default.groupJoinRequest.update({
            where: { id: existingRequest.id },
            data: {
                status: 'invited',
                reviewedById: payload.inviterId,
                reviewedAt: new Date()
            }
        });
    }
    else {
        await prisma_1.default.groupJoinRequest.create({
            data: {
                groupId: group.id,
                requesterId: req.user.id,
                status: 'invited',
                reviewedById: payload.inviterId,
                reviewedAt: new Date()
            }
        });
    }
    await (0, notifications_1.createNotification)({
        userId: req.user.id,
        title: 'Private group invitation',
        message: `You have been invited to join ${group.name}.`,
        type: 'group_invitation',
        actionUrl: '/groups',
        metadata: {
            groupId: group.id,
            inviterId: payload.inviterId,
            invitedUserId: req.user.id,
            source: 'invite_link'
        }
    });
    res.status(200).json({
        success: true,
        message: 'Invitation accepted. Open notifications and click Join Group to enter the private group.'
    });
});
exports.leaveGroup = (0, errorHandler_1.asyncHandler)(async (req, res) => {
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
    if (group.creatorId === req.user.id) {
        const memberIds = group.members.map((member) => member.id);
        const nextAdminId = await getNextAdminCandidateId(groupId, req.user.id, memberIds);
        if (!nextAdminId) {
            await prisma_1.default.group.delete({ where: { id: groupId } });
            res.status(200).json({ success: true, message: 'Group deleted because there was no successor admin' });
            return;
        }
        const [actorName, nextAdminName] = await Promise.all([
            getSafeActorName(req.user.id),
            getSafeActorName(nextAdminId)
        ]);
        await prisma_1.default.$transaction(async (tx) => {
            await tx.group.update({
                where: { id: groupId },
                data: {
                    creatorId: nextAdminId,
                    members: { disconnect: { id: req.user.id } },
                    memberCount: { decrement: 1 },
                    lastActivity: new Date()
                }
            });
            await tx.groupMessage.create({
                data: {
                    groupId,
                    authorId: req.user.id,
                    content: `${actorName} left the group`,
                    messageType: 'system'
                }
            });
            await tx.groupMessage.create({
                data: {
                    groupId,
                    authorId: nextAdminId,
                    content: `${nextAdminName} is now the group admin`,
                    messageType: 'system'
                }
            });
        });
        await (0, notifications_1.createNotification)({
            userId: nextAdminId,
            title: 'You are now a group admin',
            message: `Admin rights for ${group.name} were transferred to you.`,
            type: 'group_admin_transferred',
            actionUrl: '/groups',
            metadata: { groupId }
        });
        res.status(200).json({ success: true, message: 'You left the group and admin rights were transferred' });
        return;
    }
    if (!isUserMember(group.members, req.user.id)) {
        res.status(200).json({ success: true, message: 'You are not a member of this group' });
        return;
    }
    const actorName = await getSafeActorName(req.user.id);
    await createSystemMessage(groupId, req.user.id, `${actorName} left the group`);
    await prisma_1.default.group.update({
        where: { id: groupId },
        data: {
            members: { disconnect: { id: req.user.id } },
            memberCount: { decrement: 1 },
            lastActivity: new Date()
        }
    });
    res.status(200).json({ success: true, message: 'Left group' });
});
exports.getGroup = exports.getGroupById;
exports.getGroupJoinRequests = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    if (!req.user?.id) {
        res.status(401).json({ message: 'Not authenticated' });
        return;
    }
    const groupId = getRequiredGroupId(req, res);
    if (!groupId)
        return;
    const group = await prisma_1.default.group.findUnique({ where: { id: groupId } });
    if (!group) {
        res.status(404).json({ message: 'Group not found' });
        return;
    }
    if (!isGroupAdmin(group, req.user.id)) {
        if (!isWatcherRole(req.user.role)) {
            res.status(403).json({ message: 'Only group admin or watchers can view join requests' });
            return;
        }
    }
    const requests = await prisma_1.default.groupJoinRequest.findMany({
        where: { groupId, status: 'pending' },
        include: {
            requester: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    profileImage: true
                }
            }
        },
        orderBy: { createdAt: 'asc' }
    });
    res.status(200).json({ success: true, data: requests });
});
exports.respondToGroupJoinRequest = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    if (!req.user?.id) {
        res.status(401).json({ message: 'Not authenticated' });
        return;
    }
    const groupId = getRequiredGroupId(req, res);
    if (!groupId)
        return;
    const requestId = req.params.requestId;
    if (!requestId) {
        res.status(400).json({ success: false, message: 'Join request id is required' });
        return;
    }
    const rawAction = req.body?.action;
    let action = null;
    if (rawAction === 'approve' || rawAction === 'reject') {
        action = rawAction;
    }
    if (!action) {
        res.status(400).json({ success: false, message: 'Action must be approve or reject' });
        return;
    }
    const group = await prisma_1.default.group.findUnique({
        where: { id: groupId },
        include: { members: { select: { id: true } } }
    });
    if (!group) {
        res.status(404).json({ message: 'Group not found' });
        return;
    }
    if (!isGroupAdmin(group, req.user.id)) {
        res.status(403).json({ message: 'Only group admin can respond to join requests' });
        return;
    }
    const joinRequest = await prisma_1.default.groupJoinRequest.findUnique({
        where: { id: requestId },
        include: {
            requester: { select: { id: true, name: true, email: true } }
        }
    });
    if (joinRequest?.groupId !== groupId) {
        res.status(404).json({ success: false, message: 'Join request not found' });
        return;
    }
    if (joinRequest.status !== 'pending') {
        res.status(400).json({ success: false, message: 'This join request has already been processed' });
        return;
    }
    if (action === 'approve') {
        const alreadyMember = isUserMember(group.members, joinRequest.requesterId);
        await prisma_1.default.$transaction(async (tx) => {
            await tx.groupJoinRequest.update({
                where: { id: joinRequest.id },
                data: {
                    status: 'approved',
                    reviewedById: req.user.id,
                    reviewedAt: new Date()
                }
            });
            if (!alreadyMember) {
                await tx.group.update({
                    where: { id: groupId },
                    data: {
                        members: { connect: { id: joinRequest.requesterId } },
                        memberCount: { increment: 1 },
                        lastActivity: new Date()
                    }
                });
                await tx.groupMessage.create({
                    data: {
                        groupId,
                        authorId: joinRequest.requesterId,
                        content: `${joinRequest.requester.name || joinRequest.requester.email.split('@')[0]} joined the group`,
                        messageType: 'system'
                    }
                });
            }
        });
        await (0, notifications_1.createNotification)({
            userId: joinRequest.requesterId,
            title: 'Group join approved',
            message: `Your request to join ${group.name} was approved.`,
            type: 'group_join_approved',
            actionUrl: '/groups',
            metadata: { groupId }
        });
        res.status(200).json({ success: true, message: 'Join request approved' });
        return;
    }
    await prisma_1.default.groupJoinRequest.update({
        where: { id: joinRequest.id },
        data: {
            status: 'rejected',
            reviewedById: req.user.id,
            reviewedAt: new Date()
        }
    });
    await (0, notifications_1.createNotification)({
        userId: joinRequest.requesterId,
        title: 'Group join request declined',
        message: `Your request to join ${group.name} was declined by the group admin.`,
        type: 'group_join_rejected',
        actionUrl: '/groups',
        metadata: { groupId }
    });
    res.status(200).json({ success: true, message: 'Join request rejected' });
});
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
    const canRead = isWatcherRole(req.user.role) ||
        group.creatorId === req.user.id ||
        isUserMember(group.members, req.user.id);
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
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserSuggestions = exports.getAlumniDirectory = exports.updateUserProfile = exports.setPremiumBadge = exports.demoteAdmin = exports.promoteToModerator = exports.promoteToAdmin = exports.reactivateUser = exports.suspendUser = exports.getPendingUsers = exports.searchAlumni = exports.getConnectionSuggestions = exports.sendDirectMessage = exports.getDirectMessages = exports.getDirectConversations = exports.unfollowUser = exports.followUser = exports.disconnectUser = exports.acceptConnectionRequest = exports.connectUser = exports.getUserStats = exports.deleteUser = exports.blockUser = exports.rejectUser = exports.approveUser = exports.updateProfile = exports.getUserProfile = exports.getUserById = exports.getPublicAlumni = exports.getAllUsers = void 0;
const client_1 = require("@prisma/client");
const prisma_1 = __importDefault(require("../config/prisma"));
const errorHandler_1 = require("../middleware/errorHandler");
const systemAccounts_1 = require("../config/systemAccounts");
const notifications_1 = require("../utils/notifications");
const normalizeRole = (role) => (role || '').toUpperCase();
const normalizeStatus = (status) => (status || '').toUpperCase();
const serializeUser = (user) => ({
    ...user,
    role: typeof user?.role === 'string' ? user.role.toLowerCase() : user?.role,
    status: typeof user?.status === 'string' ? user.status.toLowerCase() : user?.status,
});
const isAdminRole = (role) => {
    const normalized = normalizeRole(role);
    return normalized === 'MODERATOR' || normalized === 'ADMIN' || normalized === 'SUPER_ADMIN';
};
const isSuperAdminRole = (role) => normalizeRole(role) === 'SUPER_ADMIN';
const hiddenSystemEmails = () => [...(0, systemAccounts_1.getHiddenSystemAccountEmails)()];
const notHiddenSystemAccountsFilter = () => ({ notIn: hiddenSystemEmails() });
const getTargetUserId = (req) => {
    return req.params.id || req.params.userId;
};
const getAuthenticatedUserId = (req) => {
    const user = req.user;
    return user?.id || user?._id;
};
const isMissingDirectMessageTableError = (error) => {
    if (error instanceof client_1.Prisma.PrismaClientKnownRequestError) {
        return error.code === 'P2021' && String(error.meta?.table || '').includes('DirectMessage');
    }
    if (error instanceof Error) {
        return error.message.includes('DirectMessage') && error.message.includes('does not exist');
    }
    return false;
};
exports.getAllUsers = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const page = Number.parseInt(req.query.page) || 1;
    const limit = Number.parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const { role, status, search } = req.query;
    const where = {};
    where.email = notHiddenSystemAccountsFilter();
    if (role)
        where.role = normalizeRole(String(role));
    if (status)
        where.status = normalizeStatus(String(status));
    if (search) {
        where.OR = [
            { email: { contains: search, mode: 'insensitive' } },
            { name: { contains: search, mode: 'insensitive' } },
            { firstName: { contains: search, mode: 'insensitive' } },
            { lastName: { contains: search, mode: 'insensitive' } }
        ];
    }
    const [users, total] = await Promise.all([
        prisma_1.default.user.findMany({
            where,
            skip, take: limit,
            orderBy: { createdAt: 'desc' }
        }),
        prisma_1.default.user.count({ where })
    ]);
    const serializedUsers = users.map((user) => serializeUser(user));
    res.status(200).json({
        success: true, data: serializedUsers, users: serializedUsers,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    });
});
exports.getPublicAlumni = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const page = Number.parseInt(req.query.page) || 1;
    const limit = Number.parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const { search, graduationYear, company, location } = req.query;
    const authReq = req;
    const currentUserId = getAuthenticatedUserId(authReq);
    let connectedUserIds = new Set();
    let pendingSentUserIds = new Set();
    let pendingIncomingUserIds = new Set();
    let followingUserIds = new Set();
    if (currentUserId) {
        const currentUser = await prisma_1.default.user.findUnique({
            where: { id: currentUserId },
            select: {
                connections: { select: { id: true } },
                connectedTo: { select: { id: true } },
                sentConnectionRequests: {
                    where: { status: client_1.ConnectionRequestStatus.PENDING },
                    select: { receiverId: true }
                },
                receivedConnectionRequests: {
                    where: { status: client_1.ConnectionRequestStatus.PENDING },
                    select: { senderId: true }
                },
                followingRelationships: { select: { followingId: true } }
            }
        });
        if (currentUser) {
            connectedUserIds = new Set([
                ...currentUser.connections.map((user) => user.id),
                ...currentUser.connectedTo.map((user) => user.id)
            ]);
            pendingSentUserIds = new Set(currentUser.sentConnectionRequests.map((request) => request.receiverId));
            pendingIncomingUserIds = new Set(currentUser.receivedConnectionRequests.map((request) => request.senderId));
            followingUserIds = new Set(currentUser.followingRelationships.map((relation) => relation.followingId));
        }
    }
    const where = {
        status: client_1.Status.ACTIVE,
        email: notHiddenSystemAccountsFilter()
    };
    if (search) {
        where.OR = [
            { name: { contains: search, mode: 'insensitive' } },
            { firstName: { contains: search, mode: 'insensitive' } },
            { lastName: { contains: search, mode: 'insensitive' } },
            { headline: { contains: search, mode: 'insensitive' } },
            { company: { contains: search, mode: 'insensitive' } },
            { jobTitle: { contains: search, mode: 'insensitive' } },
        ];
    }
    if (typeof graduationYear === 'string' && graduationYear.trim()) {
        where.admissionYear = graduationYear.trim();
    }
    if (company)
        where.company = { contains: company, mode: 'insensitive' };
    if (location)
        where.location = { contains: location, mode: 'insensitive' };
    const [alumni, total] = await Promise.all([
        prisma_1.default.user.findMany({
            where, skip, take: limit,
            select: {
                id: true,
                name: true,
                role: true,
                firstName: true,
                lastName: true,
                profileImage: true,
                headline: true,
                jobTitle: true,
                company: true,
                location: true,
                admissionYear: true,
                bio: true
            }
        }),
        prisma_1.default.user.count({ where })
    ]);
    const alumniWithConnectionStatus = alumni
        .filter((user) => user.id !== currentUserId)
        .map((user) => ({
        ...user,
        connectionStatus: connectedUserIds.has(user.id)
            ? 'connected'
            : pendingIncomingUserIds.has(user.id)
                ? 'incoming'
                : pendingSentUserIds.has(user.id)
                    ? 'pending'
                    : 'none',
        isFollowing: followingUserIds.has(user.id)
    }));
    res.status(200).json({
        success: true, data: alumniWithConnectionStatus,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    });
});
exports.getUserById = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const id = getTargetUserId(req);
    if (!id) {
        res.status(400).json({ success: false, message: 'User ID is required' });
        return;
    }
    const user = await prisma_1.default.user.findUnique({
        where: { id },
        include: {
            mentorshipProfile: {
                select: {
                    id: true,
                    isMentor: true,
                    isActive: true,
                    expertise: true,
                    availability: true,
                    communicationPreferences: true
                }
            }
        }
    });
    const authReq = req;
    const currentUserId = getAuthenticatedUserId(authReq);
    if (!user || ((0, systemAccounts_1.isHiddenSystemAccountEmail)(user.email) && currentUserId !== user.id)) {
        res.status(404).json({ success: false, message: 'User not found' });
        return;
    }
    let connectionStatus = 'none';
    if (currentUserId && currentUserId !== user.id) {
        const [isConnected, sentPending, incomingPending] = await Promise.all([
            prisma_1.default.user.findFirst({
                where: {
                    id: currentUserId,
                    OR: [
                        { connections: { some: { id: user.id } } },
                        { connectedTo: { some: { id: user.id } } }
                    ]
                },
                select: { id: true }
            }),
            prisma_1.default.connectionRequest.findFirst({
                where: {
                    senderId: currentUserId,
                    receiverId: user.id,
                    status: client_1.ConnectionRequestStatus.PENDING
                },
                select: { id: true }
            }),
            prisma_1.default.connectionRequest.findFirst({
                where: {
                    senderId: user.id,
                    receiverId: currentUserId,
                    status: client_1.ConnectionRequestStatus.PENDING
                },
                select: { id: true }
            })
        ]);
        if (isConnected) {
            connectionStatus = 'connected';
        }
        else if (incomingPending) {
            connectionStatus = 'incoming';
        }
        else if (sentPending) {
            connectionStatus = 'pending';
        }
    }
    res.status(200).json({
        success: true,
        data: serializeUser({ ...user, connectionStatus })
    });
});
exports.getUserProfile = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    if (!id) {
        res.status(400).json({ success: false, message: 'User ID is required' });
        return;
    }
    const user = await prisma_1.default.user.findUnique({
        where: { id },
        select: {
            id: true,
            email: true,
            name: true,
            firstName: true,
            lastName: true,
            profileImage: true,
            bio: true,
            headline: true,
            city: true,
            country: true,
            company: true,
            jobTitle: true,
            contactEmail: true,
            contactPhone: true,
            linkedInProfile: true,
            location: true,
            privacySettings: true,
            notificationSettings: true
        }
    });
    const authReq = req;
    const currentUserId = getAuthenticatedUserId(authReq);
    if (!user || ((0, systemAccounts_1.isHiddenSystemAccountEmail)(user.email) && currentUserId !== user.id)) {
        res.status(404).json({ success: false, message: 'Profile not found' });
        return;
    }
    const profileData = { ...user };
    delete profileData.email;
    res.status(200).json({ success: true, data: profileData });
});
exports.updateProfile = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    if (!req.user) {
        res.status(401).json({ success: false, message: 'Not authenticated' });
        return;
    }
    const id = getTargetUserId(req);
    if (!id) {
        res.status(400).json({ success: false, message: 'User ID is required' });
        return;
    }
    if (req.user.id !== id && !isAdminRole(req.user.role)) {
        res.status(403).json({ success: false, message: 'Not authorized' });
        return;
    }
    const profile = await prisma_1.default.user.update({
        where: { id },
        data: { ...req.body }
    });
    res.status(200).json({ success: true, data: serializeUser(profile) });
});
exports.approveUser = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const id = getTargetUserId(req);
    if (!id) {
        res.status(400).json({ success: false, message: 'User ID is required' });
        return;
    }
    if (!req.user || !isAdminRole(req.user.role)) {
        res.status(403).json({ success: false, message: 'Not authorized' });
        return;
    }
    const target = await prisma_1.default.user.findUnique({ where: { id }, select: { email: true } });
    if (!target || (0, systemAccounts_1.isHiddenSystemAccountEmail)(target.email)) {
        res.status(404).json({ success: false, message: 'User not found' });
        return;
    }
    const user = await prisma_1.default.user.update({
        where: { id },
        data: { status: client_1.Status.ACTIVE }
    });
    res.status(200).json({ success: true, data: user });
});
exports.rejectUser = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const id = getTargetUserId(req);
    if (!id) {
        res.status(400).json({ success: false, message: 'User ID is required' });
        return;
    }
    if (!req.user || !isAdminRole(req.user.role)) {
        res.status(403).json({ success: false, message: 'Not authorized' });
        return;
    }
    const target = await prisma_1.default.user.findUnique({ where: { id }, select: { email: true } });
    if (!target || (0, systemAccounts_1.isHiddenSystemAccountEmail)(target.email)) {
        res.status(404).json({ success: false, message: 'User not found' });
        return;
    }
    const user = await prisma_1.default.user.update({
        where: { id },
        data: { status: client_1.Status.DELETED }
    });
    res.status(200).json({ success: true, data: user });
});
exports.blockUser = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const id = getTargetUserId(req);
    if (!id) {
        res.status(400).json({ success: false, message: 'User ID is required' });
        return;
    }
    if (!req.user || !isAdminRole(req.user.role)) {
        res.status(403).json({ success: false, message: 'Not authorized' });
        return;
    }
    const target = await prisma_1.default.user.findUnique({ where: { id }, select: { email: true } });
    if (!target || (0, systemAccounts_1.isHiddenSystemAccountEmail)(target.email)) {
        res.status(404).json({ success: false, message: 'User not found' });
        return;
    }
    const user = await prisma_1.default.user.update({
        where: { id },
        data: { status: client_1.Status.SUSPENDED }
    });
    res.status(200).json({ success: true, data: user });
});
exports.deleteUser = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const id = getTargetUserId(req);
    if (!id) {
        res.status(400).json({ success: false, message: 'User ID is required' });
        return;
    }
    if (!req.user || !isAdminRole(req.user.role)) {
        res.status(403).json({ success: false, message: 'Not authorized' });
        return;
    }
    const target = await prisma_1.default.user.findUnique({ where: { id }, select: { email: true } });
    if (!target || (0, systemAccounts_1.isHiddenSystemAccountEmail)(target.email)) {
        res.status(404).json({ success: false, message: 'User not found' });
        return;
    }
    await prisma_1.default.user.delete({ where: { id } });
    res.status(200).json({ success: true, data: {} });
});
exports.getUserStats = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    if (!req.user || !isAdminRole(req.user.role)) {
        res.status(403).json({ success: false, message: 'Not authorized' });
        return;
    }
    const hiddenEmailFilter = { email: notHiddenSystemAccountsFilter() };
    const [total, active, pending, suspended, moderatorUsers, adminUsers, superAdminUsers, recentRegistrations] = await Promise.all([
        prisma_1.default.user.count({ where: hiddenEmailFilter }),
        prisma_1.default.user.count({ where: { ...hiddenEmailFilter, status: client_1.Status.ACTIVE } }),
        prisma_1.default.user.count({ where: { ...hiddenEmailFilter, status: client_1.Status.PENDING } }),
        prisma_1.default.user.count({ where: { ...hiddenEmailFilter, status: client_1.Status.SUSPENDED } }),
        prisma_1.default.user.count({ where: { ...hiddenEmailFilter, role: 'MODERATOR' } }),
        prisma_1.default.user.count({ where: { ...hiddenEmailFilter, role: client_1.Role.ADMIN } }),
        prisma_1.default.user.count({ where: { ...hiddenEmailFilter, role: client_1.Role.SUPER_ADMIN } }),
        prisma_1.default.user.count({ where: { ...hiddenEmailFilter, createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } })
    ]);
    const stats = {
        totalUsers: total,
        activeUsers: active,
        pendingUsers: pending,
        suspendedUsers: suspended,
        moderatorUsers,
        adminUsers,
        superAdminUsers,
        recentRegistrations,
        totalJobs: 0,
        totalGroups: 0,
        totalPosts: 0
    };
    res.status(200).json({ success: true, data: stats, stats });
});
exports.connectUser = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const currentUserId = getAuthenticatedUserId(req);
    const targetUserId = getTargetUserId(req);
    if (!currentUserId) {
        res.status(401).json({ success: false, message: 'Not authenticated' });
        return;
    }
    if (!targetUserId) {
        res.status(400).json({ success: false, message: 'Target user ID is required' });
        return;
    }
    if (currentUserId === targetUserId) {
        res.status(400).json({ success: false, message: 'Cannot connect with yourself' });
        return;
    }
    const targetUser = await prisma_1.default.user.findUnique({
        where: { id: targetUserId },
        select: { id: true, status: true, email: true }
    });
    if (!targetUser || targetUser.status !== client_1.Status.ACTIVE || (0, systemAccounts_1.isHiddenSystemAccountEmail)(targetUser.email)) {
        res.status(404).json({ success: false, message: 'Target user not found or inactive' });
        return;
    }
    const alreadyConnected = await prisma_1.default.user.findFirst({
        where: {
            id: currentUserId,
            OR: [
                { connections: { some: { id: targetUserId } } },
                { connectedTo: { some: { id: targetUserId } } }
            ]
        },
        select: { id: true }
    });
    if (alreadyConnected) {
        res.status(200).json({ success: true, message: 'Already connected', data: { connectionStatus: 'connected' } });
        return;
    }
    const incomingPendingRequest = await prisma_1.default.connectionRequest.findFirst({
        where: {
            senderId: targetUserId,
            receiverId: currentUserId,
            status: client_1.ConnectionRequestStatus.PENDING
        },
        select: { id: true }
    });
    const currentUser = await prisma_1.default.user.findUnique({
        where: { id: currentUserId },
        select: { id: true, name: true }
    });
    if (incomingPendingRequest) {
        await prisma_1.default.$transaction([
            prisma_1.default.connectionRequest.update({
                where: { id: incomingPendingRequest.id },
                data: { status: client_1.ConnectionRequestStatus.ACCEPTED, respondedAt: new Date() }
            }),
            prisma_1.default.user.update({
                where: { id: currentUserId },
                data: { connections: { connect: { id: targetUserId } } }
            }),
            prisma_1.default.user.update({
                where: { id: targetUserId },
                data: { connections: { connect: { id: currentUserId } } }
            })
        ]);
        await (0, notifications_1.createNotification)({
            userId: targetUserId,
            title: 'Connection accepted',
            message: `${currentUser?.name || 'A user'} accepted your connection request.`,
            type: 'connection',
            actionUrl: `/directory/profile/${currentUserId}`,
            metadata: { userId: currentUserId, event: 'connection_accepted' }
        });
        res.status(200).json({
            success: true,
            message: 'Connection request accepted successfully',
            data: { connectionStatus: 'connected' }
        });
        return;
    }
    const outgoingPendingRequest = await prisma_1.default.connectionRequest.findFirst({
        where: {
            senderId: currentUserId,
            receiverId: targetUserId,
            status: client_1.ConnectionRequestStatus.PENDING
        },
        select: { id: true }
    });
    if (outgoingPendingRequest) {
        res.status(200).json({
            success: true,
            message: 'Connection request already pending',
            data: { connectionStatus: 'pending' }
        });
        return;
    }
    await prisma_1.default.connectionRequest.upsert({
        where: {
            senderId_receiverId: {
                senderId: currentUserId,
                receiverId: targetUserId
            }
        },
        update: {
            status: client_1.ConnectionRequestStatus.PENDING,
            respondedAt: null
        },
        create: {
            senderId: currentUserId,
            receiverId: targetUserId,
            status: client_1.ConnectionRequestStatus.PENDING
        }
    });
    await (0, notifications_1.createNotification)({
        userId: targetUserId,
        title: 'New connection request',
        message: `${currentUser?.name || 'A user'} sent you a connection request.`,
        type: 'connection',
        actionUrl: `/directory/profile/${currentUserId}`,
        metadata: { userId: currentUserId, event: 'connection_request' }
    });
    res.status(200).json({
        success: true,
        message: 'Connection request sent successfully',
        data: { connectionStatus: 'pending' }
    });
});
exports.acceptConnectionRequest = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const currentUserId = getAuthenticatedUserId(req);
    const targetUserId = getTargetUserId(req);
    if (!currentUserId) {
        res.status(401).json({ success: false, message: 'Not authenticated' });
        return;
    }
    if (!targetUserId) {
        res.status(400).json({ success: false, message: 'Target user ID is required' });
        return;
    }
    const pendingRequest = await prisma_1.default.connectionRequest.findFirst({
        where: {
            senderId: targetUserId,
            receiverId: currentUserId,
            status: client_1.ConnectionRequestStatus.PENDING
        },
        select: { id: true }
    });
    if (!pendingRequest) {
        res.status(404).json({ success: false, message: 'No pending request from this user' });
        return;
    }
    await prisma_1.default.$transaction([
        prisma_1.default.connectionRequest.update({
            where: { id: pendingRequest.id },
            data: { status: client_1.ConnectionRequestStatus.ACCEPTED, respondedAt: new Date() }
        }),
        prisma_1.default.user.update({
            where: { id: currentUserId },
            data: { connections: { connect: { id: targetUserId } } }
        }),
        prisma_1.default.user.update({
            where: { id: targetUserId },
            data: { connections: { connect: { id: currentUserId } } }
        })
    ]);
    const currentUser = await prisma_1.default.user.findUnique({
        where: { id: currentUserId },
        select: { id: true, name: true }
    });
    await (0, notifications_1.createNotification)({
        userId: targetUserId,
        title: 'Connection accepted',
        message: `${currentUser?.name || 'A user'} accepted your connection request.`,
        type: 'connection',
        actionUrl: `/directory/profile/${currentUserId}`,
        metadata: { userId: currentUserId, event: 'connection_accepted' }
    });
    res.status(200).json({
        success: true,
        message: 'Connection accepted successfully',
        data: { connectionStatus: 'connected' }
    });
});
exports.disconnectUser = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const currentUserId = getAuthenticatedUserId(req);
    const targetUserId = getTargetUserId(req);
    if (!currentUserId) {
        res.status(401).json({ success: false, message: 'Not authenticated' });
        return;
    }
    if (!targetUserId) {
        res.status(400).json({ success: false, message: 'Target user ID is required' });
        return;
    }
    if (currentUserId === targetUserId) {
        res.status(400).json({ success: false, message: 'Cannot disconnect from yourself' });
        return;
    }
    const isConnected = await prisma_1.default.user.findFirst({
        where: {
            id: currentUserId,
            OR: [
                { connections: { some: { id: targetUserId } } },
                { connectedTo: { some: { id: targetUserId } } }
            ]
        },
        select: { id: true }
    });
    const operations = [
        prisma_1.default.connectionRequest.deleteMany({
            where: {
                OR: [
                    {
                        senderId: currentUserId,
                        receiverId: targetUserId,
                        status: client_1.ConnectionRequestStatus.PENDING
                    },
                    {
                        senderId: targetUserId,
                        receiverId: currentUserId,
                        status: client_1.ConnectionRequestStatus.PENDING
                    }
                ]
            }
        })
    ];
    if (isConnected) {
        operations.push(prisma_1.default.user.update({
            where: { id: currentUserId },
            data: { connections: { disconnect: { id: targetUserId } } }
        }), prisma_1.default.user.update({
            where: { id: targetUserId },
            data: { connections: { disconnect: { id: currentUserId } } }
        }));
    }
    await prisma_1.default.$transaction(operations);
    res.status(200).json({
        success: true,
        message: isConnected ? 'Disconnected successfully' : 'Connection request removed',
        data: { connectionStatus: 'none' }
    });
});
exports.followUser = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const currentUserId = getAuthenticatedUserId(req);
    const targetUserId = getTargetUserId(req);
    if (!currentUserId) {
        res.status(401).json({ success: false, message: 'Not authenticated' });
        return;
    }
    if (!targetUserId) {
        res.status(400).json({ success: false, message: 'Target user ID is required' });
        return;
    }
    if (currentUserId === targetUserId) {
        res.status(400).json({ success: false, message: 'Cannot follow yourself' });
        return;
    }
    const targetUser = await prisma_1.default.user.findUnique({
        where: { id: targetUserId },
        select: { id: true, status: true, email: true }
    });
    if (!targetUser || targetUser.status !== client_1.Status.ACTIVE || (0, systemAccounts_1.isHiddenSystemAccountEmail)(targetUser.email)) {
        res.status(404).json({ success: false, message: 'Target user not found or inactive' });
        return;
    }
    await prisma_1.default.follow.upsert({
        where: {
            followerId_followingId: {
                followerId: currentUserId,
                followingId: targetUserId
            }
        },
        update: {},
        create: {
            followerId: currentUserId,
            followingId: targetUserId
        }
    });
    res.status(200).json({ success: true, message: 'Now following user', data: { isFollowing: true } });
});
exports.unfollowUser = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const currentUserId = getAuthenticatedUserId(req);
    const targetUserId = getTargetUserId(req);
    if (!currentUserId) {
        res.status(401).json({ success: false, message: 'Not authenticated' });
        return;
    }
    if (!targetUserId) {
        res.status(400).json({ success: false, message: 'Target user ID is required' });
        return;
    }
    await prisma_1.default.follow.deleteMany({
        where: {
            followerId: currentUserId,
            followingId: targetUserId
        }
    });
    res.status(200).json({ success: true, message: 'Unfollowed user', data: { isFollowing: false } });
});
exports.getDirectConversations = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const currentUserId = getAuthenticatedUserId(req);
    if (!currentUserId) {
        res.status(401).json({ success: false, message: 'Not authenticated' });
        return;
    }
    let messages = [];
    try {
        messages = await prisma_1.default.directMessage.findMany({
            where: {
                OR: [
                    { senderId: currentUserId },
                    { receiverId: currentUserId }
                ]
            },
            orderBy: { createdAt: 'desc' },
            take: 300,
            select: {
                id: true,
                senderId: true,
                receiverId: true,
                content: true,
                isRead: true,
                createdAt: true
            }
        });
    }
    catch (error) {
        if (isMissingDirectMessageTableError(error)) {
            res.status(200).json({
                success: true,
                data: [],
                message: 'Direct messaging is not available yet. Please run the latest backend database migrations.'
            });
            return;
        }
        throw error;
    }
    const conversationMap = new Map();
    for (const message of messages) {
        const otherUserId = message.senderId === currentUserId ? message.receiverId : message.senderId;
        const existing = conversationMap.get(otherUserId);
        if (!existing) {
            conversationMap.set(otherUserId, {
                userId: otherUserId,
                lastMessage: message.content,
                lastMessageAt: message.createdAt,
                lastMessageFromMe: message.senderId === currentUserId,
                unreadCount: message.receiverId === currentUserId && !message.isRead ? 1 : 0
            });
            continue;
        }
        if (message.receiverId === currentUserId && !message.isRead) {
            existing.unreadCount += 1;
            conversationMap.set(otherUserId, existing);
        }
    }
    const participantIds = [...conversationMap.keys()];
    const participants = participantIds.length > 0
        ? await prisma_1.default.user.findMany({
            where: { id: { in: participantIds } },
            select: { id: true, name: true, profileImage: true, status: true, email: true }
        })
        : [];
    const participantById = new Map(participants.map((user) => [user.id, user]));
    const conversations = [...conversationMap.values()]
        .map((conversation) => {
        const participant = participantById.get(conversation.userId);
        if (!participant || participant.status !== client_1.Status.ACTIVE || (0, systemAccounts_1.isHiddenSystemAccountEmail)(participant.email)) {
            return null;
        }
        return {
            ...conversation,
            participant: {
                id: participant.id,
                name: participant.name,
                profileImage: participant.profileImage
            }
        };
    })
        .filter((item) => Boolean(item))
        .sort((left, right) => right.lastMessageAt.getTime() - left.lastMessageAt.getTime());
    res.status(200).json({ success: true, data: conversations });
});
exports.getDirectMessages = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const currentUserId = getAuthenticatedUserId(req);
    const targetUserId = getTargetUserId(req);
    if (!currentUserId) {
        res.status(401).json({ success: false, message: 'Not authenticated' });
        return;
    }
    if (!targetUserId) {
        res.status(400).json({ success: false, message: 'Target user ID is required' });
        return;
    }
    const targetUser = await prisma_1.default.user.findUnique({
        where: { id: targetUserId },
        select: { id: true, email: true }
    });
    if (!targetUser || (0, systemAccounts_1.isHiddenSystemAccountEmail)(targetUser.email)) {
        res.status(404).json({ success: false, message: 'Target user not found' });
        return;
    }
    const areConnected = await prisma_1.default.user.findFirst({
        where: {
            id: currentUserId,
            OR: [
                { connections: { some: { id: targetUserId } } },
                { connectedTo: { some: { id: targetUserId } } }
            ]
        },
        select: { id: true }
    });
    if (!areConnected) {
        res.status(403).json({ success: false, message: 'You can only message connected users' });
        return;
    }
    let messages = [];
    try {
        messages = await prisma_1.default.directMessage.findMany({
            where: {
                OR: [
                    { senderId: currentUserId, receiverId: targetUserId },
                    { senderId: targetUserId, receiverId: currentUserId }
                ]
            },
            orderBy: { createdAt: 'asc' },
            take: 200,
            select: {
                id: true,
                senderId: true,
                receiverId: true,
                content: true,
                isRead: true,
                createdAt: true
            }
        });
        await prisma_1.default.directMessage.updateMany({
            where: {
                senderId: targetUserId,
                receiverId: currentUserId,
                isRead: false
            },
            data: {
                isRead: true,
                readAt: new Date()
            }
        });
    }
    catch (error) {
        if (isMissingDirectMessageTableError(error)) {
            res.status(200).json({
                success: true,
                data: [],
                message: 'Direct messaging is not available yet. Please run the latest backend database migrations.'
            });
            return;
        }
        throw error;
    }
    res.status(200).json({ success: true, data: messages });
});
exports.sendDirectMessage = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const currentUserId = getAuthenticatedUserId(req);
    const targetUserId = getTargetUserId(req);
    const content = typeof req.body?.content === 'string' ? req.body.content.trim() : '';
    if (!currentUserId) {
        res.status(401).json({ success: false, message: 'Not authenticated' });
        return;
    }
    if (!targetUserId) {
        res.status(400).json({ success: false, message: 'Target user ID is required' });
        return;
    }
    const targetUser = await prisma_1.default.user.findUnique({
        where: { id: targetUserId },
        select: { id: true, email: true }
    });
    if (!targetUser || (0, systemAccounts_1.isHiddenSystemAccountEmail)(targetUser.email)) {
        res.status(404).json({ success: false, message: 'Target user not found' });
        return;
    }
    if (currentUserId === targetUserId) {
        res.status(400).json({ success: false, message: 'Cannot message yourself' });
        return;
    }
    if (!content) {
        res.status(400).json({ success: false, message: 'Message content is required' });
        return;
    }
    if (content.length > 2000) {
        res.status(400).json({ success: false, message: 'Message content must not exceed 2000 characters' });
        return;
    }
    const areConnected = await prisma_1.default.user.findFirst({
        where: {
            id: currentUserId,
            OR: [
                { connections: { some: { id: targetUserId } } },
                { connectedTo: { some: { id: targetUserId } } }
            ]
        },
        select: { id: true }
    });
    if (!areConnected) {
        res.status(403).json({ success: false, message: 'You can only message connected users' });
        return;
    }
    let message;
    try {
        message = await prisma_1.default.directMessage.create({
            data: {
                senderId: currentUserId,
                receiverId: targetUserId,
                content
            },
            select: {
                id: true,
                senderId: true,
                receiverId: true,
                content: true,
                isRead: true,
                createdAt: true
            }
        });
    }
    catch (error) {
        if (isMissingDirectMessageTableError(error)) {
            res.status(503).json({
                success: false,
                message: 'Direct messaging is not available yet. Please run the latest backend database migrations.'
            });
            return;
        }
        throw error;
    }
    res.status(201).json({ success: true, message: 'Message sent', data: message });
});
exports.getConnectionSuggestions = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const currentUserId = getAuthenticatedUserId(req);
    if (!currentUserId) {
        res.status(401).json({ success: false, message: 'Not authenticated' });
        return;
    }
    const requestedLimit = Number.parseInt(req.query.limit) || 8;
    const limit = Math.min(Math.max(requestedLimit, 1), 20);
    const currentUser = await prisma_1.default.user.findUnique({
        where: { id: currentUserId },
        select: {
            company: true,
            location: true,
            admissionYear: true,
            connections: { select: { id: true } },
            connectedTo: { select: { id: true } }
        }
    });
    if (!currentUser) {
        res.status(404).json({ success: false, message: 'User not found' });
        return;
    }
    const excludedIds = new Set([
        currentUserId,
        ...currentUser.connections.map((user) => user.id),
        ...currentUser.connectedTo.map((user) => user.id)
    ]);
    const candidates = await prisma_1.default.user.findMany({
        where: {
            status: client_1.Status.ACTIVE,
            id: { notIn: [...excludedIds] },
            email: notHiddenSystemAccountsFilter()
        },
        select: {
            id: true,
            name: true,
            firstName: true,
            lastName: true,
            profileImage: true,
            headline: true,
            jobTitle: true,
            company: true,
            location: true,
            admissionYear: true,
            bio: true,
            createdAt: true
        },
        take: 50
    });
    const suggestions = candidates
        .map((candidate) => {
        let score = 0;
        if (candidate.company)
            score += 2;
        if (candidate.location)
            score += 2;
        if (candidate.headline || candidate.jobTitle)
            score += 2;
        if (candidate.bio)
            score += 1;
        if (currentUser.company && candidate.company && currentUser.company.toLowerCase() === candidate.company.toLowerCase()) {
            score += 5;
        }
        if (currentUser.location && candidate.location && currentUser.location.toLowerCase() === candidate.location.toLowerCase()) {
            score += 4;
        }
        if (currentUser.admissionYear && candidate.admissionYear && currentUser.admissionYear === candidate.admissionYear) {
            score += 3;
        }
        return {
            ...candidate,
            score,
            connectionStatus: 'none'
        };
    })
        .sort((left, right) => right.score - left.score)
        .slice(0, limit);
    res.status(200).json({ success: true, data: suggestions });
});
exports.searchAlumni = (0, errorHandler_1.asyncHandler)(async (_req, res) => {
    res.status(200).json({ success: true, data: [] });
});
exports.getPendingUsers = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const page = Number.parseInt(req.query.page) || 1;
    const limit = Number.parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const where = { status: client_1.Status.PENDING, email: notHiddenSystemAccountsFilter() };
    const [users, total] = await Promise.all([
        prisma_1.default.user.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' }
        }),
        prisma_1.default.user.count({ where })
    ]);
    const serializedUsers = users.map((user) => serializeUser(user));
    res.status(200).json({
        success: true,
        data: serializedUsers,
        users: serializedUsers,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    });
});
exports.suspendUser = exports.blockUser;
exports.reactivateUser = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const id = getTargetUserId(req);
    if (!id) {
        res.status(400).json({ success: false, message: 'User ID is required' });
        return;
    }
    if (!req.user || !isAdminRole(req.user.role)) {
        res.status(403).json({ success: false, message: 'Not authorized' });
        return;
    }
    const target = await prisma_1.default.user.findUnique({ where: { id }, select: { email: true } });
    if (!target || (0, systemAccounts_1.isHiddenSystemAccountEmail)(target.email)) {
        res.status(404).json({ success: false, message: 'User not found' });
        return;
    }
    const user = await prisma_1.default.user.update({
        where: { id },
        data: { status: client_1.Status.ACTIVE }
    });
    res.status(200).json({ success: true, data: user });
});
exports.promoteToAdmin = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const id = getTargetUserId(req);
    if (!id) {
        res.status(400).json({ success: false, message: 'User ID is required' });
        return;
    }
    if (!req.user || !isSuperAdminRole(req.user.role)) {
        res.status(403).json({ success: false, message: 'Not authorized' });
        return;
    }
    const target = await prisma_1.default.user.findUnique({ where: { id }, select: { email: true } });
    if (!target || (0, systemAccounts_1.isHiddenSystemAccountEmail)(target.email)) {
        res.status(404).json({ success: false, message: 'User not found' });
        return;
    }
    const user = await prisma_1.default.user.update({
        where: { id },
        data: { role: client_1.Role.ADMIN }
    });
    res.status(200).json({ success: true, data: user });
});
exports.promoteToModerator = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const id = getTargetUserId(req);
    if (!id) {
        res.status(400).json({ success: false, message: 'User ID is required' });
        return;
    }
    if (!req.user || !isSuperAdminRole(req.user.role)) {
        res.status(403).json({ success: false, message: 'Not authorized' });
        return;
    }
    const target = await prisma_1.default.user.findUnique({ where: { id }, select: { email: true } });
    if (!target || (0, systemAccounts_1.isHiddenSystemAccountEmail)(target.email)) {
        res.status(404).json({ success: false, message: 'User not found' });
        return;
    }
    const user = await prisma_1.default.user.update({
        where: { id },
        data: { role: 'MODERATOR' }
    });
    res.status(200).json({ success: true, data: user });
});
exports.demoteAdmin = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const id = getTargetUserId(req);
    if (!id) {
        res.status(400).json({ success: false, message: 'User ID is required' });
        return;
    }
    if (!req.user || !isSuperAdminRole(req.user.role)) {
        res.status(403).json({ success: false, message: 'Not authorized' });
        return;
    }
    const targetUser = await prisma_1.default.user.findUnique({ where: { id }, select: { role: true, email: true } });
    if (!targetUser || (0, systemAccounts_1.isHiddenSystemAccountEmail)(targetUser.email)) {
        res.status(404).json({ success: false, message: 'User not found' });
        return;
    }
    const nextRole = String(targetUser.role) === 'ADMIN' ? 'MODERATOR' : client_1.Role.USER;
    const user = await prisma_1.default.user.update({
        where: { id },
        data: { role: nextRole }
    });
    res.status(200).json({ success: true, data: user });
});
exports.setPremiumBadge = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const id = getTargetUserId(req);
    if (!id) {
        res.status(400).json({ success: false, message: 'User ID is required' });
        return;
    }
    if (!req.user || !isSuperAdminRole(req.user.role)) {
        res.status(403).json({ success: false, message: 'Only super admin can assign premium badge' });
        return;
    }
    const target = await prisma_1.default.user.findUnique({ where: { id }, select: { email: true } });
    if (!target || (0, systemAccounts_1.isHiddenSystemAccountEmail)(target.email)) {
        res.status(404).json({ success: false, message: 'User not found' });
        return;
    }
    const enabled = typeof req.body?.enabled === 'boolean' ? req.body.enabled : true;
    const user = await prisma_1.default.user.update({
        where: { id },
        data: { hasPremiumBadge: enabled },
    });
    res.status(200).json({ success: true, data: serializeUser(user) });
});
exports.updateUserProfile = exports.updateProfile;
exports.getAlumniDirectory = exports.getPublicAlumni;
exports.getUserSuggestions = exports.getConnectionSuggestions;
//# sourceMappingURL=userController.js.map
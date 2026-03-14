"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserSuggestions = exports.getAlumniDirectory = exports.updateUserProfile = exports.demoteAdmin = exports.promoteToAdmin = exports.reactivateUser = exports.suspendUser = exports.getPendingUsers = exports.searchAlumni = exports.getConnectionSuggestions = exports.disconnectUser = exports.connectUser = exports.getUserStats = exports.deleteUser = exports.blockUser = exports.rejectUser = exports.approveUser = exports.updateProfile = exports.getUserProfile = exports.getUserById = exports.getPublicAlumni = exports.getAllUsers = void 0;
const client_1 = require("@prisma/client");
const prisma_1 = __importDefault(require("../config/prisma"));
const errorHandler_1 = require("../middleware/errorHandler");
const normalizeRole = (role) => (role || '').toUpperCase();
const isAdminRole = (role) => {
    const normalized = normalizeRole(role);
    return normalized === 'ADMIN' || normalized === 'SUPER_ADMIN';
};
const isSuperAdminRole = (role) => normalizeRole(role) === 'SUPER_ADMIN';
const getTargetUserId = (req) => {
    return req.params.id || req.params.userId;
};
exports.getAllUsers = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const page = Number.parseInt(req.query.page) || 1;
    const limit = Number.parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const { role, status, search } = req.query;
    const where = {};
    if (role)
        where.role = role;
    if (status)
        where.status = status;
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
    res.status(200).json({
        success: true, data: users, users,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    });
});
exports.getPublicAlumni = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const page = Number.parseInt(req.query.page) || 1;
    const limit = Number.parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const { search, graduationYear, company, location } = req.query;
    const where = { status: client_1.Status.ACTIVE };
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
    res.status(200).json({
        success: true, data: alumni,
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
        where: { id }
    });
    if (!user) {
        res.status(404).json({ success: false, message: 'User not found' });
        return;
    }
    res.status(200).json({ success: true, data: user });
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
    if (!user) {
        res.status(404).json({ success: false, message: 'Profile not found' });
        return;
    }
    res.status(200).json({ success: true, data: user });
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
    res.status(200).json({ success: true, data: profile });
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
    await prisma_1.default.user.delete({ where: { id } });
    res.status(200).json({ success: true, data: {} });
});
exports.getUserStats = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    if (!req.user || !isAdminRole(req.user.role)) {
        res.status(403).json({ success: false, message: 'Not authorized' });
        return;
    }
    const [total, active, pending, suspended, adminUsers, superAdminUsers, recentRegistrations] = await Promise.all([
        prisma_1.default.user.count(),
        prisma_1.default.user.count({ where: { status: client_1.Status.ACTIVE } }),
        prisma_1.default.user.count({ where: { status: client_1.Status.PENDING } }),
        prisma_1.default.user.count({ where: { status: client_1.Status.SUSPENDED } }),
        prisma_1.default.user.count({ where: { role: client_1.Role.ADMIN } }),
        prisma_1.default.user.count({ where: { role: client_1.Role.SUPER_ADMIN } }),
        prisma_1.default.user.count({ where: { createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } })
    ]);
    const stats = {
        totalUsers: total,
        activeUsers: active,
        pendingUsers: pending,
        suspendedUsers: suspended,
        adminUsers,
        superAdminUsers,
        recentRegistrations,
        totalJobs: 0,
        totalGroups: 0,
        totalPosts: 0
    };
    res.status(200).json({ success: true, data: stats, stats });
});
exports.connectUser = (0, errorHandler_1.asyncHandler)(async (_req, res) => {
    res.status(200).json({ success: true, message: 'Connected' });
});
exports.disconnectUser = (0, errorHandler_1.asyncHandler)(async (_req, res) => {
    res.status(200).json({ success: true, message: 'Disconnected' });
});
exports.getConnectionSuggestions = (0, errorHandler_1.asyncHandler)(async (_req, res) => {
    res.status(200).json({ success: true, data: [] });
});
exports.searchAlumni = (0, errorHandler_1.asyncHandler)(async (_req, res) => {
    res.status(200).json({ success: true, data: [] });
});
exports.getPendingUsers = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const page = Number.parseInt(req.query.page) || 1;
    const limit = Number.parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const where = { status: client_1.Status.PENDING };
    const [users, total] = await Promise.all([
        prisma_1.default.user.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' }
        }),
        prisma_1.default.user.count({ where })
    ]);
    res.status(200).json({
        success: true,
        data: users,
        users,
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
    const user = await prisma_1.default.user.update({
        where: { id },
        data: { role: client_1.Role.ADMIN }
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
    const user = await prisma_1.default.user.update({
        where: { id },
        data: { role: client_1.Role.USER }
    });
    res.status(200).json({ success: true, data: user });
});
exports.updateUserProfile = exports.updateProfile;
exports.getAlumniDirectory = exports.getPublicAlumni;
exports.getUserSuggestions = exports.getConnectionSuggestions;
//# sourceMappingURL=userController.js.map
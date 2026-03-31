"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAdmin = exports.requireSuperAdmin = exports.requireRole = exports.authMiddleware = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = require("../models/User");
const prisma_1 = __importDefault(require("../config/prisma"));
const authMiddleware = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        if (!token) {
            res.status(401).json({
                success: false,
                message: 'No token, authorization denied',
                code: 'NO_TOKEN'
            });
            return;
        }
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        const user = await prisma_1.default.user.findUnique({
            where: { id: decoded.userId },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                status: true,
                isVerified: true,
                admissionNumber: true,
                admissionYear: true,
                accountType: true,
                hasPremiumBadge: true,
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
                needsManualVerification: true,
                notificationSettings: true,
                privacySettings: true,
                createdAt: true,
                updatedAt: true,
                lastLogin: true
            }
        });
        if (!user) {
            res.status(401).json({
                success: false,
                message: 'Token is not valid - user not found',
                code: 'INVALID_TOKEN'
            });
            return;
        }
        const normalizedStatus = String(user.status || '').toLowerCase();
        if (normalizedStatus === 'suspended') {
            res.status(403).json({
                success: false,
                message: 'Account has been suspended. Please contact administrator.',
                code: 'ACCOUNT_SUSPENDED'
            });
            return;
        }
        if (normalizedStatus === 'deleted') {
            res.status(403).json({
                success: false,
                message: 'Account no longer exists',
                code: 'ACCOUNT_DELETED'
            });
            return;
        }
        if (normalizedStatus === 'pending') {
            res.status(403).json({
                success: false,
                message: 'Account is pending approval',
                code: 'ACCOUNT_PENDING'
            });
            return;
        }
        req.user = {
            ...user,
            _id: user.id,
            role: String(user.role || '').toLowerCase(),
            status: normalizedStatus
        };
        next();
    }
    catch (error) {
        console.error('Auth middleware error:', error);
        if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
            res.status(401).json({
                success: false,
                message: 'Token has expired',
                code: 'TOKEN_EXPIRED'
            });
            return;
        }
        if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
            res.status(401).json({
                success: false,
                message: 'Invalid token format',
                code: 'INVALID_TOKEN_FORMAT'
            });
            return;
        }
        res.status(401).json({
            success: false,
            message: 'Token is not valid',
            code: 'TOKEN_INVALID'
        });
    }
};
exports.authMiddleware = authMiddleware;
const requireRole = (roles) => {
    return (req, res, next) => {
        if (!req.user) {
            res.status(401).json({ message: 'Not authenticated' });
            return;
        }
        const normalizedUserRole = String(req.user.role || '').toLowerCase();
        const allowedRoles = roles.map((role) => String(role).toLowerCase());
        if (!allowedRoles.includes(normalizedUserRole)) {
            res.status(403).json({ message: 'Insufficient permissions' });
            return;
        }
        next();
    };
};
exports.requireRole = requireRole;
exports.requireSuperAdmin = (0, exports.requireRole)([User_1.UserRole.SUPER_ADMIN]);
exports.requireAdmin = (0, exports.requireRole)([User_1.UserRole.ADMIN, User_1.UserRole.SUPER_ADMIN]);
//# sourceMappingURL=auth.js.map
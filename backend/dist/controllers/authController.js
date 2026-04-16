"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updatePrivacySettings = exports.updateNotificationSettings = exports.changePassword = exports.resetPassword = exports.forgotPassword = exports.uploadVerificationId = exports.getMe = exports.deactivateAccount = exports.logoutOtherSessions = exports.getActiveSessions = exports.logout = exports.refreshToken = exports.login = exports.register = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const client_1 = require("@prisma/client");
const prisma_1 = __importDefault(require("../config/prisma"));
const errorHandler_1 = require("../middleware/errorHandler");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const isBcryptHash = (value) => value.startsWith('$2a$') || value.startsWith('$2b$') || value.startsWith('$2y$');
const verifyPassword = async (inputPassword, storedPassword) => {
    if (!storedPassword)
        return false;
    if (isBcryptHash(storedPassword)) {
        return bcryptjs_1.default.compare(inputPassword, storedPassword);
    }
    return inputPassword === storedPassword;
};
const toClientRole = (role) => {
    if (role === client_1.Role.SUPER_ADMIN)
        return 'super_admin';
    if (String(role) === 'MODERATOR')
        return 'moderator';
    if (role === client_1.Role.ADMIN)
        return 'admin';
    return 'user';
};
const getAccountTypeLabel = (user) => {
    const value = user?.accountType;
    return (value || 'ALUMNI').toLowerCase();
};
const hasPremiumBadge = (user) => Boolean(user?.hasPremiumBadge);
const normalizeEmail = (value) => {
    if (typeof value !== 'string')
        return '';
    return value.trim().toLowerCase();
};
const extractRefreshToken = (req) => {
    const cookieToken = req.cookies?.refreshToken;
    const bodyToken = typeof req.body?.refreshToken === 'string' ? req.body.refreshToken : null;
    const headerToken = typeof req.header('x-refresh-token') === 'string' ? req.header('x-refresh-token') : null;
    return bodyToken || headerToken || cookieToken || null;
};
const parseBrowserFromUserAgent = (userAgent) => {
    const ua = userAgent.toLowerCase();
    if (ua.includes('edg/'))
        return 'Edge';
    if (ua.includes('opr/') || ua.includes('opera'))
        return 'Opera';
    if (ua.includes('chrome/'))
        return 'Chrome';
    if (ua.includes('safari/') && !ua.includes('chrome/'))
        return 'Safari';
    if (ua.includes('firefox/'))
        return 'Firefox';
    return 'Unknown Browser';
};
const parseDeviceFromUserAgent = (userAgent) => {
    const ua = userAgent.toLowerCase();
    if (ua.includes('iphone'))
        return 'iPhone';
    if (ua.includes('ipad'))
        return 'iPad';
    if (ua.includes('android'))
        return 'Android Device';
    if (ua.includes('macintosh') || ua.includes('mac os'))
        return 'Mac Device';
    if (ua.includes('windows'))
        return 'Windows Device';
    if (ua.includes('linux'))
        return 'Linux Device';
    return 'Unknown Device';
};
const ACCESS_TOKEN_EXPIRES_IN = process.env.JWT_EXPIRES_IN ||
    process.env.JWT_EXPIRE ||
    '12h';
const REFRESH_TOKEN_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN ||
    process.env.JWT_REFRESH_EXPIRE ||
    '30d';
const DEFAULT_REFRESH_COOKIE_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;
const REFRESH_COOKIE_MAX_AGE_MS = Number(process.env.JWT_REFRESH_COOKIE_MAX_AGE_MS) || DEFAULT_REFRESH_COOKIE_MAX_AGE_MS;
const generateTokens = (userId) => {
    const payload = { userId };
    const accessToken = jsonwebtoken_1.default.sign(payload, process.env.JWT_SECRET || 'fallback_secret', { expiresIn: ACCESS_TOKEN_EXPIRES_IN });
    const refreshToken = jsonwebtoken_1.default.sign(payload, process.env.JWT_REFRESH_SECRET || 'fallback_refresh_secret', { expiresIn: REFRESH_TOKEN_EXPIRES_IN });
    return { accessToken, refreshToken };
};
exports.register = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { email, password, firstName, lastName, name, admissionNumber, admissionYear, graduationYear, needsManualVerification, forgotAdmissionNumber, verificationDetails, accountType, facultyIdCardUrl, } = req.body;
    const normalizedEmail = normalizeEmail(email);
    if (!normalizedEmail) {
        res.status(400).json({ success: false, message: 'Email is required' });
        return;
    }
    const normalizedAdmissionNumber = typeof admissionNumber === 'string' ? admissionNumber.trim() : '';
    const normalizedVerificationDetails = typeof verificationDetails === 'string' ? verificationDetails.trim() : '';
    const normalizedFacultyIdCardUrl = typeof facultyIdCardUrl === 'string' ? facultyIdCardUrl.trim() : '';
    const normalizedAccountType = String(accountType || '').toUpperCase();
    const resolvedAccountType = normalizedAccountType === 'FACULTY' ? 'FACULTY' : 'ALUMNI';
    const requiresManualVerification = resolvedAccountType === 'FACULTY' ||
        Boolean(needsManualVerification) ||
        Boolean(forgotAdmissionNumber) ||
        normalizedAdmissionNumber.length === 0;
    if (!requiresManualVerification && !normalizedAdmissionNumber) {
        res.status(400).json({ success: false, message: 'Admission number is required' });
        return;
    }
    if (requiresManualVerification && normalizedVerificationDetails.length < 10 && !normalizedFacultyIdCardUrl) {
        res.status(400).json({
            success: false,
            message: 'Please provide verification details (minimum 10 characters) or upload faculty ID card for manual verification.'
        });
        return;
    }
    const existingUser = await prisma_1.default.user.findFirst({
        where: {
            email: {
                equals: normalizedEmail,
                mode: 'insensitive'
            }
        }
    });
    if (existingUser) {
        res.status(400).json({ success: false, message: 'Email already registered' });
        return;
    }
    const salt = await bcryptjs_1.default.genSalt(10);
    const hashedPassword = await bcryptjs_1.default.hash(password, salt);
    const resolvedName = (name || [firstName, lastName].filter(Boolean).join(' ')).trim();
    const inferredAdmissionYear = admissionYear ||
        graduationYear ||
        (normalizedAdmissionNumber.includes('/')
            ? `20${normalizedAdmissionNumber.split('/').pop()}`
            : undefined) ||
        '';
    if (resolvedAccountType === 'FACULTY' && !normalizedFacultyIdCardUrl) {
        res.status(400).json({
            success: false,
            message: 'Faculty ID card photo is required for verification.'
        });
        return;
    }
    const user = await prisma_1.default.user.create({
        data: {
            email: normalizedEmail,
            password: hashedPassword,
            role: client_1.Role.USER,
            name: resolvedName || normalizedEmail.split('@')[0],
            firstName,
            lastName,
            admissionNumber: normalizedAdmissionNumber || 'MANUAL_VERIFICATION',
            admissionYear: inferredAdmissionYear,
            accountType: resolvedAccountType,
            needsManualVerification: requiresManualVerification,
            verificationDetails: requiresManualVerification
                ? normalizedVerificationDetails || (resolvedAccountType === 'FACULTY' ? 'Faculty ID card submitted for verification.' : null)
                : null,
            facultyIdCardUrl: normalizedFacultyIdCardUrl || null,
            status: client_1.Status.PENDING,
        },
    });
    res.status(201).json({
        success: true,
        message: 'Registration submitted. Your account is pending approval.',
        user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: toClientRole(user.role),
            accountType: getAccountTypeLabel(user),
            hasPremiumBadge: hasPremiumBadge(user),
            facultyIdCardUrl: user.facultyIdCardUrl || undefined,
            admissionNumber: user.admissionNumber,
            admissionYear: user.admissionYear,
            status: user.status.toLowerCase(),
            isVerified: user.isVerified
        },
        data: {
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: toClientRole(user.role),
                accountType: getAccountTypeLabel(user),
                hasPremiumBadge: hasPremiumBadge(user),
                facultyIdCardUrl: user.facultyIdCardUrl || undefined,
                admissionNumber: user.admissionNumber,
                admissionYear: user.admissionYear,
                status: user.status.toLowerCase(),
                isVerified: user.isVerified
            },
            requiresApproval: true
        }
    });
});
exports.login = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { email, password } = req.body;
    const normalizedEmail = normalizeEmail(email);
    if (!normalizedEmail || typeof password !== 'string' || password.length === 0) {
        res.status(401).json({ success: false, message: 'Invalid credentials' });
        return;
    }
    const user = await prisma_1.default.user.findFirst({
        where: {
            email: {
                equals: normalizedEmail,
                mode: 'insensitive'
            }
        }
    });
    if (!user) {
        res.status(401).json({ success: false, message: 'Invalid credentials' });
        return;
    }
    const isMatch = await verifyPassword(password, user.password);
    if (!isMatch) {
        res.status(401).json({ success: false, message: 'Invalid credentials' });
        return;
    }
    if (user.status === client_1.Status.PENDING) {
        res.status(403).json({
            success: false,
            message: 'Your account is pending approval by super admin/moderator.'
        });
        return;
    }
    if (user.status === client_1.Status.SUSPENDED || user.status === client_1.Status.DELETED) {
        res.status(403).json({
            success: false,
            message: 'Your account is not active. Please contact support.'
        });
        return;
    }
    if (!isBcryptHash(user.password)) {
        const salt = await bcryptjs_1.default.genSalt(10);
        const hashedPassword = await bcryptjs_1.default.hash(password, salt);
        await prisma_1.default.user.update({
            where: { id: user.id },
            data: { password: hashedPassword }
        });
    }
    await prisma_1.default.user.update({
        where: { id: user.id },
        data: { lastLogin: new Date() }
    });
    const { accessToken, refreshToken } = generateTokens(user.id);
    await prisma_1.default.user.update({
        where: { id: user.id },
        data: { refreshTokens: { push: refreshToken } }
    });
    res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: REFRESH_COOKIE_MAX_AGE_MS
    });
    res.status(200).json({
        success: true,
        message: 'Login successful',
        user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: toClientRole(user.role),
            accountType: getAccountTypeLabel(user),
            hasPremiumBadge: hasPremiumBadge(user),
            facultyIdCardUrl: user.facultyIdCardUrl || undefined,
            admissionNumber: user.admissionNumber,
            admissionYear: user.admissionYear,
            status: user.status.toLowerCase(),
            isVerified: user.isVerified,
            profileImage: user.profileImage,
            bio: user.bio,
            headline: user.headline,
            city: user.city,
            country: user.country,
            company: user.company,
            jobTitle: user.jobTitle
        },
        accessToken,
        refreshToken,
        data: {
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: toClientRole(user.role),
                accountType: getAccountTypeLabel(user),
                hasPremiumBadge: hasPremiumBadge(user),
                facultyIdCardUrl: user.facultyIdCardUrl || undefined,
                admissionNumber: user.admissionNumber,
                admissionYear: user.admissionYear,
                status: user.status.toLowerCase(),
                isVerified: user.isVerified,
                profileImage: user.profileImage,
                bio: user.bio,
                headline: user.headline,
                city: user.city,
                country: user.country,
                company: user.company,
                jobTitle: user.jobTitle
            },
            accessToken
        }
    });
});
exports.refreshToken = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const token = extractRefreshToken(req);
    if (!token) {
        res.status(401).json({ success: false, message: 'Refresh token not found' });
        return;
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_REFRESH_SECRET || 'fallback_refresh_secret');
        const user = await prisma_1.default.user.findUnique({
            where: { id: decoded.userId },
            select: { id: true, refreshTokens: true }
        });
        if (!user) {
            res.status(401).json({ success: false, message: 'Invalid refresh token' });
            return;
        }
        if (!Array.isArray(user.refreshTokens) || !user.refreshTokens.includes(token)) {
            res.status(401).json({ success: false, message: 'Refresh token has been revoked' });
            return;
        }
        const tokens = generateTokens(user.id);
        await prisma_1.default.user.update({
            where: { id: user.id },
            data: {
                refreshTokens: user.refreshTokens.map((storedToken) => storedToken === token ? tokens.refreshToken : storedToken)
            }
        });
        res.cookie('refreshToken', tokens.refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: REFRESH_COOKIE_MAX_AGE_MS
        });
        res.status(200).json({
            success: true,
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            data: { accessToken: tokens.accessToken, refreshToken: tokens.refreshToken }
        });
    }
    catch (error) {
        res.status(401).json({ success: false, message: 'Invalid or expired refresh token' });
    }
});
exports.logout = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const token = extractRefreshToken(req);
    if (req.user?.id && token) {
        const user = await prisma_1.default.user.findUnique({
            where: { id: req.user.id },
            select: { refreshTokens: true }
        });
        if (user) {
            await prisma_1.default.user.update({
                where: { id: req.user.id },
                data: { refreshTokens: (user.refreshTokens || []).filter((storedToken) => storedToken !== token) }
            });
        }
    }
    res.clearCookie('refreshToken');
    res.status(200).json({ success: true, message: 'Logged out successfully' });
});
exports.getActiveSessions = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    if (!req.user?.id) {
        res.status(401).json({ success: false, message: 'Not authenticated' });
        return;
    }
    const token = extractRefreshToken(req);
    const user = await prisma_1.default.user.findUnique({
        where: { id: req.user.id },
        select: { refreshTokens: true, lastLogin: true, updatedAt: true }
    });
    if (!user) {
        res.status(404).json({ success: false, message: 'User not found' });
        return;
    }
    const activeTokens = Array.isArray(user.refreshTokens) ? user.refreshTokens : [];
    const hasCurrentToken = Boolean(token && activeTokens.includes(token));
    const otherSessionsCount = hasCurrentToken
        ? Math.max(0, activeTokens.length - 1)
        : activeTokens.length;
    const userAgent = String(req.headers['user-agent'] || 'Unknown Device');
    const browser = parseBrowserFromUserAgent(userAgent);
    const device = parseDeviceFromUserAgent(userAgent);
    const lastActive = (user.lastLogin || user.updatedAt || new Date()).toISOString();
    const sessions = [
        {
            id: 'current',
            device,
            browser,
            location: 'Current Device',
            time: 'Current Session',
            lastActive,
            isCurrent: true,
        },
        ...Array.from({ length: otherSessionsCount }, (_, index) => ({
            id: `other-${index + 1}`,
            device: `Other Device ${index + 1}`,
            browser: 'Unknown',
            location: 'Unknown',
            time: 'Active',
            lastActive,
            isCurrent: false,
        })),
    ];
    res.status(200).json({
        success: true,
        data: {
            sessions,
            totalSessions: sessions.length,
            otherSessionsCount,
        }
    });
});
exports.logoutOtherSessions = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    if (!req.user?.id) {
        res.status(401).json({ success: false, message: 'Not authenticated' });
        return;
    }
    const token = extractRefreshToken(req);
    const user = await prisma_1.default.user.findUnique({
        where: { id: req.user.id },
        select: { refreshTokens: true }
    });
    if (!user) {
        res.status(404).json({ success: false, message: 'User not found' });
        return;
    }
    const activeTokens = Array.isArray(user.refreshTokens) ? user.refreshTokens : [];
    const updatedTokens = token && activeTokens.includes(token) ? [token] : [];
    await prisma_1.default.user.update({
        where: { id: req.user.id },
        data: { refreshTokens: updatedTokens }
    });
    res.status(200).json({ success: true, message: 'Signed out from other devices' });
});
exports.deactivateAccount = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    if (!req.user?.id) {
        res.status(401).json({ success: false, message: 'Not authenticated' });
        return;
    }
    await prisma_1.default.user.update({
        where: { id: req.user.id },
        data: { status: client_1.Status.DELETED, refreshTokens: [] }
    });
    res.clearCookie('refreshToken');
    res.status(200).json({ success: true, message: 'Account deactivated successfully' });
});
exports.getMe = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    if (!req.user) {
        res.status(401).json({ success: false, message: 'Not authenticated' });
        return;
    }
    const user = await prisma_1.default.user.findUnique({
        where: { id: req.user.id }
    });
    if (!user) {
        res.status(404).json({ success: false, message: 'User not found' });
        return;
    }
    res.status(200).json({
        success: true,
        user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: toClientRole(user.role),
            accountType: getAccountTypeLabel(user),
            hasPremiumBadge: hasPremiumBadge(user),
            facultyIdCardUrl: user.facultyIdCardUrl || undefined,
            admissionNumber: user.admissionNumber,
            admissionYear: user.admissionYear,
            status: user.status.toLowerCase(),
            isVerified: user.isVerified,
            profileImage: user.profileImage,
            bio: user.bio,
            headline: user.headline,
            city: user.city,
            country: user.country,
            contactEmail: user.contactEmail,
            contactPhone: user.contactPhone,
            linkedInProfile: user.linkedInProfile,
            company: user.company,
            jobTitle: user.jobTitle,
            isAvailableAsMentor: user.isAvailableAsMentor,
            location: user.location,
            experiences: user.experiences ?? [],
            educations: user.educations ?? [],
            skills: user.skills ?? [],
            interests: user.interests ?? [],
            notificationSettings: user.notificationSettings,
            privacySettings: user.privacySettings
        }
    });
});
exports.uploadVerificationId = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    if (!req.file) {
        res.status(400).json({ success: false, message: 'ID card image is required' });
        return;
    }
    if (!req.file.mimetype.startsWith('image/')) {
        res.status(400).json({ success: false, message: 'Only image files are allowed for faculty ID verification' });
        return;
    }
    res.status(200).json({
        success: true,
        message: 'ID card uploaded successfully',
        data: {
            url: `/api/uploads/${req.file.filename}`,
            filename: req.file.filename,
            originalName: req.file.originalname,
            mimetype: req.file.mimetype,
            size: req.file.size,
        }
    });
});
exports.forgotPassword = (0, errorHandler_1.asyncHandler)(async (_req, res) => {
    res.status(200).json({ success: true, message: 'Password reset email sent' });
});
exports.resetPassword = (0, errorHandler_1.asyncHandler)(async (_req, res) => {
    res.status(200).json({ success: true, message: 'Password has been reset' });
});
exports.changePassword = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    if (!req.user) {
        res.status(401).json({ success: false, message: 'Not authenticated' });
        return;
    }
    const { currentPassword, newPassword } = req.body;
    const user = await prisma_1.default.user.findUnique({ where: { id: req.user.id } });
    if (!user) {
        res.status(404).json({ success: false, message: 'User not found' });
        return;
    }
    const isMatch = await verifyPassword(currentPassword, user.password);
    if (!isMatch) {
        res.status(400).json({ success: false, message: 'Invalid current password' });
        return;
    }
    const salt = await bcryptjs_1.default.genSalt(10);
    const hashedPassword = await bcryptjs_1.default.hash(newPassword, salt);
    await prisma_1.default.user.update({
        where: { id: user.id },
        data: { password: hashedPassword }
    });
    res.status(200).json({ success: true, message: 'Password changed successfully' });
});
exports.updateNotificationSettings = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    if (!req.user) {
        res.status(401).json({ success: false, message: 'Not authenticated' });
        return;
    }
    const settings = await prisma_1.default.user.update({
        where: { id: req.user.id },
        data: { notificationSettings: { ...(req.body || {}) } },
        select: { notificationSettings: true }
    });
    res.status(200).json({ success: true, data: settings.notificationSettings });
});
exports.updatePrivacySettings = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    if (!req.user) {
        res.status(401).json({ success: false, message: 'Not authenticated' });
        return;
    }
    const settings = await prisma_1.default.user.update({
        where: { id: req.user.id },
        data: { privacySettings: { ...(req.body || {}) } },
        select: { privacySettings: true }
    });
    res.status(200).json({ success: true, data: settings.privacySettings });
});
//# sourceMappingURL=authController.js.map
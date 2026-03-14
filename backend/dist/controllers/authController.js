"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updatePrivacySettings = exports.updateNotificationSettings = exports.changePassword = exports.resetPassword = exports.forgotPassword = exports.getMe = exports.logout = exports.refreshToken = exports.login = exports.register = void 0;
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
const generateTokens = (userId) => {
    const payload = { userId };
    const accessToken = jsonwebtoken_1.default.sign(payload, process.env.JWT_SECRET || 'fallback_secret', { expiresIn: process.env.JWT_EXPIRES_IN || '1h' });
    const refreshToken = jsonwebtoken_1.default.sign(payload, process.env.JWT_REFRESH_SECRET || 'fallback_refresh_secret', { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' });
    return { accessToken, refreshToken };
};
exports.register = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { email, password, firstName, lastName, name, role, admissionNumber, admissionYear, graduationYear } = req.body;
    const normalizedAdmissionNumber = typeof admissionNumber === 'string' ? admissionNumber.trim() : '';
    if (!normalizedAdmissionNumber) {
        res.status(400).json({ success: false, message: 'Admission number is required' });
        return;
    }
    const existingUser = await prisma_1.default.user.findUnique({ where: { email } });
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
    let resolvedRole = client_1.Role.USER;
    if (role === 'SUPER_ADMIN' || role === 'super_admin') {
        resolvedRole = client_1.Role.SUPER_ADMIN;
    }
    else if (role === 'ADMIN' || role === 'admin') {
        resolvedRole = client_1.Role.ADMIN;
    }
    else if (role === 'MODERATOR' || role === 'moderator') {
        resolvedRole = 'MODERATOR';
    }
    else if (role === 'USER' || role === 'user') {
        resolvedRole = client_1.Role.USER;
    }
    const user = await prisma_1.default.user.create({
        data: {
            email,
            password: hashedPassword,
            role: resolvedRole,
            name: resolvedName || email.split('@')[0],
            firstName,
            lastName,
            admissionNumber: normalizedAdmissionNumber,
            admissionYear: inferredAdmissionYear
        },
    });
    const { accessToken, refreshToken } = generateTokens(user.id);
    res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000
    });
    res.status(201).json({
        success: true,
        message: 'User registered successfully',
        user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: toClientRole(user.role),
            admissionNumber: user.admissionNumber,
            admissionYear: user.admissionYear,
            status: user.status.toLowerCase(),
            isVerified: user.isVerified
        },
        accessToken,
        refreshToken,
        data: {
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: toClientRole(user.role),
                admissionNumber: user.admissionNumber,
                admissionYear: user.admissionYear,
                status: user.status.toLowerCase(),
                isVerified: user.isVerified
            },
            accessToken
        }
    });
});
exports.login = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { email, password } = req.body;
    const user = await prisma_1.default.user.findUnique({
        where: { email }
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
    res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000
    });
    res.status(200).json({
        success: true,
        message: 'Login successful',
        user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: toClientRole(user.role),
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
    const token = req.cookies.refreshToken;
    if (!token) {
        res.status(401).json({ success: false, message: 'Refresh token not found' });
        return;
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_REFRESH_SECRET || 'fallback_refresh_secret');
        const user = await prisma_1.default.user.findUnique({ where: { id: decoded.userId } });
        if (!user) {
            res.status(401).json({ success: false, message: 'Invalid refresh token' });
            return;
        }
        const tokens = generateTokens(user.id);
        res.cookie('refreshToken', tokens.refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });
        res.status(200).json({
            success: true,
            data: { accessToken: tokens.accessToken }
        });
    }
    catch (error) {
        res.status(401).json({ success: false, message: 'Invalid or expired refresh token' });
    }
});
exports.logout = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    res.clearCookie('refreshToken');
    res.status(200).json({ success: true, message: 'Logged out successfully' });
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
exports.forgotPassword = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    res.status(200).json({ success: true, message: 'Password reset email sent' });
});
exports.resetPassword = (0, errorHandler_1.asyncHandler)(async (req, res) => {
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
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.updatePrivacySettings = exports.updateNotificationSettings = exports.changePassword = exports.resetPassword = exports.forgotPassword = exports.getMe = exports.logout = exports.refreshToken = exports.login = exports.register = void 0;
const jwt = __importStar(require("jsonwebtoken"));
const User_1 = __importStar(require("../models/User"));
const errorHandler_1 = require("../middleware/errorHandler");
const generateTokens = (userId) => {
    const jwtSecret = process.env.JWT_SECRET || 'your-secret-key';
    const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key';
    const accessToken = jwt.sign({ userId }, jwtSecret, { expiresIn: process.env.JWT_EXPIRE || '1h' });
    const refreshToken = jwt.sign({ userId }, jwtRefreshSecret, { expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d' });
    return { accessToken, refreshToken };
};
exports.register = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { email, password, name, admissionNumber, needsManualVerification, verificationDetails, admissionYear: manualAdmissionYear } = req.body;
    console.log('Registration request body:', req.body);
    if (!email || !password || !name) {
        res.status(400).json({ success: false, message: 'Please provide name, email, and password' });
        return;
    }
    const existingUser = await User_1.default.findOne({ email: email.toLowerCase() });
    if (existingUser) {
        res.status(400).json({ success: false, message: 'User already exists with this email' });
        return;
    }
    let userToCreate = {
        email: email.toLowerCase(),
        password,
        name,
        needsManualVerification: needsManualVerification || false,
    };
    const superAdminEmails = ['mpsajmer123@gmail.com', 'futurist.raghav@gmail.com'];
    const isSuperAdmin = superAdminEmails.includes(email.toLowerCase());
    if (needsManualVerification) {
        if (!verificationDetails || verificationDetails.length < 10) {
            res.status(400).json({ success: false, message: 'Please provide sufficient details for manual verification.' });
            return;
        }
        if (!manualAdmissionYear) {
            res.status(400).json({ success: false, message: 'Admission year is required for manual verification.' });
            return;
        }
        const year = parseInt(manualAdmissionYear, 10);
        const currentYear = new Date().getFullYear();
        if (isNaN(year) || year < 1989 || year > currentYear + 1) {
            res.status(400).json({ success: false, message: `Admission year must be between 1989 and ${currentYear + 1}.` });
            return;
        }
        userToCreate = {
            ...userToCreate,
            admissionNumber: `501/MV${Math.floor(Math.random() * 1e6)}`,
            admissionYear: manualAdmissionYear,
            verificationDetails,
            status: User_1.UserStatus.PENDING,
            isVerified: false,
        };
    }
    else {
        if (!admissionNumber) {
            res.status(400).json({ success: false, message: 'Admission number is required.' });
            return;
        }
        const existingAdmission = await User_1.default.findOne({ admissionNumber });
        if (existingAdmission) {
            res.status(400).json({ success: false, message: 'Admission number already registered' });
            return;
        }
        const parts = admissionNumber.split('/');
        if (parts.length < 2) {
            res.status(400).json({ success: false, message: 'Invalid admission number format. Expected format: number/year.' });
            return;
        }
        const yearPart = parts[parts.length - 1];
        const year = parseInt(yearPart, 10);
        const currentYear = new Date().getFullYear();
        let admissionYear;
        if (yearPart.length === 2) {
            if (year >= 89 && year <= 99) {
                admissionYear = `19${year}`;
            }
            else {
                admissionYear = `20${year.toString().padStart(2, '0')}`;
            }
        }
        else {
            admissionYear = year.toString();
        }
        const numericAdmissionYear = parseInt(admissionYear, 10);
        if (isNaN(numericAdmissionYear) || numericAdmissionYear < 1989 || numericAdmissionYear > currentYear + 1) {
            res.status(400).json({ success: false, message: `Invalid admission year. Must be between 1989 and ${currentYear + 1}.` });
            return;
        }
        userToCreate = {
            ...userToCreate,
            admissionNumber,
            admissionYear,
            status: isSuperAdmin ? User_1.UserStatus.ACTIVE : User_1.UserStatus.PENDING,
            isVerified: isSuperAdmin,
        };
    }
    userToCreate.role = isSuperAdmin ? User_1.UserRole.SUPER_ADMIN : User_1.UserRole.USER;
    try {
        const user = await User_1.default.create(userToCreate);
        if (!isSuperAdmin) {
            res.status(201).json({
                success: true,
                message: 'Registration successful. Your account is pending approval.',
                needsManualVerification: !!needsManualVerification,
            });
            return;
        }
        const { accessToken, refreshToken } = generateTokens(user._id);
        user.refreshTokens.push(refreshToken);
        await user.save();
        res.status(201).json({
            success: true,
            message: 'Super admin account created successfully',
            user: {
                id: user._id,
                email: user.email,
                name: user.name,
                role: user.role,
                status: user.status,
                isVerified: user.isVerified
            },
            accessToken,
            refreshToken
        });
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
        res.status(500).json({ success: false, message: errorMessage });
    }
});
exports.login = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        res.status(400).json({ message: 'Please provide email and password' });
        return;
    }
    const user = await User_1.default.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) {
        res.status(401).json({ message: 'Invalid credentials' });
        return;
    }
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
        res.status(401).json({ message: 'Invalid credentials' });
        return;
    }
    if (user.status === User_1.UserStatus.PENDING) {
        res.status(403).json({ message: 'Account pending approval' });
        return;
    }
    if (user.status === User_1.UserStatus.SUSPENDED) {
        res.status(403).json({ message: 'Account suspended' });
        return;
    }
    if (user.status === User_1.UserStatus.DELETED) {
        res.status(403).json({ message: 'Account not found' });
        return;
    }
    const { accessToken, refreshToken } = generateTokens(user._id);
    user.refreshTokens.push(refreshToken);
    user.lastLogin = new Date();
    await user.save();
    res.status(200).json({
        success: true,
        message: 'Login successful',
        user: {
            id: user._id,
            email: user.email,
            name: user.name,
            role: user.role,
            status: user.status,
            isVerified: user.isVerified,
            admissionNumber: user.admissionNumber,
            profileImage: user.profileImage,
            bio: user.bio,
            headline: user.headline,
            city: user.city,
            country: user.country,
            company: user.company,
            jobTitle: user.jobTitle
        },
        accessToken,
        refreshToken
    });
});
exports.refreshToken = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { refreshToken } = req.body;
    if (!refreshToken) {
        res.status(401).json({ message: 'Refresh token required' });
        return;
    }
    try {
        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key');
        const user = await User_1.default.findById(decoded.userId);
        if (!user || !user.refreshTokens.includes(refreshToken)) {
            res.status(401).json({ message: 'Invalid refresh token' });
            return;
        }
        const tokens = generateTokens(user._id);
        user.refreshTokens = user.refreshTokens.filter(token => token !== refreshToken);
        user.refreshTokens.push(tokens.refreshToken);
        await user.save();
        res.status(200).json({
            success: true,
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken
        });
    }
    catch (error) {
        res.status(401).json({ message: 'Invalid refresh token' });
    }
});
exports.logout = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { refreshToken } = req.body;
    if (req.user && refreshToken) {
        req.user.refreshTokens = req.user.refreshTokens.filter(token => token !== refreshToken);
        await req.user.save();
    }
    res.status(200).json({
        success: true,
        message: 'Logged out successfully'
    });
});
exports.getMe = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    if (!req.user) {
        res.status(401).json({ message: 'Not authenticated' });
        return;
    }
    res.status(200).json({
        success: true,
        user: req.user
    });
});
exports.forgotPassword = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { email } = req.body;
    const user = await User_1.default.findOne({ email: email.toLowerCase() });
    if (!user) {
        res.status(404).json({ message: 'User not found' });
        return;
    }
    const resetToken = user.generatePasswordResetToken();
    await user.save();
    res.status(200).json({
        success: true,
        message: 'Password reset token generated',
        resetToken
    });
});
exports.resetPassword = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { token, password } = req.body;
    if (!token || !password) {
        res.status(400).json({ message: 'Token and password are required' });
        return;
    }
    const user = await User_1.default.findOne({
        passwordResetExpires: { $gt: Date.now() }
    }).select('+passwordResetToken');
    if (!user) {
        res.status(400).json({ message: 'Invalid or expired reset token' });
        return;
    }
    const isTokenValid = await user.comparePassword(token);
    if (!isTokenValid) {
        res.status(400).json({ message: 'Invalid reset token' });
        return;
    }
    user.password = password;
    user.passwordResetToken = null;
    user.passwordResetExpires = null;
    user.refreshTokens = [];
    await user.save();
    res.status(200).json({
        success: true,
        message: 'Password reset successful'
    });
});
exports.changePassword = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user?._id;
    if (!currentPassword || !newPassword) {
        res.status(400).json({
            success: false,
            message: 'Please provide current and new password'
        });
        return;
    }
    if (newPassword.length < 8) {
        res.status(400).json({
            success: false,
            message: 'New password must be at least 8 characters long'
        });
        return;
    }
    const user = await User_1.default.findById(userId).select('+password');
    if (!user) {
        res.status(404).json({ success: false, message: 'User not found' });
        return;
    }
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
        res.status(400).json({
            success: false,
            message: 'Current password is incorrect'
        });
        return;
    }
    user.password = newPassword;
    user.refreshTokens = [];
    await user.save();
    res.status(200).json({
        success: true,
        message: 'Password changed successfully'
    });
});
exports.updateNotificationSettings = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user?._id;
    const notificationSettings = req.body;
    const user = await User_1.default.findByIdAndUpdate(userId, { $set: { notificationSettings } }, { new: true, runValidators: true }).select('-password -refreshTokens');
    if (!user) {
        res.status(404).json({ success: false, message: 'User not found' });
        return;
    }
    res.status(200).json({
        success: true,
        message: 'Notification settings updated successfully',
        data: user.notificationSettings
    });
});
exports.updatePrivacySettings = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user?._id;
    const privacySettings = req.body;
    const user = await User_1.default.findByIdAndUpdate(userId, { $set: { privacySettings } }, { new: true, runValidators: true }).select('-password -refreshTokens');
    if (!user) {
        res.status(404).json({ success: false, message: 'User not found' });
        return;
    }
    res.status(200).json({
        success: true,
        message: 'Privacy settings updated successfully',
        data: user.privacySettings
    });
});
//# sourceMappingURL=authController.js.map
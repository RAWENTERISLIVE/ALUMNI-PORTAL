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
exports.getUserById = exports.updateUserProfile = exports.getUserStats = exports.getAlumniDirectory = exports.deleteUser = exports.demoteAdmin = exports.promoteToAdmin = exports.reactivateUser = exports.suspendUser = exports.rejectUser = exports.approveUser = exports.getPendingUsers = exports.getAllUsers = void 0;
const User_1 = __importStar(require("../models/User"));
const errorHandler_1 = require("../middleware/errorHandler");
exports.getAllUsers = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const status = req.query.status;
    const role = req.query.role;
    const search = req.query.search;
    const query = {};
    if (status) {
        query.status = status;
    }
    if (role) {
        query.role = role;
    }
    if (search) {
        query.$or = [
            { name: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } },
            { admissionNumber: { $regex: search, $options: 'i' } }
        ];
    }
    const users = await User_1.default.find(query)
        .select('-password -refreshTokens -passwordResetToken -emailVerificationToken')
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);
    const total = await User_1.default.countDocuments(query);
    res.status(200).json({
        success: true,
        users,
        pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
        }
    });
});
exports.getPendingUsers = (0, errorHandler_1.asyncHandler)(async (_req, res) => {
    const users = await User_1.default.find({ status: User_1.UserStatus.PENDING })
        .select('-password -refreshTokens -passwordResetToken -emailVerificationToken')
        .sort({ createdAt: -1 });
    res.status(200).json({
        success: true,
        users
    });
});
exports.approveUser = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { userId } = req.params;
    const user = await User_1.default.findById(userId);
    if (!user) {
        res.status(404).json({ message: 'User not found' });
        return;
    }
    if (user.status !== User_1.UserStatus.PENDING) {
        res.status(400).json({ message: 'User is not pending approval' });
        return;
    }
    user.status = User_1.UserStatus.ACTIVE;
    user.isVerified = true;
    await user.save();
    res.status(200).json({
        success: true,
        message: 'User approved successfully',
        user: {
            id: user._id,
            name: user.name,
            email: user.email,
            status: user.status
        }
    });
});
exports.rejectUser = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { userId } = req.params;
    const { reason: _reason } = req.body;
    const user = await User_1.default.findById(userId);
    if (!user) {
        res.status(404).json({ message: 'User not found' });
        return;
    }
    if (user.status !== User_1.UserStatus.PENDING) {
        res.status(400).json({ message: 'User is not pending approval' });
        return;
    }
    user.status = User_1.UserStatus.DELETED;
    await user.save();
    res.status(200).json({
        success: true,
        message: 'User rejected successfully'
    });
});
exports.suspendUser = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { userId } = req.params;
    const { reason: _reason } = req.body;
    const user = await User_1.default.findById(userId);
    if (!user) {
        res.status(404).json({ message: 'User not found' });
        return;
    }
    if (user.role === User_1.UserRole.SUPER_ADMIN) {
        res.status(403).json({ message: 'Cannot suspend super admin' });
        return;
    }
    if (user.role === User_1.UserRole.ADMIN && req.user?.role !== User_1.UserRole.SUPER_ADMIN) {
        res.status(403).json({ message: 'Only super admins can suspend admins' });
        return;
    }
    user.status = User_1.UserStatus.SUSPENDED;
    user.refreshTokens = [];
    await user.save();
    res.status(200).json({
        success: true,
        message: 'User suspended successfully',
        user: {
            id: user._id,
            name: user.name,
            email: user.email,
            status: user.status
        }
    });
});
exports.reactivateUser = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { userId } = req.params;
    const user = await User_1.default.findById(userId);
    if (!user) {
        res.status(404).json({ message: 'User not found' });
        return;
    }
    if (user.status !== User_1.UserStatus.SUSPENDED) {
        res.status(400).json({ message: 'User is not suspended' });
        return;
    }
    user.status = User_1.UserStatus.ACTIVE;
    await user.save();
    res.status(200).json({
        success: true,
        message: 'User reactivated successfully',
        user: {
            id: user._id,
            name: user.name,
            email: user.email,
            status: user.status
        }
    });
});
exports.promoteToAdmin = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { userId } = req.params;
    const user = await User_1.default.findById(userId);
    if (!user) {
        res.status(404).json({ message: 'User not found' });
        return;
    }
    if (user.role === User_1.UserRole.ADMIN || user.role === User_1.UserRole.SUPER_ADMIN) {
        res.status(400).json({ message: 'User is already an admin or super admin' });
        return;
    }
    user.role = User_1.UserRole.ADMIN;
    await user.save();
    res.status(200).json({
        success: true,
        message: 'User promoted to admin successfully',
        user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role
        }
    });
});
exports.demoteAdmin = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { userId } = req.params;
    const user = await User_1.default.findById(userId);
    if (!user) {
        res.status(404).json({ message: 'User not found' });
        return;
    }
    if (user.role === User_1.UserRole.SUPER_ADMIN) {
        res.status(403).json({ message: 'Cannot demote super admin' });
        return;
    }
    if (user.role !== User_1.UserRole.ADMIN) {
        res.status(400).json({ message: 'User is not an admin' });
        return;
    }
    user.role = User_1.UserRole.USER;
    await user.save();
    res.status(200).json({
        success: true,
        message: 'Admin demoted to user successfully',
        user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role
        }
    });
});
exports.deleteUser = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { userId } = req.params;
    const user = await User_1.default.findById(userId);
    if (!user) {
        res.status(404).json({ message: 'User not found' });
        return;
    }
    if (user.role === User_1.UserRole.SUPER_ADMIN) {
        res.status(403).json({ message: 'Cannot delete super admin' });
        return;
    }
    await User_1.default.findByIdAndDelete(userId);
    res.status(200).json({
        success: true,
        message: 'User deleted permanently'
    });
});
const getAlumniDirectory = async (_req, res) => {
    try {
        const alumni = await User_1.default.find({ status: 'active' })
            .select('firstName lastName email professionalInfo education location profilePicture')
            .sort({ lastName: 1 });
        res.status(200).json({
            success: true,
            data: alumni,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
        });
    }
};
exports.getAlumniDirectory = getAlumniDirectory;
exports.getUserStats = (0, errorHandler_1.asyncHandler)(async (_req, res) => {
    const totalUsers = await User_1.default.countDocuments();
    const activeUsers = await User_1.default.countDocuments({ status: User_1.UserStatus.ACTIVE });
    const pendingUsers = await User_1.default.countDocuments({ status: User_1.UserStatus.PENDING });
    const suspendedUsers = await User_1.default.countDocuments({ status: User_1.UserStatus.SUSPENDED });
    const adminUsers = await User_1.default.countDocuments({ role: User_1.UserRole.ADMIN });
    const superAdminUsers = await User_1.default.countDocuments({ role: User_1.UserRole.SUPER_ADMIN });
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentRegistrations = await User_1.default.countDocuments({
        createdAt: { $gte: thirtyDaysAgo }
    });
    res.status(200).json({
        success: true,
        stats: {
            totalUsers,
            activeUsers,
            pendingUsers,
            suspendedUsers,
            adminUsers,
            superAdminUsers,
            recentRegistrations,
            totalJobs: 0,
            totalGroups: 0,
            totalPosts: 0
        }
    });
});
exports.updateUserProfile = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { userId } = req.params;
    const updates = req.body;
    if (req.user?._id.toString() !== userId &&
        req.user?.role !== User_1.UserRole.ADMIN &&
        req.user?.role !== User_1.UserRole.SUPER_ADMIN) {
        res.status(403).json({ message: 'Not authorized to update this profile' });
        return;
    }
    delete updates.password;
    delete updates.role;
    delete updates.status;
    delete updates.refreshTokens;
    delete updates.passwordResetToken;
    delete updates.emailVerificationToken;
    const user = await User_1.default.findByIdAndUpdate(userId, { $set: updates }, { new: true, runValidators: true }).select('-password -refreshTokens');
    if (!user) {
        res.status(404).json({ message: 'User not found' });
        return;
    }
    res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        user
    });
});
exports.getUserById = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { userId } = req.params;
    const user = await User_1.default.findById(userId)
        .select('-password -refreshTokens -passwordResetToken -emailVerificationToken');
    if (!user) {
        res.status(404).json({ message: 'User not found' });
        return;
    }
    res.status(200).json({
        success: true,
        user
    });
});
//# sourceMappingURL=userController.js.map
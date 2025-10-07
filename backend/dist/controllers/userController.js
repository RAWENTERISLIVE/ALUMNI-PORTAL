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
exports.updatePrivacySettings = exports.updateUserInterests = exports.updateUserSkills = exports.getUserSuggestions = exports.getUserById = exports.updateUserProfile = exports.getUserStats = exports.getAlumniDirectory = exports.deleteUser = exports.demoteAdmin = exports.promoteToAdmin = exports.reactivateUser = exports.suspendUser = exports.rejectUser = exports.approveUser = exports.getPendingUsers = exports.getAllUsers = void 0;
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
    const transformedUsers = users.map(user => ({
        ...user.toObject(),
        id: user._id.toString()
    }));
    res.status(200).json({
        success: true,
        users: transformedUsers,
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
    const transformedUsers = users.map(user => ({
        ...user.toObject(),
        id: user._id.toString()
    }));
    res.status(200).json({
        success: true,
        users: transformedUsers
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
    if (user.needsManualVerification && user.admissionNumber === 'MANUAL_VERIFICATION') {
        const year = user.admissionYear;
        const yy = year.slice(-2);
        const lastUser = await User_1.default.find({ admissionNumber: { $regex: `^501/${yy}` } })
            .sort({ admissionNumber: -1 })
            .limit(1);
        let nextNumber = 1;
        if (lastUser.length > 0 && lastUser[0] && lastUser[0].admissionNumber) {
            const match = lastUser[0].admissionNumber.match(/^501\/(\d{2})(?:-(\d+))?$/);
            if (match) {
                nextNumber = match[2] ? parseInt(match[2], 10) + 1 : 2;
            }
        }
        user.admissionNumber = nextNumber === 1 ? `501/${yy}` : `501/${yy}-${nextNumber}`;
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
            status: user.status,
            admissionNumber: user.admissionNumber,
            admissionYear: user.admissionYear
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
            .select('name firstName lastName email admissionYear company jobTitle location profileImage')
            .sort({ lastName: 1, firstName: 1 });
        const formattedAlumni = alumni.map(user => {
            return {
                _id: user._id,
                firstName: user.firstName || user.name.split(' ')[0],
                lastName: user.lastName || user.name.split(' ').slice(1).join(' ') || '',
                email: user.email,
                profilePicture: user.profileImage,
                location: user.location || `${user.city || ''} ${user.country || ''}`.trim(),
                education: {
                    admissionYear: user.admissionYear
                },
                professionalInfo: {
                    company: user.company,
                    title: user.jobTitle
                }
            };
        });
        res.status(200).json({
            success: true,
            data: formattedAlumni,
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
exports.getUserSuggestions = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user?.id;
    if (!userId) {
        res.status(401).json({
            success: false,
            message: 'User not authenticated'
        });
        return;
    }
    const limit = parseInt(req.query.limit) || 5;
    const currentUser = await User_1.default.findById(userId);
    if (!currentUser) {
        res.status(404).json({
            success: false,
            message: 'User not found'
        });
        return;
    }
    const suggestionPipeline = [
        {
            $match: {
                _id: { $ne: userId },
                status: 'active'
            }
        },
        {
            $addFields: {
                similarityScore: {
                    $sum: [
                        {
                            $cond: [
                                { $eq: ['$admissionYear', currentUser.admissionYear] },
                                3,
                                0
                            ]
                        },
                        {
                            $cond: [
                                {
                                    $and: [
                                        { $ne: ['$company', null] },
                                        { $ne: ['$company', ''] },
                                        { $eq: ['$company', currentUser.company] }
                                    ]
                                },
                                2,
                                0
                            ]
                        },
                        {
                            $cond: [
                                {
                                    $and: [
                                        { $ne: ['$city', null] },
                                        { $ne: ['$city', ''] },
                                        { $eq: ['$city', currentUser.city] }
                                    ]
                                },
                                1,
                                0
                            ]
                        },
                        {
                            $min: [
                                3,
                                {
                                    $multiply: [
                                        0.5,
                                        {
                                            $size: {
                                                $ifNull: [
                                                    {
                                                        $setIntersection: [
                                                            { $ifNull: ['$skills', []] },
                                                            { $ifNull: [currentUser.skills || [], []] }
                                                        ]
                                                    },
                                                    []
                                                ]
                                            }
                                        }
                                    ]
                                }
                            ]
                        },
                        {
                            $min: [
                                2,
                                {
                                    $multiply: [
                                        0.3,
                                        {
                                            $size: {
                                                $ifNull: [
                                                    {
                                                        $setIntersection: [
                                                            { $ifNull: ['$interests', []] },
                                                            { $ifNull: [currentUser.interests || [], []] }
                                                        ]
                                                    },
                                                    []
                                                ]
                                            }
                                        }
                                    ]
                                }
                            ]
                        },
                        {
                            $cond: [
                                {
                                    $and: [
                                        { $eq: ['$isAvailableAsMentor', true] },
                                        { $ne: [currentUser.isAvailableAsMentor, true] }
                                    ]
                                },
                                1,
                                0
                            ]
                        }
                    ]
                }
            }
        },
        {
            $sort: {
                similarityScore: -1,
                lastLogin: -1,
                createdAt: -1
            }
        },
        { $limit: limit },
        {
            $project: {
                name: 1,
                profileImage: 1,
                role: 1,
                company: 1,
                jobTitle: 1,
                city: 1,
                admissionYear: 1,
                headline: 1,
                skills: 1,
                interests: 1,
                isAvailableAsMentor: 1,
                similarityScore: 1
            }
        }
    ];
    const suggestions = await User_1.default.aggregate(suggestionPipeline);
    res.json({
        success: true,
        data: suggestions
    });
});
exports.updateUserSkills = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { userId } = req.params;
    const { skills } = req.body;
    if (req.user?._id.toString() !== userId &&
        req.user?.role !== User_1.UserRole.ADMIN &&
        req.user?.role !== User_1.UserRole.SUPER_ADMIN) {
        res.status(403).json({ success: false, message: 'Not authorized to update this profile' });
        return;
    }
    if (!Array.isArray(skills)) {
        res.status(400).json({ success: false, message: 'Skills must be an array' });
        return;
    }
    const validSkills = skills
        .filter(skill => typeof skill === 'string' && skill.trim().length > 0)
        .map(skill => skill.trim())
        .slice(0, 20);
    const user = await User_1.default.findByIdAndUpdate(userId, { $set: { skills: validSkills } }, { new: true, runValidators: true }).select('-password -refreshTokens');
    if (!user) {
        res.status(404).json({ success: false, message: 'User not found' });
        return;
    }
    res.status(200).json({
        success: true,
        message: 'Skills updated successfully',
        skills: user.skills
    });
});
exports.updateUserInterests = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { userId } = req.params;
    const { interests } = req.body;
    if (req.user?._id.toString() !== userId &&
        req.user?.role !== User_1.UserRole.ADMIN &&
        req.user?.role !== User_1.UserRole.SUPER_ADMIN) {
        res.status(403).json({ success: false, message: 'Not authorized to update this profile' });
        return;
    }
    if (!Array.isArray(interests)) {
        res.status(400).json({ success: false, message: 'Interests must be an array' });
        return;
    }
    const validInterests = interests
        .filter(interest => typeof interest === 'string' && interest.trim().length > 0)
        .map(interest => interest.trim())
        .slice(0, 15);
    const user = await User_1.default.findByIdAndUpdate(userId, { $set: { interests: validInterests } }, { new: true, runValidators: true }).select('-password -refreshTokens');
    if (!user) {
        res.status(404).json({ success: false, message: 'User not found' });
        return;
    }
    res.status(200).json({
        success: true,
        message: 'Interests updated successfully',
        interests: user.interests
    });
});
exports.updatePrivacySettings = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { userId } = req.params;
    const privacyUpdates = req.body;
    if (req.user?._id.toString() !== userId) {
        res.status(403).json({ success: false, message: 'Not authorized to update these settings' });
        return;
    }
    const allowedFields = [
        'profileVisibility', 'showEmail', 'showPhone', 'showBio', 'showSkills',
        'showInterests', 'showConnections', 'allowMessaging', 'allowConnection', 'allowProfileSearch'
    ];
    const validUpdates = {};
    for (const [key, value] of Object.entries(privacyUpdates)) {
        if (allowedFields.includes(key)) {
            if (key === 'profileVisibility') {
                if (['public', 'alumni', 'connections'].includes(value)) {
                    validUpdates[`privacySettings.${key}`] = value;
                }
            }
            else if (typeof value === 'boolean') {
                validUpdates[`privacySettings.${key}`] = value;
            }
        }
    }
    const user = await User_1.default.findByIdAndUpdate(userId, { $set: validUpdates }, { new: true, runValidators: true }).select('-password -refreshTokens');
    if (!user) {
        res.status(404).json({ success: false, message: 'User not found' });
        return;
    }
    res.status(200).json({
        success: true,
        message: 'Privacy settings updated successfully',
        privacySettings: user.privacySettings
    });
});
//# sourceMappingURL=userController.js.map
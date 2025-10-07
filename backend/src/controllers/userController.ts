import { Request, Response } from 'express';
import User, { IUser, UserRole, UserStatus } from '../models/User';
import { asyncHandler } from '../middleware/errorHandler';

interface AuthRequest extends Request {
  user?: IUser;
}

// Get all users (Admin/Super Admin only)
export const getAllUsers = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const status = req.query.status as UserStatus;
  const role = req.query.role as UserRole;
  const search = req.query.search as string;

  const query: any = {};

  // Filter by status
  if (status) {
    query.status = status;
  }

  // Filter by role
  if (role) {
    query.role = role;
  }

  // Search functionality
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { admissionNumber: { $regex: search, $options: 'i' } }
    ];
  }

  const users = await User.find(query)
    .select('-password -refreshTokens -passwordResetToken -emailVerificationToken')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const total = await User.countDocuments(query);

  // Transform users to include id field
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

// Get pending users (Admin/Super Admin only)
export const getPendingUsers = asyncHandler(async (_req: AuthRequest, res: Response): Promise<void> => {
  const users = await User.find({ status: UserStatus.PENDING })
    .select('-password -refreshTokens -passwordResetToken -emailVerificationToken')
    .sort({ createdAt: -1 });

  // Transform users to include id field
  const transformedUsers = users.map(user => ({
    ...user.toObject(),
    id: user._id.toString()
  }));

  res.status(200).json({
    success: true,
    users: transformedUsers
  });
});

// Approve user (Admin/Super Admin only)
export const approveUser = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const { userId } = req.params;

  const user = await User.findById(userId);
  if (!user) {
    res.status(404).json({ message: 'User not found' });
    return;
  }

  if (user.status !== UserStatus.PENDING) {
    res.status(400).json({ message: 'User is not pending approval' });
    return;
  }

  // If user is manual verification and has MANUAL_VERIFICATION as admissionNumber, assign a unique admission number
  if (user.needsManualVerification && user.admissionNumber === 'MANUAL_VERIFICATION') {
    const year = user.admissionYear;
    const yy = year.slice(-2);
    // Find the highest number for this year
    const lastUser = await User.find({ admissionNumber: { $regex: `^501/${yy}` } })
      .sort({ admissionNumber: -1 })
      .limit(1);
    let nextNumber = 1;
    if (lastUser.length > 0 && lastUser[0] && lastUser[0].admissionNumber) {
      const match = lastUser[0].admissionNumber!.match(/^501\/(\d{2})(?:-(\d+))?$/);
      if (match) {
        nextNumber = match[2] ? parseInt(match[2], 10) + 1 : 2;
      }
    }
    user.admissionNumber = nextNumber === 1 ? `501/${yy}` : `501/${yy}-${nextNumber}`;
  }

  user.status = UserStatus.ACTIVE;
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

// Reject user (Admin/Super Admin only)
export const rejectUser = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const { userId } = req.params;
  const { reason: _reason } = req.body;

  const user = await User.findById(userId);
  if (!user) {
    res.status(404).json({ message: 'User not found' });
    return;
  }

  if (user.status !== UserStatus.PENDING) {
    res.status(400).json({ message: 'User is not pending approval' });
    return;
  }

  // Instead of deleting, mark as deleted
  user.status = UserStatus.DELETED;
  await user.save();

  res.status(200).json({
    success: true,
    message: 'User rejected successfully'
  });
});

// Suspend user (Admin/Super Admin only)
export const suspendUser = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const { userId } = req.params;
  const { reason: _reason } = req.body;

  const user = await User.findById(userId);
  if (!user) {
    res.status(404).json({ message: 'User not found' });
    return;
  }

  // Cannot suspend super admins
  if (user.role === UserRole.SUPER_ADMIN) {
    res.status(403).json({ message: 'Cannot suspend super admin' });
    return;
  }

  // Only super admins can suspend admins
  if (user.role === UserRole.ADMIN && req.user?.role !== UserRole.SUPER_ADMIN) {
    res.status(403).json({ message: 'Only super admins can suspend admins' });
    return;
  }

  user.status = UserStatus.SUSPENDED;
  user.refreshTokens = []; // Invalidate all sessions
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

// Reactivate user (Admin/Super Admin only)
export const reactivateUser = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const { userId } = req.params;

  const user = await User.findById(userId);
  if (!user) {
    res.status(404).json({ message: 'User not found' });
    return;
  }

  if (user.status !== UserStatus.SUSPENDED) {
    res.status(400).json({ message: 'User is not suspended' });
    return;
  }

  user.status = UserStatus.ACTIVE;
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

// Promote user to admin (Super Admin only)
export const promoteToAdmin = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const { userId } = req.params;

  const user = await User.findById(userId);
  if (!user) {
    res.status(404).json({ message: 'User not found' });
    return;
  }

  if (user.role === UserRole.ADMIN || user.role === UserRole.SUPER_ADMIN) {
    res.status(400).json({ message: 'User is already an admin or super admin' });
    return;
  }

  user.role = UserRole.ADMIN;
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

// Demote admin to user (Super Admin only)
export const demoteAdmin = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const { userId } = req.params;

  const user = await User.findById(userId);
  if (!user) {
    res.status(404).json({ message: 'User not found' });
    return;
  }

  if (user.role === UserRole.SUPER_ADMIN) {
    res.status(403).json({ message: 'Cannot demote super admin' });
    return;
  }

  if (user.role !== UserRole.ADMIN) {
    res.status(400).json({ message: 'User is not an admin' });
    return;
  }

  user.role = UserRole.USER;
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

// Delete user permanently (Super Admin only)
export const deleteUser = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const { userId } = req.params;

  const user = await User.findById(userId);
  if (!user) {
    res.status(404).json({ message: 'User not found' });
    return;
  }

  if (user.role === UserRole.SUPER_ADMIN) {
    res.status(403).json({ message: 'Cannot delete super admin' });
    return;
  }

  await User.findByIdAndDelete(userId);

  res.status(200).json({
    success: true,
    message: 'User deleted permanently'
  });
});

// @desc    Get alumni directory
// @route   GET /api/users/directory
// @access  Private
export const getAlumniDirectory = async (_req: Request, res: Response) => {
  try {
    const alumni = await User.find({ status: 'active' })
      .select('name firstName lastName email admissionYear company jobTitle location profileImage')
      .sort({ lastName: 1, firstName: 1 });

    // Map the data to match the frontend expectations
    const formattedAlumni = alumni.map(user => {
      return {
        _id: user._id,
        firstName: user.firstName || user.name.split(' ')[0],
        lastName: user.lastName || user.name.split(' ').slice(1).join(' ') || '',
        email: user.email,
        profilePicture: user.profileImage,
        location: user.location || `${user.city || ''} ${user.country || ''}`.trim(),
        education: {
          admissionYear: user.admissionYear // changed from graduationYear
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
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

// Get user stats (Admin/Super Admin only)
export const getUserStats = asyncHandler(async (_req: AuthRequest, res: Response): Promise<void> => {
  const totalUsers = await User.countDocuments();
  const activeUsers = await User.countDocuments({ status: UserStatus.ACTIVE });
  const pendingUsers = await User.countDocuments({ status: UserStatus.PENDING });
  const suspendedUsers = await User.countDocuments({ status: UserStatus.SUSPENDED });
  const adminUsers = await User.countDocuments({ role: UserRole.ADMIN });
  const superAdminUsers = await User.countDocuments({ role: UserRole.SUPER_ADMIN });

  // Get registration trends (last 30 days)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const recentRegistrations = await User.countDocuments({
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
      totalJobs: 0, // Placeholder - will be implemented when Job model is complete
      totalGroups: 0, // Placeholder - will be implemented when Group model is complete
      totalPosts: 0 // Placeholder - will be implemented when Post model is complete
    }
  });
});

// Update user profile (Self or Admin/Super Admin)
export const updateUserProfile = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const { userId } = req.params;
  const updates = req.body;

  // Users can only update their own profile unless they're admin
  if (req.user?._id.toString() !== userId && 
      req.user?.role !== UserRole.ADMIN && 
      req.user?.role !== UserRole.SUPER_ADMIN) {
    res.status(403).json({ message: 'Not authorized to update this profile' });
    return;
  }

  // Remove sensitive fields from updates
  delete updates.password;
  delete updates.role;
  delete updates.status;
  delete updates.refreshTokens;
  delete updates.passwordResetToken;
  delete updates.emailVerificationToken;

  const user = await User.findByIdAndUpdate(
    userId,
    { $set: updates },
    { new: true, runValidators: true }
  ).select('-password -refreshTokens');

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

// Get user by ID (Self or Admin/Super Admin)
export const getUserById = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const { userId } = req.params;

  const user = await User.findById(userId)
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

// Get user suggestions (people you may know)
export const getUserSuggestions = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({
      success: false,
      message: 'User not authenticated'
    });
    return;
  }

  const limit = parseInt(req.query.limit as string) || 5;
  
  // Get current user to access their details for matching
  const currentUser = await User.findById(userId);
  if (!currentUser) {
    res.status(404).json({
      success: false,
      message: 'User not found'
    });
    return;
  }

  // Build suggestion criteria - prioritize users with similar attributes
  const suggestionPipeline = [
    // Exclude current user and users they already follow/are connected with
    {
      $match: {
        _id: { $ne: userId },
        status: 'active'
      }
    },
    // Add scoring based on similarity
    {
      $addFields: {
        similarityScore: {
          $sum: [
            // Same admission year gets 3 points
            {
              $cond: [
                { $eq: ['$admissionYear', currentUser.admissionYear] },
                3,
                0
              ]
            },
            // Same company gets 2 points
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
            // Same city gets 1 point
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
            // Common skills - 0.5 points per shared skill (up to 3 points max)
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
            // Common interests - 0.3 points per shared interest (up to 2 points max)
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
            // Mentor availability match gets 1 point if current user is looking for mentorship
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
    // Sort by similarity score descending, then by recent activity
    {
      $sort: {
        similarityScore: -1 as const,
        lastLogin: -1 as const,
        createdAt: -1 as const
      }
    },
    // Limit results
    { $limit: limit },
    // Project only needed fields
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

  const suggestions = await User.aggregate(suggestionPipeline);

  res.json({
    success: true,
    data: suggestions
  });
});

// Update user skills
export const updateUserSkills = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const { userId } = req.params;
  const { skills } = req.body;

  // Users can only update their own profile unless they're admin
  if (req.user?._id.toString() !== userId && 
      req.user?.role !== UserRole.ADMIN && 
      req.user?.role !== UserRole.SUPER_ADMIN) {
    res.status(403).json({ success: false, message: 'Not authorized to update this profile' });
    return;
  }

  // Validate skills array
  if (!Array.isArray(skills)) {
    res.status(400).json({ success: false, message: 'Skills must be an array' });
    return;
  }

  // Limit skills and validate each skill
  const validSkills = skills
    .filter(skill => typeof skill === 'string' && skill.trim().length > 0)
    .map(skill => skill.trim())
    .slice(0, 20); // Limit to 20 skills

  const user = await User.findByIdAndUpdate(
    userId,
    { $set: { skills: validSkills } },
    { new: true, runValidators: true }
  ).select('-password -refreshTokens');

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

// Update user interests
export const updateUserInterests = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const { userId } = req.params;
  const { interests } = req.body;

  // Users can only update their own profile unless they're admin
  if (req.user?._id.toString() !== userId && 
      req.user?.role !== UserRole.ADMIN && 
      req.user?.role !== UserRole.SUPER_ADMIN) {
    res.status(403).json({ success: false, message: 'Not authorized to update this profile' });
    return;
  }

  // Validate interests array
  if (!Array.isArray(interests)) {
    res.status(400).json({ success: false, message: 'Interests must be an array' });
    return;
  }

  // Limit interests and validate each interest
  const validInterests = interests
    .filter(interest => typeof interest === 'string' && interest.trim().length > 0)
    .map(interest => interest.trim())
    .slice(0, 15); // Limit to 15 interests

  const user = await User.findByIdAndUpdate(
    userId,
    { $set: { interests: validInterests } },
    { new: true, runValidators: true }
  ).select('-password -refreshTokens');

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

// Update privacy settings
export const updatePrivacySettings = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const { userId } = req.params;
  const privacyUpdates = req.body;

  // Users can only update their own privacy settings
  if (req.user?._id.toString() !== userId) {
    res.status(403).json({ success: false, message: 'Not authorized to update these settings' });
    return;
  }

  // Validate privacy settings
  const allowedFields = [
    'profileVisibility', 'showEmail', 'showPhone', 'showBio', 'showSkills', 
    'showInterests', 'showConnections', 'allowMessaging', 'allowConnection', 'allowProfileSearch'
  ];

  const validUpdates: Record<string, string | boolean> = {};
  for (const [key, value] of Object.entries(privacyUpdates)) {
    if (allowedFields.includes(key)) {
      if (key === 'profileVisibility') {
        if (['public', 'alumni', 'connections'].includes(value as string)) {
          validUpdates[`privacySettings.${key}`] = value as string;
        }
      } else if (typeof value === 'boolean') {
        validUpdates[`privacySettings.${key}`] = value;
      }
    }
  }

  const user = await User.findByIdAndUpdate(
    userId,
    { $set: validUpdates },
    { new: true, runValidators: true }
  ).select('-password -refreshTokens');

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

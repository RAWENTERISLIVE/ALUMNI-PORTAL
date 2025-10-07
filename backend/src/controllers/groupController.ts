import { Response } from 'express';
import Group, { GroupPrivacy } from '../models/Group';
import GroupMessage from '../models/GroupMessage';
import { asyncHandler } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';
import { Types } from 'mongoose';

interface PopulatedUser {
  _id: Types.ObjectId;
  name: string;
  email: string;
  profileImage?: string;
  firstName?: string;
  lastName?: string;
}

interface MongoQuery {
  $or?: Record<string, unknown>[];
  $and?: Record<string, unknown>[];
  privacy?: string;
  members?: Types.ObjectId;
  creator?: Types.ObjectId;
  name?: { $regex: string; $options: string };
  description?: { $regex: string; $options: string };
}

// Type guard to check if an object is a populated user
const isPopulatedUser = (obj: unknown): obj is PopulatedUser => {
  return typeof obj === 'object' && obj !== null && '_id' in obj && 'name' in obj && 'email' in obj;
};

// @desc    Create a new group
// @route   POST /api/groups
// @access  Private
export const createGroup = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { name, description, privacy, category } = req.body;
  const creator = req.user?.id;

  const newGroup = new Group({
    name,
    description,
    creator,
    members: [creator], // Creator is the first member
    privacy: privacy ?? GroupPrivacy.PUBLIC,
    category: category ?? 'professional',
    memberCount: 1, // Start with creator as member
    lastActivity: new Date()
  });

  const group = await newGroup.save();

  res.status(201).json({ success: true, data: group });
});

// @desc    Get all groups with filtering
// @route   GET /api/groups
// @access  Private
export const getGroups = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { page = 1, limit = 10, search, privacy } = req.query;
  const userId = req.user?.id;

  const query: MongoQuery = {
    $or: [
      { privacy: GroupPrivacy.PUBLIC },
      { members: userId },
      { creator: userId } // Creator can always see their groups
    ],
  };

  if (search) {
    query.$and = [
      query.$or ? { $or: query.$or } : {},
      {
        $or: [
          { name: { $regex: search as string, $options: 'i' } },
          { description: { $regex: search as string, $options: 'i' } }
        ]
      }
    ];
    delete query.$or;
  }

  if (privacy && privacy !== 'all') {
    query.privacy = privacy as string;
  }

  const pageNum = parseInt(page as string, 10);
  const limitNum = parseInt(limit as string, 10);
  const skip = (pageNum - 1) * limitNum;

  const groups = await Group.find(query)
    .populate('creator', 'name email profileImage')
    .populate('members', 'name email profileImage')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limitNum);

  const total = await Group.countDocuments(query);

  // Format groups to have consistent id field
  const formattedGroups = groups.map(group => {
    const groupObj = group.toObject();
    return {
      ...groupObj,
      id: (groupObj._id as Types.ObjectId).toString(),
      creator: groupObj.creator && {
        ...groupObj.creator,
        id: groupObj.creator._id ? groupObj.creator._id.toString() : undefined
      },
      members: groupObj.members ? groupObj.members.map((member: unknown) => {
        if (isPopulatedUser(member)) {
          return {
            ...member,
            id: member._id ? member._id.toString() : undefined
          };
        }
        // If it's just an ObjectId
        return { id: (member as Types.ObjectId).toString() };
      }) : []
    };
  });

  res.json({ 
    success: true, 
    data: formattedGroups,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      pages: Math.ceil(total / limitNum)
    }
  });
});

// @desc    Get a single group
// @route   GET /api/groups/:groupId
// @access  Private
export const getGroup = asyncHandler(async (req: AuthRequest, res: Response) => {
  const group = await Group.findById(req.params.groupId)
    .populate('creator', 'name email')
    .populate('members', 'name email');

  if (!group) {
    res.status(404).json({ success: false, message: 'Group not found' });
    return;
  }

  // Check if user can view the group
  if (group.privacy === GroupPrivacy.PRIVATE && !group.members.includes(req.user?.id)) {
    res.status(403).json({ success: false, message: 'You do not have permission to view this group' });
    return;
  }

  res.json({ success: true, data: group });
});

// @desc    Join a group
// @route   POST /api/groups/:groupId/join
// @access  Private
export const joinGroup = asyncHandler(async (req: AuthRequest, res: Response) => {
  const groupId = req.params.groupId;
  const userId = req.user?.id;

  const group = await Group.findById(groupId);

  if (!group) {
    res.status(404).json({ success: false, message: 'Group not found' });
    return;
  }

  if (group.privacy === GroupPrivacy.PRIVATE) {
    res.status(403).json({ success: false, message: 'This is a private group. You need an invitation to join.' });
    return;
  }

  if (group.members.includes(userId)) {
    res.status(400).json({ success: false, message: 'You are already a member of this group' });
    return;
  }

  group.members.push(userId);
  await group.save();

  res.json({ success: true, message: 'Successfully joined the group', data: group });
});

// @desc    Leave a group
// @route   POST /api/groups/:groupId/leave
// @access  Private
export const leaveGroup = asyncHandler(async (req: AuthRequest, res: Response) => {
  const groupId = req.params.groupId;
  const userId = req.user?.id;

  const group = await Group.findById(groupId);

  if (!group) {
    res.status(404).json({ success: false, message: 'Group not found' });
    return;
  }

  if (group.creator.toString() === userId?.toString()) {
    res.status(400).json({ success: false, message: 'Creator cannot leave the group. You can delete the group instead.' });
    return;
  }

  if (!group.members.includes(userId)) {
    res.status(400).json({ success: false, message: 'You are not a member of this group' });
    return;
  }

  group.members = group.members.filter((memberId: Types.ObjectId) => memberId.toString() !== userId?.toString());
  await group.save();

  res.json({ success: true, message: 'Successfully left the group', data: group });
});

// @desc    Get messages from a group
// @route   GET /api/groups/:groupId/messages
// @access  Private (Members only)
export const getGroupMessages = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { groupId } = req.params;
  const { page = 1, limit = 50 } = req.query;
  const userId = req.user?.id;

  const group = await Group.findById(groupId);

  if (!group) {
    res.status(404).json({ success: false, message: 'Group not found' });
    return;
  }

  // Check if user is a member or creator
  const isMember = group.members.some((member: Types.ObjectId) => member.toString() === userId?.toString());
  const isCreator = group.creator.toString() === userId?.toString();

  if (!isMember && !isCreator) {
    res.status(403).json({ success: false, message: 'You must be a member to view messages' });
    return;
  }

  const pageNum = parseInt(page as string, 10);
  const limitNum = parseInt(limit as string, 10);
  const skip = (pageNum - 1) * limitNum;

  const messages = await GroupMessage.find({ group: groupId })
    .populate('author', 'name email firstName lastName profileImage')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limitNum);

  // Format messages with consistent id fields
  const formattedMessages = messages.map(message => {
    const messageObj = message.toObject();
    return {
      ...messageObj,
      id: (messageObj._id as Types.ObjectId).toString(),
      author: messageObj.author && isPopulatedUser(messageObj.author) ? {
        ...messageObj.author,
        id: messageObj.author._id ? messageObj.author._id.toString() : undefined
      } : null
    };
  });

  const totalMessages = await GroupMessage.countDocuments({ group: groupId });

  res.json({ 
    success: true, 
    data: formattedMessages.reverse(), // Return in chronological order
    pagination: {
      page: pageNum,
      limit: limitNum,
      total: totalMessages,
      pages: Math.ceil(totalMessages / limitNum)
    }
  });
});

// @desc    Post a message to a group
// @route   POST /api/groups/:groupId/messages
// @access  Private
export const postGroupMessage = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { groupId } = req.params;
  const { content, messageType = 'text' } = req.body;
  const author = req.user?.id;

  const group = await Group.findById(groupId);

  if (!group) {
    res.status(404).json({ success: false, message: 'Group not found' });
    return;
  }

  if (!group.members.includes(author)) {
    res.status(403).json({ success: false, message: 'You must be a member to post messages' });
    return;
  }

  const message = new GroupMessage({
    group: groupId,
    author,
    content,
    messageType,
  });

  await message.save();

  const populatedMessage = await GroupMessage.findById(message._id).populate('author', 'name email firstName lastName profileImage');

  // Format the message with consistent id fields
  const messageObj = populatedMessage?.toObject();
  const formattedMessage = messageObj ? {
    ...messageObj,
    id: messageObj._id ? messageObj._id.toString() : undefined,
    author: messageObj.author && isPopulatedUser(messageObj.author) ? {
      ...messageObj.author,
      id: messageObj.author._id ? messageObj.author._id.toString() : undefined
    } : null
  } : null;

  res.status(201).json({ success: true, data: formattedMessage });
});

// @desc    Get groups for current user
// @route   GET /api/groups/user
// @access  Private
export const getUserGroups = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;

  const groups = await Group.find({
    members: userId
  })
    .populate('creator', 'name email profileImage')
    .populate('members', 'name email profileImage')
    .sort({ lastActivity: -1 })
    .limit(10); // Limit for dashboard display

  // Format groups to have consistent id field
  const formattedGroups = groups.map(group => {
    const groupObj = group.toObject();
    return {
      ...groupObj,
      id: (groupObj._id as Types.ObjectId).toString(),
      creator: groupObj.creator && {
        ...groupObj.creator,
        id: groupObj.creator._id ? (groupObj.creator._id as Types.ObjectId).toString() : undefined
      },
      members: groupObj.members ? groupObj.members.map((member: unknown) => {
        if (isPopulatedUser(member)) {
          return {
            ...member,
            id: member._id ? member._id.toString() : undefined
          };
        }
        // If it's just an ObjectId
        return { id: (member as Types.ObjectId).toString() };
      }) : []
    };
  });

  res.json({ 
    success: true, 
    data: formattedGroups
  });
});

// @desc    Get pending join requests for a group (Admin only)
// @route   GET /api/groups/:id/requests
// @access  Private
export const getGroupRequests = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { groupId } = req.params;
  const userId = req.user?.id;

  const group = await Group.findById(groupId)
    .populate('pendingRequests', 'name email profileImage firstName lastName');

  if (!group) {
    return res.status(404).json({ success: false, message: 'Group not found' });
  }

  // Check if user is admin
  if (!group.isAdmin(new Types.ObjectId(userId))) {
    return res.status(403).json({ success: false, message: 'Not authorized to view requests' });
  }

  res.json({
    success: true,
    data: group.pendingRequests
  });
});

// @desc    Approve join request (Admin only)
// @route   POST /api/groups/:id/approve/:userId
// @access  Private
export const approveJoinRequest = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { groupId, userId: targetUserId } = req.params;
  const userId = req.user?.id;

  const group = await Group.findById(groupId);

  if (!group) {
    return res.status(404).json({ success: false, message: 'Group not found' });
  }

  // Check if user is admin
  if (!group.isAdmin(new Types.ObjectId(userId))) {
    return res.status(403).json({ success: false, message: 'Not authorized to approve requests' });
  }

  await group.addMember(new Types.ObjectId(targetUserId));

  res.json({
    success: true,
    message: 'Join request approved'
  });
});

// @desc    Reject join request (Admin only)
// @route   POST /api/groups/:id/reject/:userId
// @access  Private
export const rejectJoinRequest = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { groupId, userId: targetUserId } = req.params;
  const userId = req.user?.id;

  const group = await Group.findById(groupId);

  if (!group) {
    return res.status(404).json({ success: false, message: 'Group not found' });
  }

  // Check if user is admin
  if (!group.isAdmin(new Types.ObjectId(userId))) {
    return res.status(403).json({ success: false, message: 'Not authorized to reject requests' });
  }

  group.pendingRequests = group.pendingRequests.filter(
    (id: Types.ObjectId) => !id.equals(new Types.ObjectId(targetUserId))
  );
  await group.save();

  res.json({
    success: true,
    message: 'Join request rejected'
  });
});

// @desc    Make user admin (Admin only)
// @route   POST /api/groups/:id/make-admin/:userId
// @access  Private
export const makeAdmin = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { groupId, userId: targetUserId } = req.params;
  const userId = req.user?.id;

  const group = await Group.findById(groupId);

  if (!group) {
    return res.status(404).json({ success: false, message: 'Group not found' });
  }

  // Check if user is admin or creator
  if (!group.isAdmin(new Types.ObjectId(userId))) {
    return res.status(403).json({ success: false, message: 'Not authorized to make admins' });
  }

  try {
    await group.addAdmin(new Types.ObjectId(targetUserId));
    res.json({
      success: true,
      message: 'User promoted to admin'
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(400).json({ success: false, message: errorMessage });
  }
});

// @desc    Remove member from group (Admin only)
// @route   DELETE /api/groups/:id/members/:userId
// @access  Private
export const removeMember = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { groupId, userId: targetUserId } = req.params;
  const userId = req.user?.id;

  const group = await Group.findById(groupId);

  if (!group) {
    return res.status(404).json({ success: false, message: 'Group not found' });
  }

  // Check if user is admin
  if (!group.isAdmin(new Types.ObjectId(userId))) {
    return res.status(403).json({ success: false, message: 'Not authorized to remove members' });
  }

  // Cannot remove creator
  if (group.creator.equals(new Types.ObjectId(targetUserId))) {
    return res.status(400).json({ success: false, message: 'Cannot remove group creator' });
  }

  await group.removeMember(new Types.ObjectId(targetUserId));

  res.json({
    success: true,
    message: 'Member removed from group'
  });
});

// @desc    Update group details (Admin only)
// @route   PATCH /api/groups/:id
// @access  Private
export const updateGroup = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { groupId } = req.params;
  const userId = req.user?.id;
  const { name, description, privacy, category, rules, tags } = req.body;

  const group = await Group.findById(groupId);

  if (!group) {
    return res.status(404).json({ success: false, message: 'Group not found' });
  }

  // Check if user is admin
  if (!group.isAdmin(new Types.ObjectId(userId))) {
    return res.status(403).json({ success: false, message: 'Not authorized to update group' });
  }

  // Update fields
  if (name) group.name = name;
  if (description) group.description = description;
  if (privacy) group.privacy = privacy;
  if (category) group.category = category;
  if (rules) group.rules = rules;
  if (tags) group.tags = tags;

  await group.save();

  res.json({
    success: true,
    data: group,
    message: 'Group updated successfully'
  });
});

// @desc    Delete group (Creator only)
// @route   DELETE /api/groups/:id
// @access  Private
export const deleteGroup = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { groupId } = req.params;
  const userId = req.user?.id;

  const group = await Group.findById(groupId);

  if (!group) {
    return res.status(404).json({ success: false, message: 'Group not found' });
  }

  // Only creator can delete group
  if (!group.creator.equals(new Types.ObjectId(userId))) {
    return res.status(403).json({ success: false, message: 'Only group creator can delete group' });
  }

  // Delete all group messages
  await GroupMessage.deleteMany({ group: groupId });

  // Delete the group
  await Group.findByIdAndDelete(groupId);

  res.json({
    success: true,
    message: 'Group deleted successfully'
  });
});

// @desc    Get group statistics for admin
// @route   GET /api/groups/:id/stats
// @access  Private
export const getGroupStats = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { groupId } = req.params;
  const userId = req.user?.id;

  const group = await Group.findById(groupId);

  if (!group) {
    return res.status(404).json({ success: false, message: 'Group not found' });
  }

  // Check if user is admin
  if (!group.isAdmin(new Types.ObjectId(userId))) {
    return res.status(403).json({ success: false, message: 'Not authorized to view stats' });
  }

  const messageCount = await GroupMessage.countDocuments({ group: groupId });
  const recentMessages = await GroupMessage.find({ group: groupId })
    .sort({ createdAt: -1 })
    .limit(1);

  const stats = {
    memberCount: group.members.length,
    adminCount: group.admins.length,
    pendingRequestsCount: group.pendingRequests.length,
    messageCount,
    lastActivity: recentMessages[0]?.createdAt || group.lastActivity,
    createdAt: group.createdAt
  };

  res.json({
    success: true,
    data: stats
  });
});

import { Request, Response } from 'express';
import Group, { GroupPrivacy } from '../models/Group';
import GroupMessage from '../models/GroupMessage';
import { asyncHandler } from '../middleware/errorHandler';

// @desc    Create a new group
// @route   POST /api/groups
// @access  Private
export const createGroup = asyncHandler(async (req: Request, res: Response) => {
  const { name, description, privacy } = req.body;
  const creator = (req as any).user.id;

  const newGroup = new Group({
    name,
    description,
    creator,
    members: [creator], // Creator is the first member
    privacy: privacy || GroupPrivacy.PUBLIC,
  });

  const group = await newGroup.save();

  res.status(201).json({ success: true, data: group });
});

// @desc    Get all groups with filtering
// @route   GET /api/groups
// @access  Private
export const getGroups = asyncHandler(async (req: Request, res: Response) => {
  const { page = 1, limit = 10, search, privacy } = req.query;
  const userId = (req as any).user.id;

  const query: any = {
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
          { name: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ]
      }
    ];
    delete query.$or;
  }

  if (privacy && privacy !== 'all') {
    query.privacy = privacy;
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
      id: (groupObj._id as any).toString(),
      creator: groupObj.creator && {
        ...groupObj.creator,
        id: groupObj.creator._id ? (groupObj.creator._id as any).toString() : undefined
      },
      members: groupObj.members ? groupObj.members.map((member: any) => ({
        ...member,
        id: member._id ? member._id.toString() : undefined
      })) : []
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
export const getGroup = asyncHandler(async (req: Request, res: Response) => {
  const group = await Group.findById(req.params.groupId)
    .populate('creator', 'name email')
    .populate('members', 'name email');

  if (!group) {
    res.status(404).json({ success: false, message: 'Group not found' });
    return;
  }

  // Check if user can view the group
  if (group.privacy === GroupPrivacy.PRIVATE && !group.members.includes((req as any).user.id)) {
    res.status(403).json({ success: false, message: 'You do not have permission to view this group' });
    return;
  }

  res.json({ success: true, data: group });
});

// @desc    Join a group
// @route   POST /api/groups/:groupId/join
// @access  Private
export const joinGroup = asyncHandler(async (req: Request, res: Response) => {
  const groupId = req.params.groupId;
  const userId = (req as any).user.id;

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
export const leaveGroup = asyncHandler(async (req: Request, res: Response) => {
  const groupId = req.params.groupId;
  const userId = (req as any).user.id;

  const group = await Group.findById(groupId);

  if (!group) {
    res.status(404).json({ success: false, message: 'Group not found' });
    return;
  }

  if (group.creator.toString() === userId.toString()) {
    res.status(400).json({ success: false, message: 'Creator cannot leave the group. You can delete the group instead.' });
    return;
  }

  if (!group.members.includes(userId)) {
    res.status(400).json({ success: false, message: 'You are not a member of this group' });
    return;
  }

  group.members = group.members.filter((memberId: any) => memberId.toString() !== userId.toString());
  await group.save();

  res.json({ success: true, message: 'Successfully left the group', data: group });
});

// @desc    Get messages from a group
// @route   GET /api/groups/:groupId/messages
// @access  Private (Members only)
export const getGroupMessages = asyncHandler(async (req: Request, res: Response) => {
  const { groupId } = req.params;
  const { page = 1, limit = 50 } = req.query;
  const userId = (req as any).user.id;

  const group = await Group.findById(groupId);

  if (!group) {
    res.status(404).json({ success: false, message: 'Group not found' });
    return;
  }

  // Check if user is a member or creator
  const isMember = group.members.some((member: any) => member.toString() === userId.toString());
  const isCreator = group.creator.toString() === userId.toString();

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
      id: (messageObj._id as any).toString(),
      author: messageObj.author ? {
        ...messageObj.author,
        id: (messageObj.author as any)._id ? (messageObj.author as any)._id.toString() : undefined
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
export const postGroupMessage = asyncHandler(async (req: Request, res: Response) => {
  const { groupId } = req.params;
  const { content, messageType = 'text' } = req.body;
  const author = (req as any).user.id;

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

  const populatedMessage = await GroupMessage.findById(message._id).populate('sender', 'name email');

  res.status(201).json({ success: true, data: populatedMessage });
});

import { Request, Response } from 'express';
import mongoose from 'mongoose';
import User from '../models/User';
import ConnectionRequest, { ConnectionRequestStatus } from '../models/ConnectionRequest';
import { asyncHandler } from '../middleware/errorHandler';

interface AuthRequest extends Request {
  user?: {
    id: string;
    _id: string;
    role: string;
  };
}

// @desc    Send connection request
// @route   POST /api/connections/request/:userId
// @access  Private
export const sendConnectionRequest = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const { userId } = req.params;
  const { message } = req.body;
  const senderId = req.user?.id || req.user?._id;

  if (!senderId) {
    res.status(401).json({ success: false, message: 'Unauthorized' });
    return;
  }

  // Check if trying to connect to self
  if (senderId === userId) {
    res.status(400).json({ success: false, message: 'Cannot send connection request to yourself' });
    return;
  }

  // Check if receiver exists
  const receiver = await User.findById(userId);
  if (!receiver) {
    res.status(404).json({ success: false, message: 'User not found' });
    return;
  }

  // Check if receiver allows connections
  if (!receiver.privacySettings?.allowConnection) {
    res.status(403).json({ success: false, message: 'This user is not accepting connection requests' });
    return;
  }

  // Check if users are already connected
  const sender = await User.findById(senderId);
  if (sender && sender.connections?.includes(new mongoose.Types.ObjectId(userId))) {
    res.status(400).json({ success: false, message: 'Already connected with this user' });
    return;
  }

  // Check if request already exists
  const existingRequest = await ConnectionRequest.findOne({
    $or: [
      { sender: senderId, receiver: userId },
      { sender: userId, receiver: senderId }
    ]
  });

  if (existingRequest) {
    let message = 'Connection request already exists';
    if (existingRequest.status === ConnectionRequestStatus.PENDING) {
      message = existingRequest.sender.toString() === senderId 
        ? 'Connection request already sent' 
        : 'This user has already sent you a connection request';
    } else if (existingRequest.status === ConnectionRequestStatus.REJECTED) {
      message = 'Connection request was previously rejected';
    }
    res.status(400).json({ success: false, message });
    return;
  }

  // Create connection request
  const connectionRequest = new ConnectionRequest({
    sender: senderId,
    receiver: userId,
    message: message?.trim() || '',
    status: ConnectionRequestStatus.PENDING
  });

  await connectionRequest.save();

  // Populate for response
  const populatedRequest = await ConnectionRequest.findById(connectionRequest._id)
    .populate('sender', 'name profileImage')
    .populate('receiver', 'name profileImage');

  res.status(201).json({
    success: true,
    message: 'Connection request sent successfully',
    data: populatedRequest
  });
});

// @desc    Accept connection request
// @route   POST /api/connections/accept/:requestId
// @access  Private
export const acceptConnectionRequest = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const { requestId } = req.params;
  const userId = req.user?.id || req.user?._id;

  if (!userId) {
    res.status(401).json({ success: false, message: 'Unauthorized' });
    return;
  }

  const connectionRequest = await ConnectionRequest.findById(requestId);

  if (!connectionRequest) {
    res.status(404).json({ success: false, message: 'Connection request not found' });
    return;
  }

  // Only receiver can accept the request
  if (connectionRequest.receiver.toString() !== userId) {
    res.status(403).json({ success: false, message: 'Not authorized to accept this request' });
    return;
  }

  if (connectionRequest.status !== ConnectionRequestStatus.PENDING) {
    res.status(400).json({ success: false, message: 'Connection request is not pending' });
    return;
  }

  // Update request status
  connectionRequest.status = ConnectionRequestStatus.ACCEPTED;
  await connectionRequest.save();

  // Add each user to the other's connections list
  await Promise.all([
    User.findByIdAndUpdate(
      connectionRequest.sender,
      { $addToSet: { connections: connectionRequest.receiver } }
    ),
    User.findByIdAndUpdate(
      connectionRequest.receiver,
      { $addToSet: { connections: connectionRequest.sender } }
    )
  ]);

  // Populate for response
  const populatedRequest = await ConnectionRequest.findById(connectionRequest._id)
    .populate('sender', 'name profileImage')
    .populate('receiver', 'name profileImage');

  res.json({
    success: true,
    message: 'Connection request accepted',
    data: populatedRequest
  });
});

// @desc    Reject connection request
// @route   POST /api/connections/reject/:requestId
// @access  Private
export const rejectConnectionRequest = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const { requestId } = req.params;
  const userId = req.user?.id || req.user?._id;

  if (!userId) {
    res.status(401).json({ success: false, message: 'Unauthorized' });
    return;
  }

  const connectionRequest = await ConnectionRequest.findById(requestId);

  if (!connectionRequest) {
    res.status(404).json({ success: false, message: 'Connection request not found' });
    return;
  }

  // Only receiver can reject the request
  if (connectionRequest.receiver.toString() !== userId) {
    res.status(403).json({ success: false, message: 'Not authorized to reject this request' });
    return;
  }

  if (connectionRequest.status !== ConnectionRequestStatus.PENDING) {
    res.status(400).json({ success: false, message: 'Connection request is not pending' });
    return;
  }

  // Update request status
  connectionRequest.status = ConnectionRequestStatus.REJECTED;
  await connectionRequest.save();

  res.json({
    success: true,
    message: 'Connection request rejected',
    data: connectionRequest
  });
});

// @desc    Get pending connection requests (received)
// @route   GET /api/connections/requests/received
// @access  Private
export const getReceivedConnectionRequests = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user?.id || req.user?._id;

  if (!userId) {
    res.status(401).json({ success: false, message: 'Unauthorized' });
    return;
  }

  const requests = await ConnectionRequest.find({
    receiver: userId,
    status: ConnectionRequestStatus.PENDING
  })
    .populate('sender', 'name profileImage jobTitle company')
    .sort({ createdAt: -1 });

  res.json({
    success: true,
    data: requests
  });
});

// @desc    Get sent connection requests
// @route   GET /api/connections/requests/sent
// @access  Private
export const getSentConnectionRequests = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user?.id || req.user?._id;

  if (!userId) {
    res.status(401).json({ success: false, message: 'Unauthorized' });
    return;
  }

  const requests = await ConnectionRequest.find({
    sender: userId
  })
    .populate('receiver', 'name profileImage jobTitle company')
    .sort({ createdAt: -1 });

  res.json({
    success: true,
    data: requests
  });
});

// @desc    Get user's connections
// @route   GET /api/connections
// @access  Private
export const getUserConnections = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user?.id || req.user?._id;
  const { page = 1, limit = 10, search } = req.query;

  if (!userId) {
    res.status(401).json({ success: false, message: 'Unauthorized' });
    return;
  }

  const user = await User.findById(userId).populate({
    path: 'connections',
    select: 'name profileImage jobTitle company city admissionYear',
    options: {
      sort: { name: 1 },
      skip: (Number(page) - 1) * Number(limit),
      limit: Number(limit)
    },
    match: search ? {
      $or: [
        { name: { $regex: search, $options: 'i' } },
        { jobTitle: { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } }
      ]
    } : {}
  });

  if (!user) {
    res.status(404).json({ success: false, message: 'User not found' });
    return;
  }

  // Get total count for pagination
  const totalConnections = user.connections?.length || 0;

  res.json({
    success: true,
    data: user.connections || [],
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total: totalConnections,
      pages: Math.ceil(totalConnections / Number(limit))
    }
  });
});

// @desc    Get connection status with another user
// @route   GET /api/connections/:userId/status
// @access  Private
export const getConnectionStatus = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const { userId: otherUserId } = req.params;
  const currentUserId = req.user?.id || req.user?._id;

  if (!currentUserId) {
    res.status(401).json({ success: false, message: 'Unauthorized' });
    return;
  }

  if (currentUserId === otherUserId) {
    res.json({ success: true, data: { status: 'self' } });
    return;
  }

  // Check if users are already connected
  const currentUser = await User.findById(currentUserId).select('connections');
  if (currentUser?.connections?.includes(new mongoose.Types.ObjectId(otherUserId))) {
    res.json({ success: true, data: { status: 'connected' } });
    return;
  }

  // Check for a pending connection request
  const existingRequest = await ConnectionRequest.findOne({
    $or: [
      { sender: currentUserId, receiver: otherUserId },
      { sender: otherUserId, receiver: currentUserId }
    ],
    status: ConnectionRequestStatus.PENDING
  });

  if (existingRequest) {
    const requestType = existingRequest.sender.toString() === currentUserId ? 'sent' : 'received';
    res.json({
      success: true,
      data: {
        status: 'pending',
        requestType: requestType,
        requestId: existingRequest._id
      }
    });
    return;
  }

  res.json({ success: true, data: { status: 'none' } });
});

// @desc    Remove connection
// @route   DELETE /api/connections/:userId
// @access  Private
export const removeConnection = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const { userId } = req.params;
  const currentUserId = req.user?.id || req.user?._id;

  if (!currentUserId) {
    res.status(401).json({ success: false, message: 'Unauthorized' });
    return;
  }

  // Check if the connection exists
  const currentUser = await User.findById(currentUserId);
  if (!currentUser || !currentUser.connections?.includes(new mongoose.Types.ObjectId(userId))) {
    res.status(404).json({ success: false, message: 'Connection not found' });
    return;
  }

  // Remove each user from the other's connections list
  await Promise.all([
    User.findByIdAndUpdate(
      currentUserId,
      { $pull: { connections: userId } }
    ),
    User.findByIdAndUpdate(
      userId,
      { $pull: { connections: currentUserId } }
    )
  ]);

  // Also update any connection request to rejected status
  await ConnectionRequest.findOneAndUpdate(
    {
      $or: [
        { sender: currentUserId, receiver: userId },
        { sender: userId, receiver: currentUserId }
      ],
      status: ConnectionRequestStatus.ACCEPTED
    },
    { status: ConnectionRequestStatus.REJECTED }
  );

  res.json({
    success: true,
    message: 'Connection removed successfully'
  });
});

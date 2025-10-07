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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeConnection = exports.getConnectionStatus = exports.getUserConnections = exports.getSentConnectionRequests = exports.getReceivedConnectionRequests = exports.rejectConnectionRequest = exports.acceptConnectionRequest = exports.sendConnectionRequest = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const User_1 = __importDefault(require("../models/User"));
const ConnectionRequest_1 = __importStar(require("../models/ConnectionRequest"));
const errorHandler_1 = require("../middleware/errorHandler");
exports.sendConnectionRequest = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { userId } = req.params;
    const { message } = req.body;
    const senderId = req.user?.id || req.user?._id;
    if (!senderId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
    }
    if (senderId === userId) {
        res.status(400).json({ success: false, message: 'Cannot send connection request to yourself' });
        return;
    }
    const receiver = await User_1.default.findById(userId);
    if (!receiver) {
        res.status(404).json({ success: false, message: 'User not found' });
        return;
    }
    if (!receiver.privacySettings?.allowConnection) {
        res.status(403).json({ success: false, message: 'This user is not accepting connection requests' });
        return;
    }
    const sender = await User_1.default.findById(senderId);
    if (sender && sender.connections?.includes(new mongoose_1.default.Types.ObjectId(userId))) {
        res.status(400).json({ success: false, message: 'Already connected with this user' });
        return;
    }
    const existingRequest = await ConnectionRequest_1.default.findOne({
        $or: [
            { sender: senderId, receiver: userId },
            { sender: userId, receiver: senderId }
        ]
    });
    if (existingRequest) {
        let message = 'Connection request already exists';
        if (existingRequest.status === ConnectionRequest_1.ConnectionRequestStatus.PENDING) {
            message = existingRequest.sender.toString() === senderId
                ? 'Connection request already sent'
                : 'This user has already sent you a connection request';
        }
        else if (existingRequest.status === ConnectionRequest_1.ConnectionRequestStatus.REJECTED) {
            message = 'Connection request was previously rejected';
        }
        res.status(400).json({ success: false, message });
        return;
    }
    const connectionRequest = new ConnectionRequest_1.default({
        sender: senderId,
        receiver: userId,
        message: message?.trim() || '',
        status: ConnectionRequest_1.ConnectionRequestStatus.PENDING
    });
    await connectionRequest.save();
    const populatedRequest = await ConnectionRequest_1.default.findById(connectionRequest._id)
        .populate('sender', 'name profileImage')
        .populate('receiver', 'name profileImage');
    res.status(201).json({
        success: true,
        message: 'Connection request sent successfully',
        data: populatedRequest
    });
});
exports.acceptConnectionRequest = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { requestId } = req.params;
    const userId = req.user?.id || req.user?._id;
    if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
    }
    const connectionRequest = await ConnectionRequest_1.default.findById(requestId);
    if (!connectionRequest) {
        res.status(404).json({ success: false, message: 'Connection request not found' });
        return;
    }
    if (connectionRequest.receiver.toString() !== userId) {
        res.status(403).json({ success: false, message: 'Not authorized to accept this request' });
        return;
    }
    if (connectionRequest.status !== ConnectionRequest_1.ConnectionRequestStatus.PENDING) {
        res.status(400).json({ success: false, message: 'Connection request is not pending' });
        return;
    }
    connectionRequest.status = ConnectionRequest_1.ConnectionRequestStatus.ACCEPTED;
    await connectionRequest.save();
    await Promise.all([
        User_1.default.findByIdAndUpdate(connectionRequest.sender, { $addToSet: { connections: connectionRequest.receiver } }),
        User_1.default.findByIdAndUpdate(connectionRequest.receiver, { $addToSet: { connections: connectionRequest.sender } })
    ]);
    const populatedRequest = await ConnectionRequest_1.default.findById(connectionRequest._id)
        .populate('sender', 'name profileImage')
        .populate('receiver', 'name profileImage');
    res.json({
        success: true,
        message: 'Connection request accepted',
        data: populatedRequest
    });
});
exports.rejectConnectionRequest = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { requestId } = req.params;
    const userId = req.user?.id || req.user?._id;
    if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
    }
    const connectionRequest = await ConnectionRequest_1.default.findById(requestId);
    if (!connectionRequest) {
        res.status(404).json({ success: false, message: 'Connection request not found' });
        return;
    }
    if (connectionRequest.receiver.toString() !== userId) {
        res.status(403).json({ success: false, message: 'Not authorized to reject this request' });
        return;
    }
    if (connectionRequest.status !== ConnectionRequest_1.ConnectionRequestStatus.PENDING) {
        res.status(400).json({ success: false, message: 'Connection request is not pending' });
        return;
    }
    connectionRequest.status = ConnectionRequest_1.ConnectionRequestStatus.REJECTED;
    await connectionRequest.save();
    res.json({
        success: true,
        message: 'Connection request rejected',
        data: connectionRequest
    });
});
exports.getReceivedConnectionRequests = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user?.id || req.user?._id;
    if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
    }
    const requests = await ConnectionRequest_1.default.find({
        receiver: userId,
        status: ConnectionRequest_1.ConnectionRequestStatus.PENDING
    })
        .populate('sender', 'name profileImage jobTitle company')
        .sort({ createdAt: -1 });
    res.json({
        success: true,
        data: requests
    });
});
exports.getSentConnectionRequests = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user?.id || req.user?._id;
    if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
    }
    const requests = await ConnectionRequest_1.default.find({
        sender: userId
    })
        .populate('receiver', 'name profileImage jobTitle company')
        .sort({ createdAt: -1 });
    res.json({
        success: true,
        data: requests
    });
});
exports.getUserConnections = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user?.id || req.user?._id;
    const { page = 1, limit = 10, search } = req.query;
    if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
    }
    const user = await User_1.default.findById(userId).populate({
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
exports.getConnectionStatus = (0, errorHandler_1.asyncHandler)(async (req, res) => {
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
    const currentUser = await User_1.default.findById(currentUserId).select('connections');
    if (currentUser?.connections?.includes(new mongoose_1.default.Types.ObjectId(otherUserId))) {
        res.json({ success: true, data: { status: 'connected' } });
        return;
    }
    const existingRequest = await ConnectionRequest_1.default.findOne({
        $or: [
            { sender: currentUserId, receiver: otherUserId },
            { sender: otherUserId, receiver: currentUserId }
        ],
        status: ConnectionRequest_1.ConnectionRequestStatus.PENDING
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
exports.removeConnection = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { userId } = req.params;
    const currentUserId = req.user?.id || req.user?._id;
    if (!currentUserId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
    }
    const currentUser = await User_1.default.findById(currentUserId);
    if (!currentUser || !currentUser.connections?.includes(new mongoose_1.default.Types.ObjectId(userId))) {
        res.status(404).json({ success: false, message: 'Connection not found' });
        return;
    }
    await Promise.all([
        User_1.default.findByIdAndUpdate(currentUserId, { $pull: { connections: userId } }),
        User_1.default.findByIdAndUpdate(userId, { $pull: { connections: currentUserId } })
    ]);
    await ConnectionRequest_1.default.findOneAndUpdate({
        $or: [
            { sender: currentUserId, receiver: userId },
            { sender: userId, receiver: currentUserId }
        ],
        status: ConnectionRequest_1.ConnectionRequestStatus.ACCEPTED
    }, { status: ConnectionRequest_1.ConnectionRequestStatus.REJECTED });
    res.json({
        success: true,
        message: 'Connection removed successfully'
    });
});
//# sourceMappingURL=connectionController.js.map
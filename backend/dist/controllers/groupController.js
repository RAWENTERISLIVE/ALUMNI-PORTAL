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
exports.getUserGroups = exports.postGroupMessage = exports.getGroupMessages = exports.leaveGroup = exports.joinGroup = exports.getGroup = exports.getGroups = exports.createGroup = void 0;
const Group_1 = __importStar(require("../models/Group"));
const GroupMessage_1 = __importDefault(require("../models/GroupMessage"));
const errorHandler_1 = require("../middleware/errorHandler");
const isPopulatedUser = (obj) => {
    return typeof obj === 'object' && obj !== null && '_id' in obj && 'name' in obj && 'email' in obj;
};
exports.createGroup = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { name, description, privacy, category } = req.body;
    const creator = req.user?.id;
    const newGroup = new Group_1.default({
        name,
        description,
        creator,
        members: [creator],
        privacy: privacy ?? Group_1.GroupPrivacy.PUBLIC,
        category: category ?? 'professional',
        memberCount: 1,
        lastActivity: new Date()
    });
    const group = await newGroup.save();
    res.status(201).json({ success: true, data: group });
});
exports.getGroups = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { page = 1, limit = 10, search, privacy } = req.query;
    const userId = req.user?.id;
    const query = {
        $or: [
            { privacy: Group_1.GroupPrivacy.PUBLIC },
            { members: userId },
            { creator: userId }
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
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;
    const groups = await Group_1.default.find(query)
        .populate('creator', 'name email profileImage')
        .populate('members', 'name email profileImage')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum);
    const total = await Group_1.default.countDocuments(query);
    const formattedGroups = groups.map(group => {
        const groupObj = group.toObject();
        return {
            ...groupObj,
            id: groupObj._id.toString(),
            creator: groupObj.creator && {
                ...groupObj.creator,
                id: groupObj.creator._id ? groupObj.creator._id.toString() : undefined
            },
            members: groupObj.members ? groupObj.members.map((member) => {
                if (isPopulatedUser(member)) {
                    return {
                        ...member,
                        id: member._id ? member._id.toString() : undefined
                    };
                }
                return { id: member.toString() };
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
exports.getGroup = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const group = await Group_1.default.findById(req.params.groupId)
        .populate('creator', 'name email')
        .populate('members', 'name email');
    if (!group) {
        res.status(404).json({ success: false, message: 'Group not found' });
        return;
    }
    if (group.privacy === Group_1.GroupPrivacy.PRIVATE && !group.members.includes(req.user?.id)) {
        res.status(403).json({ success: false, message: 'You do not have permission to view this group' });
        return;
    }
    res.json({ success: true, data: group });
});
exports.joinGroup = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const groupId = req.params.groupId;
    const userId = req.user?.id;
    const group = await Group_1.default.findById(groupId);
    if (!group) {
        res.status(404).json({ success: false, message: 'Group not found' });
        return;
    }
    if (group.privacy === Group_1.GroupPrivacy.PRIVATE) {
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
exports.leaveGroup = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const groupId = req.params.groupId;
    const userId = req.user?.id;
    const group = await Group_1.default.findById(groupId);
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
    group.members = group.members.filter((memberId) => memberId.toString() !== userId?.toString());
    await group.save();
    res.json({ success: true, message: 'Successfully left the group', data: group });
});
exports.getGroupMessages = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { groupId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const userId = req.user?.id;
    const group = await Group_1.default.findById(groupId);
    if (!group) {
        res.status(404).json({ success: false, message: 'Group not found' });
        return;
    }
    const isMember = group.members.some((member) => member.toString() === userId?.toString());
    const isCreator = group.creator.toString() === userId?.toString();
    if (!isMember && !isCreator) {
        res.status(403).json({ success: false, message: 'You must be a member to view messages' });
        return;
    }
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;
    const messages = await GroupMessage_1.default.find({ group: groupId })
        .populate('author', 'name email firstName lastName profileImage')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum);
    const formattedMessages = messages.map(message => {
        const messageObj = message.toObject();
        return {
            ...messageObj,
            id: messageObj._id.toString(),
            author: messageObj.author && isPopulatedUser(messageObj.author) ? {
                ...messageObj.author,
                id: messageObj.author._id ? messageObj.author._id.toString() : undefined
            } : null
        };
    });
    const totalMessages = await GroupMessage_1.default.countDocuments({ group: groupId });
    res.json({
        success: true,
        data: formattedMessages.reverse(),
        pagination: {
            page: pageNum,
            limit: limitNum,
            total: totalMessages,
            pages: Math.ceil(totalMessages / limitNum)
        }
    });
});
exports.postGroupMessage = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { groupId } = req.params;
    const { content, messageType = 'text' } = req.body;
    const author = req.user?.id;
    const group = await Group_1.default.findById(groupId);
    if (!group) {
        res.status(404).json({ success: false, message: 'Group not found' });
        return;
    }
    if (!group.members.includes(author)) {
        res.status(403).json({ success: false, message: 'You must be a member to post messages' });
        return;
    }
    const message = new GroupMessage_1.default({
        group: groupId,
        author,
        content,
        messageType,
    });
    await message.save();
    const populatedMessage = await GroupMessage_1.default.findById(message._id).populate('author', 'name email firstName lastName profileImage');
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
exports.getUserGroups = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user?.id;
    const groups = await Group_1.default.find({
        members: userId
    })
        .populate('creator', 'name email profileImage')
        .populate('members', 'name email profileImage')
        .sort({ lastActivity: -1 })
        .limit(10);
    const formattedGroups = groups.map(group => {
        const groupObj = group.toObject();
        return {
            ...groupObj,
            id: groupObj._id.toString(),
            creator: groupObj.creator && {
                ...groupObj.creator,
                id: groupObj.creator._id ? groupObj.creator._id.toString() : undefined
            },
            members: groupObj.members ? groupObj.members.map((member) => {
                if (isPopulatedUser(member)) {
                    return {
                        ...member,
                        id: member._id ? member._id.toString() : undefined
                    };
                }
                return { id: member.toString() };
            }) : []
        };
    });
    res.json({
        success: true,
        data: formattedGroups
    });
});
//# sourceMappingURL=groupController.js.map
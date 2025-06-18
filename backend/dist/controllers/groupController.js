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
exports.postGroupMessage = exports.getGroupMessages = exports.leaveGroup = exports.joinGroup = exports.getGroup = exports.getGroups = exports.createGroup = void 0;
const Group_1 = __importStar(require("../models/Group"));
const GroupMessage_1 = __importDefault(require("../models/GroupMessage"));
const errorHandler_1 = require("../middleware/errorHandler");
exports.createGroup = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { name, description, privacy } = req.body;
    const creator = req.user.id;
    const newGroup = new Group_1.default({
        name,
        description,
        creator,
        members: [creator],
        privacy: privacy || Group_1.GroupPrivacy.PUBLIC,
    });
    const group = await newGroup.save();
    res.status(201).json({ success: true, data: group });
});
exports.getGroups = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { page = 1, limit = 10, search } = req.query;
    const userId = req.user.id;
    const query = {
        $or: [
            { privacy: Group_1.GroupPrivacy.PUBLIC },
            { members: userId },
        ],
    };
    if (search) {
        query.name = { $regex: search, $options: 'i' };
    }
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;
    const groups = await Group_1.default.find(query)
        .populate('creator', 'name email')
        .populate('members', 'name email')
        .skip(skip)
        .limit(limitNum);
    const total = await Group_1.default.countDocuments(query);
    res.json({
        success: true,
        data: groups,
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
    if (group.privacy === Group_1.GroupPrivacy.PRIVATE && !group.members.includes(req.user.id)) {
        res.status(403).json({ success: false, message: 'You do not have permission to view this group' });
        return;
    }
    res.json({ success: true, data: group });
});
exports.joinGroup = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const groupId = req.params.groupId;
    const userId = req.user.id;
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
    const userId = req.user.id;
    const group = await Group_1.default.findById(groupId);
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
    group.members = group.members.filter((memberId) => memberId.toString() !== userId.toString());
    await group.save();
    res.json({ success: true, message: 'Successfully left the group', data: group });
});
exports.getGroupMessages = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { groupId } = req.params;
    const userId = req.user.id;
    const group = await Group_1.default.findById(groupId);
    if (!group) {
        res.status(404).json({ success: false, message: 'Group not found' });
        return;
    }
    if (!group.members.includes(userId)) {
        res.status(403).json({ success: false, message: 'You must be a member to view messages' });
        return;
    }
    const messages = await GroupMessage_1.default.find({ group: groupId })
        .populate('sender', 'name email')
        .sort({ createdAt: -1 });
    res.json({ success: true, data: messages });
});
exports.postGroupMessage = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { groupId } = req.params;
    const { content } = req.body;
    const sender = req.user.id;
    const group = await Group_1.default.findById(groupId);
    if (!group) {
        res.status(404).json({ success: false, message: 'Group not found' });
        return;
    }
    if (!group.members.includes(sender)) {
        res.status(403).json({ success: false, message: 'You must be a member to post messages' });
        return;
    }
    const message = new GroupMessage_1.default({
        group: groupId,
        sender,
        content,
    });
    await message.save();
    const populatedMessage = await GroupMessage_1.default.findById(message._id).populate('sender', 'name email');
    res.status(201).json({ success: true, data: populatedMessage });
});
//# sourceMappingURL=groupController.js.map
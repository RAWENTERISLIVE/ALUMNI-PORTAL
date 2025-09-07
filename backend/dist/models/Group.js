"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GroupPrivacy = void 0;
const mongoose_1 = require("mongoose");
var GroupPrivacy;
(function (GroupPrivacy) {
    GroupPrivacy["PUBLIC"] = "public";
    GroupPrivacy["PRIVATE"] = "private";
})(GroupPrivacy || (exports.GroupPrivacy = GroupPrivacy = {}));
const GroupSchema = new mongoose_1.Schema({
    name: {
        type: String,
        required: [true, 'Please add a name'],
        trim: true,
        maxlength: [100, 'Name cannot be more than 100 characters']
    },
    description: {
        type: String,
        required: [true, 'Please add a description'],
        maxlength: [1000, 'Description cannot be more than 1000 characters']
    },
    creator: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    members: [{
            type: mongoose_1.Schema.Types.ObjectId,
            ref: 'User',
        }],
    admins: [{
            type: mongoose_1.Schema.Types.ObjectId,
            ref: 'User',
        }],
    pendingRequests: [{
            type: mongoose_1.Schema.Types.ObjectId,
            ref: 'User',
        }],
    privacy: {
        type: String,
        enum: Object.values(GroupPrivacy),
        default: GroupPrivacy.PUBLIC,
    },
    category: {
        type: String,
        enum: ['professional', 'academic', 'social', 'tech', 'career', 'batch', 'alumni', 'networking', 'hobby'],
        default: 'professional',
    },
    tags: [{
            type: String,
            trim: true,
            lowercase: true
        }],
    avatar: {
        type: String,
        default: null
    },
    coverImage: {
        type: String,
        default: null
    },
    rules: {
        type: String,
        maxlength: [2000, 'Rules cannot be more than 2000 characters']
    },
    isActive: {
        type: Boolean,
        default: true
    },
    lastActivity: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true,
});
GroupSchema.virtual('totalMembers').get(function () {
    return this.members ? this.members.length : 0;
});
GroupSchema.set('toJSON', {
    virtuals: true
});
GroupSchema.set('toObject', {
    virtuals: true
});
GroupSchema.pre('save', function (next) {
    this.lastActivity = new Date();
    if (this.creator && !this.members.includes(this.creator)) {
        this.members.push(this.creator);
    }
    if (this.creator && !this.admins.includes(this.creator)) {
        this.admins.push(this.creator);
    }
    next();
});
GroupSchema.methods.addMember = function (userId) {
    if (!this.members.includes(userId)) {
        this.members.push(userId);
        this.pendingRequests = this.pendingRequests.filter((id) => !id.equals(userId));
        this.lastActivity = new Date();
        return this.save();
    }
    return Promise.resolve(this);
};
GroupSchema.methods.removeMember = function (userId) {
    this.members = this.members.filter((id) => !id.equals(userId));
    this.admins = this.admins.filter((id) => !id.equals(userId));
    this.lastActivity = new Date();
    return this.save();
};
GroupSchema.methods.addAdmin = function (userId) {
    if (this.members.includes(userId) && !this.admins.includes(userId)) {
        this.admins.push(userId);
        return this.save();
    }
    throw new Error('User must be a member to become admin');
};
GroupSchema.methods.isAdmin = function (userId) {
    return this.admins.some((id) => id.equals(userId));
};
GroupSchema.methods.isMember = function (userId) {
    return this.members.some((id) => id.equals(userId));
};
exports.default = (0, mongoose_1.model)('Group', GroupSchema);
//# sourceMappingURL=Group.js.map
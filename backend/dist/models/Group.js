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
    },
    description: {
        type: String,
        required: [true, 'Please add a description'],
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
    privacy: {
        type: String,
        enum: Object.values(GroupPrivacy),
        default: GroupPrivacy.PUBLIC,
    },
    category: {
        type: String,
        default: 'professional',
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
    next();
});
exports.default = (0, mongoose_1.model)('Group', GroupSchema);
//# sourceMappingURL=Group.js.map
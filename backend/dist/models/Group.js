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
}, {
    timestamps: true,
});
GroupSchema.pre('save', function (next) {
    this.memberCount = this.members.length;
    this.lastActivity = new Date();
    next();
});
exports.default = (0, mongoose_1.model)('Group', GroupSchema);
//# sourceMappingURL=Group.js.map
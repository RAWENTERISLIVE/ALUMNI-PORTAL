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
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const postSchema = new mongoose_1.Schema({
    title: {
        type: String,
        maxlength: 200,
        trim: true
    },
    content: {
        type: String,
        required: true,
        maxlength: 2000,
        trim: true
    },
    author: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    category: {
        type: String,
        enum: ['general', 'career', 'networking', 'events', 'achievements', 'announcements'],
        default: 'general'
    },
    isFeatured: {
        type: Boolean,
        default: false
    },
    isSchoolUpdate: {
        type: Boolean,
        default: false
    },
    sharedPost: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Post'
    },
    shareType: {
        type: String,
        enum: ['quote', 'simple']
    },
    reactions: [{
            userId: {
                type: mongoose_1.Schema.Types.ObjectId,
                ref: 'User'
            },
            type: {
                type: String,
                enum: ['like', 'love', 'celebrate', 'support', 'insightful', 'funny'],
                default: 'like'
            }
        }],
    bookmarks: [{
            type: mongoose_1.Schema.Types.ObjectId,
            ref: 'User'
        }],
    comments: [{
            type: mongoose_1.Schema.Types.ObjectId,
            ref: 'Comment'
        }],
    commentCount: {
        type: Number,
        default: 0
    },
    shareCount: {
        type: Number,
        default: 0
    },
    visibility: {
        type: String,
        enum: ['public', 'alumni_only', 'faculty_only', 'connections_only'],
        default: 'public'
    },
    tags: [{
            type: String,
            trim: true,
            maxlength: 50
        }],
    externalLinks: [{
            type: String,
            validate: {
                validator: function (url) {
                    try {
                        new URL(url);
                        return true;
                    }
                    catch {
                        return false;
                    }
                },
                message: 'External link must be a valid URL'
            }
        }],
    mentions: [{
            type: mongoose_1.Schema.Types.ObjectId,
            ref: 'User'
        }]
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});
postSchema.index({ author: 1, createdAt: -1 });
postSchema.index({ category: 1, createdAt: -1 });
postSchema.index({ visibility: 1, createdAt: -1 });
postSchema.index({ tags: 1 });
postSchema.index({ isFeatured: 1, createdAt: -1 });
postSchema.index({ isSchoolUpdate: 1, createdAt: -1 });
postSchema.virtual('likeCount').get(function () {
    return this.reactions ? this.reactions.filter(r => r.type === 'like').length : 0;
});
postSchema.virtual('bookmarkCount').get(function () {
    return this.bookmarks ? this.bookmarks.length : 0;
});
exports.default = mongoose_1.default.models.Post || mongoose_1.default.model('Post', postSchema);
//# sourceMappingURL=Post.js.map
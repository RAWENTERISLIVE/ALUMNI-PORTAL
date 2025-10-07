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
const mentorshipProfileSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    isMentor: {
        type: Boolean,
        default: false
    },
    isSeekingMentor: {
        type: Boolean,
        default: false
    },
    expertise: [{
            type: String,
            maxlength: 50,
            trim: true
        }],
    experience: {
        type: String,
        maxlength: 2000,
        trim: true
    },
    industry: {
        type: String,
        maxlength: 100,
        trim: true
    },
    company: {
        type: String,
        maxlength: 100,
        trim: true
    },
    position: {
        type: String,
        maxlength: 100,
        trim: true
    },
    yearsOfExperience: {
        type: Number,
        min: 0,
        max: 50,
        default: 0
    },
    bio: {
        type: String,
        maxlength: 1000,
        trim: true,
        default: ''
    },
    availability: {
        type: String,
        enum: ['high', 'medium', 'low'],
        default: 'medium'
    },
    preferredMenteeLevel: [{
            type: String,
            enum: ['student', 'new_graduate', 'early_career', 'mid_career']
        }],
    maxMentees: {
        type: Number,
        min: 1,
        max: 20,
        default: 3
    },
    currentMentees: {
        type: Number,
        min: 0,
        default: 0
    },
    careerGoals: [{
            type: String,
            maxlength: 100,
            trim: true
        }],
    currentLevel: {
        type: String,
        enum: ['student', 'new_graduate', 'early_career', 'mid_career']
    },
    interestedFields: [{
            type: String,
            maxlength: 50,
            trim: true
        }],
    mentorshipGoals: {
        type: String,
        maxlength: 1000,
        trim: true,
        default: ''
    },
    preferredMentorExperience: {
        type: String,
        maxlength: 500,
        trim: true,
        default: ''
    },
    communicationPreferences: [{
            type: String,
            enum: ['video_call', 'phone_call', 'text_messages', 'email', 'in_person']
        }],
    timezone: {
        type: String,
        default: 'UTC'
    },
    linkedInUrl: {
        type: String,
        validate: {
            validator: function (url) {
                return !url || /^https?:\/\/(www\.)?linkedin\.com\//.test(url);
            },
            message: 'LinkedIn URL must be a valid LinkedIn profile URL'
        }
    },
    portfolioUrl: {
        type: String,
        validate: {
            validator: function (url) {
                return !url || /^https?:\/\//.test(url);
            },
            message: 'Portfolio URL must be a valid URL'
        }
    },
    isActive: {
        type: Boolean,
        default: true
    },
    rating: {
        type: Number,
        min: 0,
        max: 5,
        default: 0
    },
    totalRatings: {
        type: Number,
        min: 0,
        default: 0
    },
    successfulMatches: {
        type: Number,
        min: 0,
        default: 0
    }
}, {
    timestamps: true,
    toJSON: {
        transform: function (_doc, ret) {
            ret.id = ret._id;
            delete ret._id;
            delete ret.__v;
            return ret;
        }
    }
});
mentorshipProfileSchema.index({ isMentor: 1, isActive: 1 });
mentorshipProfileSchema.index({ isSeekingMentor: 1, isActive: 1 });
mentorshipProfileSchema.index({ expertise: 1 });
mentorshipProfileSchema.index({ industry: 1 });
mentorshipProfileSchema.index({ currentLevel: 1 });
mentorshipProfileSchema.index({ interestedFields: 1 });
mentorshipProfileSchema.index({ rating: -1 });
const MentorshipProfile = mongoose_1.default.model('MentorshipProfile', mentorshipProfileSchema);
exports.default = MentorshipProfile;
//# sourceMappingURL=MentorshipProfile.js.map
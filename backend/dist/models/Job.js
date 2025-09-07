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
const jobSchema = new mongoose_1.Schema({
    title: {
        type: String,
        required: true,
        maxlength: 100,
        trim: true
    },
    company: {
        type: String,
        required: true,
        maxlength: 100,
        trim: true
    },
    location: {
        type: String,
        required: true,
        maxlength: 100,
        trim: true
    },
    type: {
        type: String,
        enum: ['full-time', 'part-time', 'contract', 'internship', 'freelance'],
        required: true
    },
    salaryRange: {
        min: {
            type: Number,
            min: 0
        },
        max: {
            type: Number,
            min: 0
        },
        currency: {
            type: String,
            default: 'USD',
            maxlength: 3
        }
    },
    description: {
        type: String,
        required: true,
        maxlength: 3000,
        trim: true
    },
    requirements: [{
            type: String,
            maxlength: 200,
            trim: true
        }],
    benefits: [{
            type: String,
            maxlength: 200,
            trim: true
        }],
    postedBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    postedByName: {
        type: String,
        required: true
    },
    applicationUrl: {
        type: String,
        validate: {
            validator: function (url) {
                return !url || /^https?:\/\//.test(url);
            },
            message: 'Application URL must be a valid URL'
        }
    },
    contactEmail: {
        type: String,
        validate: {
            validator: function (email) {
                return !email || /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(email);
            },
            message: 'Please enter a valid contact email address'
        }
    },
    isAlumniReferral: {
        type: Boolean,
        default: true
    },
    applicationDeadline: {
        type: Date
    },
    isActive: {
        type: Boolean,
        default: true
    },
    applicationCount: {
        type: Number,
        default: 0,
        min: 0
    },
    savedBy: [{
            type: mongoose_1.Schema.Types.ObjectId,
            ref: 'User'
        }],
    tags: [{
            type: String,
            maxlength: 50,
            trim: true
        }]
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
jobSchema.index({ postedBy: 1 });
jobSchema.index({ type: 1 });
jobSchema.index({ location: 1 });
jobSchema.index({ isActive: 1 });
jobSchema.index({ createdAt: -1 });
jobSchema.index({ applicationDeadline: 1 });
jobSchema.index({ tags: 1 });
jobSchema.index({ company: 1 });
const Job = mongoose_1.default.model('Job', jobSchema);
exports.default = Job;
//# sourceMappingURL=Job.js.map
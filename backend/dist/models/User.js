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
exports.UserStatus = exports.UserRole = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
var UserRole;
(function (UserRole) {
    UserRole["USER"] = "user";
    UserRole["ADMIN"] = "admin";
    UserRole["SUPER_ADMIN"] = "super_admin";
})(UserRole || (exports.UserRole = UserRole = {}));
var UserStatus;
(function (UserStatus) {
    UserStatus["PENDING"] = "pending";
    UserStatus["ACTIVE"] = "active";
    UserStatus["SUSPENDED"] = "suspended";
    UserStatus["DELETED"] = "deleted";
})(UserStatus || (exports.UserStatus = UserStatus = {}));
const userSchema = new mongoose_1.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        validate: {
            validator: function (email) {
                return /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(email);
            },
            message: 'Please enter a valid email address'
        }
    },
    password: {
        type: String,
        required: true,
        minlength: 8,
        select: false
    },
    name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100
    },
    firstName: {
        type: String,
        trim: true,
        maxlength: 50
    },
    lastName: {
        type: String,
        trim: true,
        maxlength: 50
    },
    location: {
        type: String,
        maxlength: 100
    },
    admissionNumber: {
        type: String,
        required: function () {
            return !this.needsManualVerification;
        },
        trim: true,
        maxlength: 20,
        validate: {
            validator: function (v) {
                if (this.needsManualVerification && v === 'MANUAL_VERIFICATION')
                    return true;
                return /^[a-zA-Z0-9/-]{3,20}$/.test(v);
            },
            message: 'Admission number is not valid.'
        }
    },
    admissionYear: {
        type: String,
        required: true,
        trim: true
    },
    needsManualVerification: {
        type: Boolean,
        default: false
    },
    verificationDetails: {
        type: String,
        trim: true,
        maxlength: 500
    },
    role: {
        type: String,
        enum: Object.values(UserRole),
        default: UserRole.USER
    },
    status: {
        type: String,
        enum: Object.values(UserStatus),
        default: UserStatus.PENDING
    },
    isVerified: { type: Boolean, default: false },
    profileImage: { type: String },
    bio: { type: String, maxlength: 500 },
    headline: { type: String, maxlength: 150 },
    city: { type: String, maxlength: 100 },
    country: { type: String, maxlength: 100 },
    contactEmail: { type: String },
    contactPhone: { type: String },
    linkedInProfile: { type: String },
    company: { type: String, maxlength: 100 },
    jobTitle: { type: String, trim: true, maxlength: 100 },
    isAvailableAsMentor: { type: Boolean, default: false },
    connections: [{ type: mongoose_1.default.Schema.Types.ObjectId, ref: 'User' }],
    lastLogin: { type: Date },
    refreshTokens: [{ type: String }],
    passwordResetToken: { type: String, default: null },
    passwordResetExpires: { type: Date, default: null },
    emailVerificationToken: { type: String },
    emailVerificationExpires: { type: Date },
    notificationSettings: {
        emailMessages: { type: Boolean, default: true },
        emailJobs: { type: Boolean, default: true },
        emailEvents: { type: Boolean, default: true },
        emailGroups: { type: Boolean, default: true },
        pushMessages: { type: Boolean, default: true },
        pushJobs: { type: Boolean, default: false },
        pushEvents: { type: Boolean, default: true },
        pushGroups: { type: Boolean, default: true }
    },
    privacySettings: {
        profileVisibility: { type: String, enum: ['public', 'alumni', 'connections'], default: 'alumni' },
        showEmail: { type: Boolean, default: false },
        showPhone: { type: Boolean, default: false },
        allowMessaging: { type: Boolean, default: true },
        allowConnection: { type: Boolean, default: true },
        allowProfileSearch: { type: Boolean, default: true }
    }
}, { timestamps: true });
userSchema.pre('save', async function (next) {
    if (this.isModified('password') && this.password) {
        try {
            const salt = await bcryptjs_1.default.genSalt(10);
            this.password = await bcryptjs_1.default.hash(this.password, salt);
        }
        catch (error) {
            return next(error instanceof Error ? error : new Error('Password hashing failed'));
        }
    }
    if (this.isModified('name') || this.isNew) {
        if (this.name && !this.firstName && !this.lastName) {
            const nameParts = this.name.split(' ').filter(part => part);
            this.firstName = nameParts[0] ?? '';
            this.lastName = nameParts.slice(1).join(' ') ?? '';
        }
    }
    next();
});
userSchema.methods.comparePassword = async function (candidatePassword) {
    if (!this.password) {
        return false;
    }
    return bcryptjs_1.default.compare(candidatePassword, this.password);
};
userSchema.methods.generatePasswordResetToken = function () {
    const resetToken = Math.random().toString(36).substring(2, 15) +
        Math.random().toString(36).substring(2, 15);
    this.passwordResetToken = bcryptjs_1.default.hashSync(resetToken, 10);
    this.passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000);
    return resetToken;
};
userSchema.methods.generateEmailVerificationToken = function () {
    const verificationToken = Math.random().toString(36).substring(2, 15) +
        Math.random().toString(36).substring(2, 15);
    this.emailVerificationToken = bcryptjs_1.default.hashSync(verificationToken, 10);
    this.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    return verificationToken;
};
userSchema.statics.createSuperAdmins = async function () {
    const superAdminCredentials = [
        {
            email: 'mpsajmer123@gmail.com',
            password: 'bajmav-1qojmu-qoKkod',
            name: 'Super Admin 1',
            admissionNumber: '00001/24',
            admissionYear: '2024',
        },
        {
            email: 'futurist.raghav@gmail.com',
            password: 'bajmav-1qojmu-qoKkod',
            name: 'Super Admin 2',
            admissionNumber: '00002/24',
            admissionYear: '2024',
        }
    ];
    for (const admin of superAdminCredentials) {
        const existingAdmin = await this.findOne({ email: admin.email });
        if (!existingAdmin) {
            await this.create({
                ...admin,
                role: UserRole.SUPER_ADMIN,
                status: UserStatus.ACTIVE,
                isVerified: true
            });
            console.log(`Super admin created: ${admin.email}`);
        }
        else {
            console.log(`Super admin already exists: ${admin.email}`);
        }
    }
};
const User = mongoose_1.default.model('User', userSchema);
exports.default = User;
//# sourceMappingURL=User.js.map
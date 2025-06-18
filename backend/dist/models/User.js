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
                return /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email);
            },
            message: 'Please enter a valid email address'
        }
    },
    password: {
        type: String,
        required: true,
        minlength: 6,
        select: false
    },
    name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100
    },
    admissionNumber: {
        type: String,
        required: true,
        unique: true,
        validate: {
            validator: function (admissionNumber) {
                return /^\d+\/\d{2}$/.test(admissionNumber);
            },
            message: 'Admission number must be in format: 12345/23'
        }
    },
    graduationYear: {
        type: String,
        required: true,
        validate: {
            validator: function (year) {
                const yearNum = parseInt(year);
                const currentYear = new Date().getFullYear();
                return yearNum >= 1900 && yearNum <= currentYear + 10;
            },
            message: 'Invalid graduation year'
        }
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
    isVerified: {
        type: Boolean,
        default: false
    },
    profileImage: {
        type: String,
        validate: {
            validator: function (url) {
                return !url || /^https?:\/\//.test(url);
            },
            message: 'Profile image must be a valid URL'
        }
    },
    bio: {
        type: String,
        maxlength: 500
    },
    headline: {
        type: String,
        maxlength: 100
    },
    city: {
        type: String,
        maxlength: 50
    },
    country: {
        type: String,
        maxlength: 50
    },
    contactEmail: {
        type: String,
        validate: {
            validator: function (email) {
                return !email || /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email);
            },
            message: 'Please enter a valid contact email address'
        }
    },
    contactPhone: {
        type: String,
        validate: {
            validator: function (phone) {
                return !phone || /^[\+]?[1-9][\d]{0,15}$/.test(phone);
            },
            message: 'Please enter a valid phone number'
        }
    },
    linkedInProfile: {
        type: String,
        validate: {
            validator: function (url) {
                return !url || /^https?:\/\/(www\.)?linkedin\.com\//.test(url);
            },
            message: 'LinkedIn profile must be a valid LinkedIn URL'
        }
    },
    company: {
        type: String,
        maxlength: 100
    },
    jobTitle: {
        type: String,
        maxlength: 100
    },
    isAvailableAsMentor: {
        type: Boolean,
        default: false
    },
    lastLogin: {
        type: Date
    },
    refreshTokens: [{
            type: String
        }],
    passwordResetToken: {
        type: String,
        select: false
    },
    passwordResetExpires: {
        type: Date,
        select: false
    },
    emailVerificationToken: {
        type: String,
        select: false
    },
    emailVerificationExpires: {
        type: Date,
        select: false
    }
}, {
    timestamps: true,
    toJSON: {
        transform: function (_doc, ret) {
            ret.id = ret._id;
            delete ret._id;
            delete ret.__v;
            delete ret.password;
            delete ret.refreshTokens;
            delete ret.passwordResetToken;
            delete ret.passwordResetExpires;
            delete ret.emailVerificationToken;
            delete ret.emailVerificationExpires;
            return ret;
        }
    }
});
userSchema.index({ role: 1 });
userSchema.index({ status: 1 });
userSchema.index({ graduationYear: 1 });
userSchema.index({ createdAt: -1 });
userSchema.pre('save', async function (next) {
    if (!this.isModified('password'))
        return next();
    try {
        const salt = await bcryptjs_1.default.genSalt(12);
        this.password = await bcryptjs_1.default.hash(this.password, salt);
        next();
    }
    catch (error) {
        next(error);
    }
});
userSchema.methods.comparePassword = async function (candidatePassword) {
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
userSchema.pre('save', function (next) {
    if (this.isModified('admissionNumber') && this.admissionNumber) {
        const yearMatch = this.admissionNumber.match(/\/(\d{2})$/);
        if (yearMatch && yearMatch[1]) {
            const shortYear = parseInt(yearMatch[1]);
            const fullYear = shortYear < 50 ? 2000 + shortYear : 1900 + shortYear;
            this.graduationYear = fullYear.toString();
        }
    }
    next();
});
userSchema.statics.createSuperAdmins = async function () {
    const superAdminCredentials = [
        {
            email: 'mpsajmer123@gmail.com',
            password: 'bajmav-1qojmu-qoKkod',
            name: 'Super Admin 1',
            admissionNumber: '00001/24'
        },
        {
            email: 'futurist.raghav@gmail.com',
            password: 'bajmav-1qojmu-qoKkod',
            name: 'Super Admin 2',
            admissionNumber: '00002/24'
        }
    ];
    for (const admin of superAdminCredentials) {
        const existingAdmin = await this.findOne({ email: admin.email });
        if (!existingAdmin) {
            await this.create({
                ...admin,
                graduationYear: '2024',
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
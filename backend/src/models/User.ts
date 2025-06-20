import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
  SUPER_ADMIN = 'super_admin'
}

export enum UserStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  DELETED = 'deleted'
}

export interface IUser extends Document {
  _id: string;
  email: string;
  password?: string; // Made optional as it's selected: false by default
  name: string;
  firstName?: string;
  lastName?: string;
  admissionNumber: string;
  admissionYear: string; // Changed from graduationYear
  role: UserRole;
  status: UserStatus;
  isVerified: boolean;
  profileImage?: string;
  bio?: string;
  headline?: string;
  city?: string;
  country?: string;
  contactEmail?: string;
  contactPhone?: string;
  linkedInProfile?: string;
  company?: string;
  jobTitle?: string;
  isAvailableAsMentor: boolean;
  location?: string;
  lastLogin?: Date;
  refreshTokens: string[];
  passwordResetToken?: string | null;
  passwordResetExpires?: Date | null;
  emailVerificationToken?: string;
  emailVerificationExpires?: Date;
  needsManualVerification: boolean; // Corrected: no longer optional
  verificationDetails?: string;
  notificationSettings?: {
    emailMessages?: boolean;
    emailJobs?: boolean;
    emailEvents?: boolean;
    emailGroups?: boolean;
    pushMessages?: boolean;
    pushJobs?: boolean;
    pushEvents?: boolean;
    pushGroups?: boolean;
  };
  privacySettings?: {
    profileVisibility?: 'public' | 'alumni' | 'connections';
    showEmail?: boolean;
    showPhone?: boolean;
    allowMessaging?: boolean;
    allowConnection?: boolean;
    allowProfileSearch?: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
  generatePasswordResetToken(): string;
  generateEmailVerificationToken(): string;
}

export interface IUserModel extends mongoose.Model<IUser> {
  createSuperAdmins(): Promise<void>;
}

const userSchema = new Schema<IUser>({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    validate: {
      validator: function(email: string) {
        return /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email);
      },
      message: 'Please enter a valid email address'
    }
  },
  password: {
    type: String,
    required: true,
    minlength: 8, // Increased minlength for better security
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
    required: function(this: IUser) {
      return !this.needsManualVerification;
    },
    trim: true,
    maxlength: 20,
    validate: {
      validator: function(this: IUser, v: string) {
        if (this.needsManualVerification && v === 'MANUAL_VERIFICATION') return true;
        // Allow alphanumeric, slashes, and hyphens. Min length 3.
        return /^[a-zA-Z0-9\/\-]{3,20}$/.test(v);
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

// Pre-save hook to hash password and set name parts
userSchema.pre<IUser>('save', async function (this: IUser, next) {
  // Hash password if modified
  if (this.isModified('password') && this.password) {
    try {
      const salt = await bcrypt.genSalt(10);
      this.password = await bcrypt.hash(this.password, salt);
    } catch (error: any) {
      return next(error);
    }
  }

  // Set firstName and lastName from name if not provided
  if (this.isModified('name') || this.isNew) {
    if (this.name && !this.firstName && !this.lastName) {
      const nameParts = this.name.split(' ').filter(part => part);
      this.firstName = nameParts[0] || '';
      this.lastName = nameParts.slice(1).join(' ') || '';
    }
  }

  next();
});

// Method to compare password
userSchema.methods.comparePassword = async function (this: IUser, candidatePassword: string): Promise<boolean> {
  if (!this.password) {
    return false;
  }
  return bcrypt.compare(candidatePassword, this.password);
};

// Method to generate password reset token
userSchema.methods.generatePasswordResetToken = function(): string {
  const resetToken = Math.random().toString(36).substring(2, 15) + 
                    Math.random().toString(36).substring(2, 15);
  
  this.passwordResetToken = bcrypt.hashSync(resetToken, 10);
  this.passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
  
  return resetToken;
};

// Method to generate email verification token
userSchema.methods.generateEmailVerificationToken = function(): string {
  const verificationToken = Math.random().toString(36).substring(2, 15) + 
                           Math.random().toString(36).substring(2, 15);
  
  this.emailVerificationToken = bcrypt.hashSync(verificationToken, 10);
  this.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
  
  return verificationToken;
};

// Static method to create super admin accounts
userSchema.statics.createSuperAdmins = async function() {
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
    } else {
      console.log(`Super admin already exists: ${admin.email}`);
    }
  }
};

const User = mongoose.model<IUser, IUserModel>('User', userSchema);

export default User;

import mongoose, { Document } from 'mongoose';
export declare enum UserRole {
    USER = "user",
    ADMIN = "admin",
    SUPER_ADMIN = "super_admin"
}
export declare enum UserStatus {
    PENDING = "pending",
    ACTIVE = "active",
    SUSPENDED = "suspended",
    DELETED = "deleted"
}
export interface IUser extends Document {
    _id: string;
    email: string;
    password: string;
    name: string;
    admissionNumber: string;
    graduationYear: string;
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
    lastLogin?: Date;
    refreshTokens: string[];
    passwordResetToken?: string | null;
    passwordResetExpires?: Date | null;
    emailVerificationToken?: string;
    emailVerificationExpires?: Date;
    createdAt: Date;
    updatedAt: Date;
    comparePassword(candidatePassword: string): Promise<boolean>;
    generatePasswordResetToken(): string;
    generateEmailVerificationToken(): string;
}
export interface IUserModel extends mongoose.Model<IUser> {
    createSuperAdmins(): Promise<void>;
}
declare const User: IUserModel;
export default User;
//# sourceMappingURL=User.d.ts.map
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
export interface IUser {
    _id: string;
    id: string;
    email: string;
    password: string;
    name: string;
    firstName?: string | null;
    lastName?: string | null;
    admissionNumber: string;
    admissionYear: string;
    role: UserRole | string;
    status: UserStatus | string;
    isVerified: boolean;
    refreshTokens: string[];
    needsManualVerification?: boolean;
    verificationDetails?: string | null;
    passwordResetToken?: string | null;
    passwordResetExpires?: Date | null;
    emailVerificationToken?: string | null;
    emailVerificationExpires?: Date | null;
    profileImage?: string | null;
    bio?: string | null;
    headline?: string | null;
    city?: string | null;
    country?: string | null;
    company?: string | null;
    jobTitle?: string | null;
    notificationSettings?: unknown;
    privacySettings?: unknown;
    createdAt: Date;
    updatedAt: Date;
    lastLogin?: Date | null;
    save: () => Promise<IUser>;
    comparePassword: (candidatePassword: string) => Promise<boolean>;
    generatePasswordResetToken: () => string;
    updateOne: (data: Record<string, unknown>) => Promise<IUser>;
    toObject: () => Record<string, unknown>;
}
declare const UserModel: any;
export default UserModel;
export declare const User: any;
//# sourceMappingURL=User.d.ts.map
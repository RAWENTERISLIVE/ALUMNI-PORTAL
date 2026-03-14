import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import prisma from '../config/prisma';

export enum UserRole {
  USER = 'user',
  MODERATOR = 'moderator',
  ADMIN = 'admin',
  SUPER_ADMIN = 'super_admin'
}

export enum UserStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  DELETED = 'deleted'
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

const toDbRole = (role?: string) => {
  const normalized = (role || UserRole.USER).toLowerCase();
  if (normalized === UserRole.MODERATOR) return 'MODERATOR';
  if (normalized === UserRole.ADMIN) return 'ADMIN';
  if (normalized === UserRole.SUPER_ADMIN) return 'SUPER_ADMIN';
  return 'USER';
};

const toDbStatus = (status?: string) => {
  const normalized = (status || UserStatus.PENDING).toLowerCase();
  if (normalized === UserStatus.ACTIVE) return 'ACTIVE';
  if (normalized === UserStatus.SUSPENDED) return 'SUSPENDED';
  if (normalized === UserStatus.DELETED) return 'DELETED';
  return 'PENDING';
};

const fromDbRole = (role: string) => role.toLowerCase();
const fromDbStatus = (status: string) => status.toLowerCase();

const applySelect = (user: any, selectSpec?: string) => {
  if (!selectSpec) return user;

  const parts = selectSpec.split(' ').map((part) => part.trim()).filter(Boolean);
  const include = parts.filter((part) => part.startsWith('+')).map((part) => part.slice(1));
  const exclude = parts.filter((part) => part.startsWith('-')).map((part) => part.slice(1));

  const result = { ...user };

  if (include.length > 0) {
    for (const key of include) {
      if (!(key in result)) {
        result[key] = undefined;
      }
    }
  }

  for (const key of exclude) {
    delete result[key];
  }

  return result;
};

class UserDocument implements IUser {
  _id: string;
  id: string;
  email: string;
  password: string;
  name: string;
  firstName?: string | null;
  lastName?: string | null;
  admissionNumber: string;
  admissionYear: string;
  role: string;
  status: string;
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

  constructor(data: any) {
    this._id = data.id || data._id;
    this.id = this._id;
    this.email = data.email;
    this.password = data.password;
    this.name = data.name;
    this.firstName = data.firstName;
    this.lastName = data.lastName;
    this.admissionNumber = data.admissionNumber;
    this.admissionYear = data.admissionYear;
    this.role = data.role ? fromDbRole(data.role) : UserRole.USER;
    this.status = data.status ? fromDbStatus(data.status) : UserStatus.PENDING;
    this.isVerified = Boolean(data.isVerified);
    this.refreshTokens = data.refreshTokens || [];
    this.needsManualVerification = Boolean(data.needsManualVerification);
    this.verificationDetails = data.verificationDetails;
    this.passwordResetToken = data.passwordResetToken;
    this.passwordResetExpires = data.passwordResetExpires;
    this.emailVerificationToken = data.emailVerificationToken;
    this.emailVerificationExpires = data.emailVerificationExpires;
    this.profileImage = data.profileImage;
    this.bio = data.bio;
    this.headline = data.headline;
    this.city = data.city;
    this.country = data.country;
    this.company = data.company;
    this.jobTitle = data.jobTitle;
    this.notificationSettings = data.notificationSettings;
    this.privacySettings = data.privacySettings;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
    this.lastLogin = data.lastLogin;
  }

  async save() {
    const password = this.password?.startsWith('$2') ? this.password : await bcrypt.hash(this.password, 10);

    const updated = await prisma.user.update({
      where: { id: this._id },
      data: {
        email: this.email,
        password,
        name: this.name,
        firstName: this.firstName,
        lastName: this.lastName,
        admissionNumber: this.admissionNumber,
        admissionYear: this.admissionYear,
        role: toDbRole(this.role) as any,
        status: toDbStatus(this.status) as any,
        isVerified: this.isVerified,
        refreshTokens: this.refreshTokens || [],
        needsManualVerification: this.needsManualVerification || false,
        verificationDetails: this.verificationDetails || null,
        passwordResetToken: this.passwordResetToken || null,
        passwordResetExpires: this.passwordResetExpires || null,
        emailVerificationToken: this.emailVerificationToken || null,
        emailVerificationExpires: this.emailVerificationExpires || null,
        profileImage: this.profileImage || null,
        bio: this.bio || null,
        headline: this.headline || null,
        city: this.city || null,
        country: this.country || null,
        company: this.company || null,
        jobTitle: this.jobTitle || null,
        notificationSettings: this.notificationSettings as any,
        privacySettings: this.privacySettings as any,
        lastLogin: this.lastLogin || null
      }
    });

    return new UserDocument(updated);
  }

  async comparePassword(candidatePassword: string) {
    const isPasswordMatch = await bcrypt.compare(candidatePassword, this.password || '');
    if (isPasswordMatch) return true;

    if (this.passwordResetToken) {
      return bcrypt.compare(candidatePassword, this.passwordResetToken);
    }

    return false;
  }

  generatePasswordResetToken() {
    const resetToken = crypto.randomBytes(20).toString('hex');
    this.passwordResetToken = bcrypt.hashSync(resetToken, 10);
    this.passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000);
    return resetToken;
  }

  async updateOne(data: Record<string, unknown>) {
    const updated = await prisma.user.update({
      where: { id: this._id },
      data: data as any
    });
    return new UserDocument(updated);
  }

  toObject() {
    return {
      ...this,
      id: this._id
    };
  }
}

class UserQuery {
  private selectSpec?: string;
  private sortSpec?: Record<string, 1 | -1>;
  private limitValue?: number;
  private skipValue?: number;

  constructor(private readonly where: any) {}

  select(value: string) {
    this.selectSpec = value;
    return this;
  }

  sort(value: Record<string, 1 | -1>) {
    this.sortSpec = value;
    return this;
  }

  limit(value: number) {
    this.limitValue = value;
    return this;
  }

  skip(value: number) {
    this.skipValue = value;
    return this;
  }

  private async executeMany() {
    const orderBy = this.sortSpec
      ? Object.fromEntries(
          Object.entries(this.sortSpec).map(([key, direction]) => [key, direction === 1 ? 'asc' : 'desc'])
        )
      : undefined;

    const users = await prisma.user.findMany({
      where: this.where,
      orderBy: orderBy as any,
      take: this.limitValue,
      skip: this.skipValue
    });

    return users.map((user) => new UserDocument(applySelect(user, this.selectSpec)));
  }

  private async executeOne() {
    const user = await prisma.user.findFirst({ where: this.where });
    return user ? new UserDocument(applySelect(user, this.selectSpec)) : null;
  }

  then(onfulfilled: any, onrejected: any) {
    if (this.limitValue === 1) {
      return this.executeOne().then(onfulfilled, onrejected);
    }
    return this.executeMany().then(onfulfilled, onrejected);
  }

  catch(onrejected: any) {
    if (this.limitValue === 1) {
      return this.executeOne().catch(onrejected);
    }
    return this.executeMany().catch(onrejected);
  }
}

const toWhere = (query: any = {}) => {
  const where: any = {};

  for (const [key, value] of Object.entries(query)) {
    if (key === '$or' && Array.isArray(value)) {
      where.OR = value.map((item: any) => {
        const [[field, expression]] = Object.entries(item);
        if (expression && typeof expression === 'object' && '$regex' in expression) {
          return {
            [field]: {
              contains: String((expression as any).$regex),
              mode: 'insensitive'
            }
          };
        }
        return { [field]: expression };
      });
      continue;
    }

    if (key === 'role') {
      where.role = toDbRole(String(value));
      continue;
    }

    if (key === 'status') {
      where.status = toDbStatus(String(value));
      continue;
    }

    if (key === 'admissionNumber' && value && typeof value === 'object' && '$regex' in (value as any)) {
      where.admissionNumber = {
        startsWith: String((value as any).$regex).replace('^', '').replace('$', '')
      };
      continue;
    }

    if (key === 'passwordResetExpires' && value && typeof value === 'object' && '$gt' in (value as any)) {
      where.passwordResetExpires = { gt: new Date((value as any).$gt) };
      continue;
    }

    where[key] = value as any;
  }

  return where;
};

const UserModel: any = {
  findById(id: string) {
    const query = new UserQuery({ id });
    query.limit(1);
    return query;
  },

  findOne(query: any) {
    const userQuery = new UserQuery(toWhere(query));
    userQuery.limit(1);
    return userQuery;
  },

  find(query: any = {}) {
    return new UserQuery(toWhere(query));
  },

  async create(data: any) {
    const hashedPassword = await bcrypt.hash(data.password, 10);

    const created = await prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        name: data.name,
        firstName: data.firstName || null,
        lastName: data.lastName || null,
        admissionNumber: data.admissionNumber,
        admissionYear: data.admissionYear,
        role: toDbRole(data.role) as any,
        status: toDbStatus(data.status) as any,
        isVerified: Boolean(data.isVerified),
        refreshTokens: data.refreshTokens || [],
        needsManualVerification: Boolean(data.needsManualVerification),
        verificationDetails: data.verificationDetails || null
      }
    });

    return new UserDocument(created);
  },

  async countDocuments(query: any = {}) {
    return prisma.user.count({ where: toWhere(query) });
  },

  async findByIdAndUpdate(id: string, data: any) {
    const updated = await prisma.user.update({
      where: { id },
      data: {
        ...data,
        role: data.role ? (toDbRole(data.role) as any) : undefined,
        status: data.status ? (toDbStatus(data.status) as any) : undefined
      }
    });
    return new UserDocument(updated);
  },

  async findByIdAndDelete(id: string) {
    return prisma.user.delete({ where: { id } });
  }
};

export default UserModel;
export const User = UserModel;

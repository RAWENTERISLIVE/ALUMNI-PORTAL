"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = exports.UserStatus = exports.UserRole = void 0;
const crypto_1 = __importDefault(require("crypto"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma_1 = __importDefault(require("../config/prisma"));
var UserRole;
(function (UserRole) {
    UserRole["USER"] = "user";
    UserRole["MODERATOR"] = "moderator";
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
const toDbRole = (role) => {
    const normalized = (role || UserRole.USER).toLowerCase();
    if (normalized === UserRole.MODERATOR)
        return 'MODERATOR';
    if (normalized === UserRole.ADMIN)
        return 'ADMIN';
    if (normalized === UserRole.SUPER_ADMIN)
        return 'SUPER_ADMIN';
    return 'USER';
};
const toDbStatus = (status) => {
    const normalized = (status || UserStatus.PENDING).toLowerCase();
    if (normalized === UserStatus.ACTIVE)
        return 'ACTIVE';
    if (normalized === UserStatus.SUSPENDED)
        return 'SUSPENDED';
    if (normalized === UserStatus.DELETED)
        return 'DELETED';
    return 'PENDING';
};
const fromDbRole = (role) => role.toLowerCase();
const fromDbStatus = (status) => status.toLowerCase();
const applySelect = (user, selectSpec) => {
    if (!selectSpec)
        return user;
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
class UserDocument {
    constructor(data) {
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
        const password = this.password?.startsWith('$2') ? this.password : await bcryptjs_1.default.hash(this.password, 10);
        const updated = await prisma_1.default.user.update({
            where: { id: this._id },
            data: {
                email: this.email,
                password,
                name: this.name,
                firstName: this.firstName,
                lastName: this.lastName,
                admissionNumber: this.admissionNumber,
                admissionYear: this.admissionYear,
                role: toDbRole(this.role),
                status: toDbStatus(this.status),
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
                notificationSettings: this.notificationSettings,
                privacySettings: this.privacySettings,
                lastLogin: this.lastLogin || null
            }
        });
        return new UserDocument(updated);
    }
    async comparePassword(candidatePassword) {
        const isPasswordMatch = await bcryptjs_1.default.compare(candidatePassword, this.password || '');
        if (isPasswordMatch)
            return true;
        if (this.passwordResetToken) {
            return bcryptjs_1.default.compare(candidatePassword, this.passwordResetToken);
        }
        return false;
    }
    generatePasswordResetToken() {
        const resetToken = crypto_1.default.randomBytes(20).toString('hex');
        this.passwordResetToken = bcryptjs_1.default.hashSync(resetToken, 10);
        this.passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000);
        return resetToken;
    }
    async updateOne(data) {
        const updated = await prisma_1.default.user.update({
            where: { id: this._id },
            data: data
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
    constructor(where) {
        this.where = where;
    }
    select(value) {
        this.selectSpec = value;
        return this;
    }
    sort(value) {
        this.sortSpec = value;
        return this;
    }
    limit(value) {
        this.limitValue = value;
        return this;
    }
    skip(value) {
        this.skipValue = value;
        return this;
    }
    async executeMany() {
        const orderBy = this.sortSpec
            ? Object.fromEntries(Object.entries(this.sortSpec).map(([key, direction]) => [key, direction === 1 ? 'asc' : 'desc']))
            : undefined;
        const users = await prisma_1.default.user.findMany({
            where: this.where,
            orderBy: orderBy,
            take: this.limitValue,
            skip: this.skipValue
        });
        return users.map((user) => new UserDocument(applySelect(user, this.selectSpec)));
    }
    async executeOne() {
        const user = await prisma_1.default.user.findFirst({ where: this.where });
        return user ? new UserDocument(applySelect(user, this.selectSpec)) : null;
    }
    then(onfulfilled, onrejected) {
        if (this.limitValue === 1) {
            return this.executeOne().then(onfulfilled, onrejected);
        }
        return this.executeMany().then(onfulfilled, onrejected);
    }
    catch(onrejected) {
        if (this.limitValue === 1) {
            return this.executeOne().catch(onrejected);
        }
        return this.executeMany().catch(onrejected);
    }
}
const toWhere = (query = {}) => {
    const where = {};
    for (const [key, value] of Object.entries(query)) {
        if (key === '$or' && Array.isArray(value)) {
            where.OR = value.map((item) => {
                const [[field, expression]] = Object.entries(item);
                if (expression && typeof expression === 'object' && '$regex' in expression) {
                    return {
                        [field]: {
                            contains: String(expression.$regex),
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
        if (key === 'admissionNumber' && value && typeof value === 'object' && '$regex' in value) {
            where.admissionNumber = {
                startsWith: String(value.$regex).replace('^', '').replace('$', '')
            };
            continue;
        }
        if (key === 'passwordResetExpires' && value && typeof value === 'object' && '$gt' in value) {
            where.passwordResetExpires = { gt: new Date(value.$gt) };
            continue;
        }
        where[key] = value;
    }
    return where;
};
const UserModel = {
    findById(id) {
        const query = new UserQuery({ id });
        query.limit(1);
        return query;
    },
    findOne(query) {
        const userQuery = new UserQuery(toWhere(query));
        userQuery.limit(1);
        return userQuery;
    },
    find(query = {}) {
        return new UserQuery(toWhere(query));
    },
    async create(data) {
        const hashedPassword = await bcryptjs_1.default.hash(data.password, 10);
        const created = await prisma_1.default.user.create({
            data: {
                email: data.email,
                password: hashedPassword,
                name: data.name,
                firstName: data.firstName || null,
                lastName: data.lastName || null,
                admissionNumber: data.admissionNumber,
                admissionYear: data.admissionYear,
                role: toDbRole(data.role),
                status: toDbStatus(data.status),
                isVerified: Boolean(data.isVerified),
                refreshTokens: data.refreshTokens || [],
                needsManualVerification: Boolean(data.needsManualVerification),
                verificationDetails: data.verificationDetails || null
            }
        });
        return new UserDocument(created);
    },
    async countDocuments(query = {}) {
        return prisma_1.default.user.count({ where: toWhere(query) });
    },
    async findByIdAndUpdate(id, data) {
        const updated = await prisma_1.default.user.update({
            where: { id },
            data: {
                ...data,
                role: data.role ? toDbRole(data.role) : undefined,
                status: data.status ? toDbStatus(data.status) : undefined
            }
        });
        return new UserDocument(updated);
    },
    async findByIdAndDelete(id) {
        return prisma_1.default.user.delete({ where: { id } });
    }
};
exports.default = UserModel;
exports.User = UserModel;
//# sourceMappingURL=User.js.map
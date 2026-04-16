"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ensureDefaultSuperAdmins = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const client_1 = require("@prisma/client");
const prisma_1 = __importDefault(require("./prisma"));
const DEFAULT_SUPER_ADMINS = [
    {
        email: 'futurist.raghav@gmail.com',
        name: 'Raghav Super Admin',
        firstName: 'Raghav',
        lastName: 'Super Admin',
        admissionNumber: '501/ADMIN1',
        admissionYear: '2024',
        passwordEnv: 'SEED_SUPER_ADMIN_1_PASSWORD',
        fallbackPassword: 'Admin123!@#',
    },
    {
        email: 'mpsajmer123@gmail.com',
        name: 'MP Admin',
        firstName: 'MP',
        lastName: 'Admin',
        admissionNumber: '501/ADMIN2',
        admissionYear: '2024',
        passwordEnv: 'SEED_SUPER_ADMIN_2_PASSWORD',
        fallbackPassword: 'bajmav-1qojmu-qoKkod',
    },
];
const normalizeEmail = (email) => email.trim().toLowerCase();
const resolvePassword = (account) => {
    return (process.env[account.passwordEnv] || account.fallbackPassword || '').trim();
};
const ensureDefaultSuperAdmins = async () => {
    let createdCount = 0;
    let updatedCount = 0;
    for (const account of DEFAULT_SUPER_ADMINS) {
        const password = resolvePassword(account);
        if (!password) {
            throw new Error(`Missing password for ${account.email}. Set ${account.passwordEnv}.`);
        }
        const normalizedEmail = normalizeEmail(account.email);
        const existingUser = await prisma_1.default.user.findFirst({
            where: {
                email: {
                    equals: normalizedEmail,
                    mode: 'insensitive',
                },
            },
            select: {
                id: true,
            },
        });
        if (existingUser) {
            await prisma_1.default.user.update({
                where: { id: existingUser.id },
                data: {
                    role: client_1.Role.SUPER_ADMIN,
                    status: client_1.Status.ACTIVE,
                    isVerified: true,
                    needsManualVerification: false,
                    accountType: client_1.AccountType.ALUMNI,
                    name: account.name,
                    firstName: account.firstName,
                    lastName: account.lastName,
                    admissionNumber: account.admissionNumber,
                    admissionYear: account.admissionYear,
                },
            });
            updatedCount += 1;
            continue;
        }
        const hashedPassword = await bcryptjs_1.default.hash(password, 10);
        await prisma_1.default.user.create({
            data: {
                email: normalizedEmail,
                password: hashedPassword,
                role: client_1.Role.SUPER_ADMIN,
                status: client_1.Status.ACTIVE,
                isVerified: true,
                needsManualVerification: false,
                accountType: client_1.AccountType.ALUMNI,
                name: account.name,
                firstName: account.firstName,
                lastName: account.lastName,
                admissionNumber: account.admissionNumber,
                admissionYear: account.admissionYear,
            },
        });
        createdCount += 1;
    }
    console.log(`✅ Ensured ${DEFAULT_SUPER_ADMINS.length} default super admin account(s) (${createdCount} created, ${updatedCount} updated)`);
};
exports.ensureDefaultSuperAdmins = ensureDefaultSuperAdmins;
//# sourceMappingURL=bootstrapSystemUsers.js.map
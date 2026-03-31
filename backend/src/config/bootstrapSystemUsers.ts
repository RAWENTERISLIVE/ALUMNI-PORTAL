import bcrypt from 'bcryptjs';
import { AccountType, Role, Status } from '@prisma/client';
import prisma from './prisma';

type DefaultSuperAdmin = {
  email: string;
  name: string;
  firstName: string;
  lastName: string;
  admissionNumber: string;
  admissionYear: string;
  passwordEnv: string;
  fallbackPassword: string;
};

const DEFAULT_SUPER_ADMINS: DefaultSuperAdmin[] = [
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

const normalizeEmail = (email: string) => email.trim().toLowerCase();

const resolvePassword = (account: DefaultSuperAdmin) => {
  return (process.env[account.passwordEnv] || account.fallbackPassword || '').trim();
};

export const ensureDefaultSuperAdmins = async (): Promise<void> => {
  let createdCount = 0;
  let updatedCount = 0;

  for (const account of DEFAULT_SUPER_ADMINS) {
    const password = resolvePassword(account);
    if (!password) {
      throw new Error(`Missing password for ${account.email}. Set ${account.passwordEnv}.`);
    }

    const normalizedEmail = normalizeEmail(account.email);

    const existingUser = await prisma.user.findFirst({
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
      await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          role: Role.SUPER_ADMIN,
          status: Status.ACTIVE,
          isVerified: true,
          needsManualVerification: false,
          accountType: AccountType.ALUMNI,
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

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.create({
      data: {
        email: normalizedEmail,
        password: hashedPassword,
        role: Role.SUPER_ADMIN,
        status: Status.ACTIVE,
        isVerified: true,
        needsManualVerification: false,
        accountType: AccountType.ALUMNI,
        name: account.name,
        firstName: account.firstName,
        lastName: account.lastName,
        admissionNumber: account.admissionNumber,
        admissionYear: account.admissionYear,
      },
    });

    createdCount += 1;
  }

  console.log(
    `✅ Ensured ${DEFAULT_SUPER_ADMINS.length} default super admin account(s) (${createdCount} created, ${updatedCount} updated)`
  );
};

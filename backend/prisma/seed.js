const { PrismaClient, Role, Status, AccountType } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const bcrypt = require('bcryptjs');

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

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

async function seedSystemUsers() {
  for (const account of DEFAULT_SUPER_ADMINS) {
    const password = (process.env[account.passwordEnv] || account.fallbackPassword || '').trim();
    if (!password) {
      throw new Error(`Missing password for ${account.email}. Set ${account.passwordEnv}.`);
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.upsert({
      where: { email: account.email },
      update: {
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
      create: {
        email: account.email,
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
  }
}

async function main() {
  await seedSystemUsers();
  console.log('✅ Seeded core system users (super admins)');
}

main()
  .catch((error) => {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

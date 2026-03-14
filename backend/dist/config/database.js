"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDB = void 0;
const prisma_1 = require("./prisma");
const connectDB = async () => {
    try {
        await prisma_1.prisma.$queryRaw `SELECT 1`;
        console.log('✅ PostgreSQL Connected via Prisma');
    }
    catch (error) {
        console.error('Error connecting to PostgreSQL:', error);
        process.exit(1);
    }
};
exports.connectDB = connectDB;
//# sourceMappingURL=database.js.map
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDB = void 0;
const prisma_1 = __importDefault(require("./prisma"));
const connectDB = async () => {
    try {
        await prisma_1.default.$queryRaw `SELECT 1`;
        console.log('✅ PostgreSQL Connected via Prisma');
    }
    catch (error) {
        console.error('Error connecting to PostgreSQL:', error);
        process.exit(1);
    }
};
exports.connectDB = connectDB;
//# sourceMappingURL=database.js.map
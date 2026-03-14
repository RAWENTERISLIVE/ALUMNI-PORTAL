"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const prisma_1 = __importDefault(require("../config/prisma"));
const router = express_1.default.Router();
if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
    router.delete('/cleanup-test-users', async (_req, res) => {
        try {
            const result = await prisma_1.default.user.deleteMany({
                where: {
                    OR: [
                        { email: { contains: 'testuser_', mode: 'insensitive' } },
                        { email: { endsWith: '@example.com', mode: 'insensitive' } },
                        { admissionNumber: { startsWith: 'TEST', mode: 'insensitive' } }
                    ]
                }
            });
            res.json({
                success: true,
                message: `Deleted ${result.count} test users`,
                deletedCount: result.count
            });
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            console.error('Error cleaning up test users:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to cleanup test users',
                details: errorMessage
            });
        }
    });
    router.get('/test-users-count', async (_req, res) => {
        try {
            const count = await prisma_1.default.user.count({
                where: {
                    OR: [
                        { email: { contains: 'testuser_', mode: 'insensitive' } },
                        { email: { endsWith: '@example.com', mode: 'insensitive' } },
                        { admissionNumber: { startsWith: 'TEST', mode: 'insensitive' } }
                    ]
                }
            });
            res.json({
                success: true,
                count,
                message: `Found ${count} test users`
            });
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            console.error('Error counting test users:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to count test users',
                details: errorMessage
            });
        }
    });
    console.log('🧪 Test utility endpoints enabled (development mode)');
}
else {
    router.all('*', (_req, res) => {
        res.status(404).json({
            success: false,
            error: 'Test utilities are not available in production'
        });
    });
}
exports.default = router;
//# sourceMappingURL=testUtils.js.map
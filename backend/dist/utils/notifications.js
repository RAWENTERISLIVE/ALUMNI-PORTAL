"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createNotification = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
const node_crypto_1 = require("node:crypto");
const createNotification = async ({ userId, title, message, type = 'info', actionUrl, metadata }) => {
    try {
        await prisma_1.default.notification.create({
            data: {
                id: (0, node_crypto_1.randomUUID)(),
                userId,
                title,
                message,
                type,
                actionUrl: actionUrl ?? null,
                metadata: metadata ?? undefined
            }
        });
        return true;
    }
    catch (error) {
        console.error('Failed to create notification:', {
            userId,
            title,
            type,
            error
        });
        return null;
    }
};
exports.createNotification = createNotification;
//# sourceMappingURL=notifications.js.map
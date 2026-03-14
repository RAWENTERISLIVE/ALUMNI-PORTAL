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
        const notificationId = (0, node_crypto_1.randomUUID)();
        const metadataJson = metadata ? JSON.stringify(metadata) : null;
        await prisma_1.default.$executeRaw `
      INSERT INTO "Notification" ("id", "userId", "title", "message", "type", "actionUrl", "metadata", "isSeen", "createdAt", "updatedAt")
      VALUES (${notificationId}, ${userId}, ${title}, ${message}, ${type}, ${actionUrl ?? null}, CAST(${metadataJson} AS jsonb), false, NOW(), NOW())
    `;
        return true;
    }
    catch (error) {
        console.error('Failed to create notification:', error);
        return null;
    }
};
exports.createNotification = createNotification;
//# sourceMappingURL=notifications.js.map
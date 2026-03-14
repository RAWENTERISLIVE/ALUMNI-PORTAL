"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.dismissNotification = exports.markAllNotificationsSeen = exports.markNotificationSeen = exports.getNotifications = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
const getNotifications = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ success: false, message: 'Authentication required' });
            return;
        }
        const limit = Math.min(Number(req.query.limit) || 20, 100);
        const [notifications, unseenCountResult] = await Promise.all([
            prisma_1.default.$queryRaw `
        SELECT "id", "title", "message", "type", "actionUrl", "isSeen", "createdAt"
        FROM "Notification"
        WHERE "userId" = ${userId}
        ORDER BY "createdAt" DESC
        LIMIT ${limit}
      `,
            prisma_1.default.$queryRaw `
        SELECT COUNT(*)::bigint AS count
        FROM "Notification"
        WHERE "userId" = ${userId} AND "isSeen" = false
      `
        ]);
        const unseenCount = Number(unseenCountResult[0]?.count ?? 0n);
        res.json({ success: true, data: notifications, unseenCount });
    }
    catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch notifications' });
    }
};
exports.getNotifications = getNotifications;
const markNotificationSeen = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ success: false, message: 'Authentication required' });
            return;
        }
        const { notificationId } = req.params;
        const updatedCount = await prisma_1.default.$executeRaw `
      UPDATE "Notification"
      SET "isSeen" = true, "seenAt" = NOW(), "updatedAt" = NOW()
      WHERE "id" = ${notificationId} AND "userId" = ${userId}
    `;
        if (updatedCount === 0) {
            res.status(404).json({ success: false, message: 'Notification not found' });
            return;
        }
        res.json({ success: true, message: 'Notification marked as seen' });
    }
    catch (error) {
        console.error('Error marking notification as seen:', error);
        res.status(500).json({ success: false, message: 'Failed to mark notification as seen' });
    }
};
exports.markNotificationSeen = markNotificationSeen;
const markAllNotificationsSeen = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ success: false, message: 'Authentication required' });
            return;
        }
        await prisma_1.default.$executeRaw `
      UPDATE "Notification"
      SET "isSeen" = true, "seenAt" = NOW(), "updatedAt" = NOW()
      WHERE "userId" = ${userId} AND "isSeen" = false
    `;
        res.json({ success: true, message: 'All notifications marked as seen' });
    }
    catch (error) {
        console.error('Error marking all notifications as seen:', error);
        res.status(500).json({ success: false, message: 'Failed to mark all notifications as seen' });
    }
};
exports.markAllNotificationsSeen = markAllNotificationsSeen;
const dismissNotification = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ success: false, message: 'Authentication required' });
            return;
        }
        const { notificationId } = req.params;
        const deletedCount = await prisma_1.default.$executeRaw `
      DELETE FROM "Notification"
      WHERE "id" = ${notificationId} AND "userId" = ${userId}
    `;
        if (deletedCount === 0) {
            res.status(404).json({ success: false, message: 'Notification not found' });
            return;
        }
        res.json({ success: true, message: 'Notification dismissed' });
    }
    catch (error) {
        console.error('Error dismissing notification:', error);
        res.status(500).json({ success: false, message: 'Failed to dismiss notification' });
    }
};
exports.dismissNotification = dismissNotification;
//# sourceMappingURL=notificationController.js.map
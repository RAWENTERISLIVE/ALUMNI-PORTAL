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
        const pageValue = typeof req.query.page === 'string' ? req.query.page : undefined;
        const limitValue = typeof req.query.limit === 'string' ? req.query.limit : undefined;
        const pageRaw = pageValue ? Number.parseInt(pageValue, 10) : 1;
        const limitRaw = limitValue ? Number.parseInt(limitValue, 10) : 20;
        const page = Number.isFinite(pageRaw) && pageRaw > 0 ? pageRaw : 1;
        const limit = Math.min(Number.isFinite(limitRaw) && limitRaw > 0 ? limitRaw : 20, 100);
        const skip = (page - 1) * limit;
        const [notifications, unseenCount, total] = await Promise.all([
            prisma_1.default.notification.findMany({
                where: { userId },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
                select: {
                    id: true,
                    title: true,
                    message: true,
                    type: true,
                    actionUrl: true,
                    metadata: true,
                    isSeen: true,
                    createdAt: true
                }
            }),
            prisma_1.default.notification.count({
                where: {
                    userId,
                    isSeen: false
                }
            }),
            prisma_1.default.notification.count({
                where: {
                    userId
                }
            })
        ]);
        res.json({
            success: true,
            data: notifications,
            unseenCount,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });
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
        const { count: updatedCount } = await prisma_1.default.notification.updateMany({
            where: {
                id: notificationId,
                userId
            },
            data: {
                isSeen: true,
                seenAt: new Date()
            }
        });
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
        await prisma_1.default.notification.updateMany({
            where: {
                userId,
                isSeen: false
            },
            data: {
                isSeen: true,
                seenAt: new Date()
            }
        });
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
        const { count: deletedCount } = await prisma_1.default.notification.deleteMany({
            where: {
                id: notificationId,
                userId
            }
        });
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
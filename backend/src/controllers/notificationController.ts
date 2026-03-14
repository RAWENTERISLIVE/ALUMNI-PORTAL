import { Request, Response } from 'express';
import prisma from '../config/prisma';

type NotificationRow = {
  id: string;
  title: string;
  message: string;
  type: string;
  actionUrl: string | null;
  isSeen: boolean;
  createdAt: Date;
};

type CountRow = {
  count: bigint;
};

interface AuthRequest extends Request {
  user?: {
    id: string;
  };
}

export const getNotifications = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const limit = Math.min(Number(req.query.limit) || 20, 100);

    const [notifications, unseenCountResult] = await Promise.all([
      prisma.$queryRaw<NotificationRow[]>`
        SELECT "id", "title", "message", "type", "actionUrl", "isSeen", "createdAt"
        FROM "Notification"
        WHERE "userId" = ${userId}
        ORDER BY "createdAt" DESC
        LIMIT ${limit}
      `,
      prisma.$queryRaw<CountRow[]>`
        SELECT COUNT(*)::bigint AS count
        FROM "Notification"
        WHERE "userId" = ${userId} AND "isSeen" = false
      `
    ]);

    const unseenCount = Number(unseenCountResult[0]?.count ?? 0n);

    res.json({ success: true, data: notifications, unseenCount });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch notifications' });
  }
};

export const markNotificationSeen = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const { notificationId } = req.params;

    const updatedCount = await prisma.$executeRaw`
      UPDATE "Notification"
      SET "isSeen" = true, "seenAt" = NOW(), "updatedAt" = NOW()
      WHERE "id" = ${notificationId} AND "userId" = ${userId}
    `;

    if (updatedCount === 0) {
      res.status(404).json({ success: false, message: 'Notification not found' });
      return;
    }

    res.json({ success: true, message: 'Notification marked as seen' });
  } catch (error) {
    console.error('Error marking notification as seen:', error);
    res.status(500).json({ success: false, message: 'Failed to mark notification as seen' });
  }
};

export const markAllNotificationsSeen = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    await prisma.$executeRaw`
      UPDATE "Notification"
      SET "isSeen" = true, "seenAt" = NOW(), "updatedAt" = NOW()
      WHERE "userId" = ${userId} AND "isSeen" = false
    `;

    res.json({ success: true, message: 'All notifications marked as seen' });
  } catch (error) {
    console.error('Error marking all notifications as seen:', error);
    res.status(500).json({ success: false, message: 'Failed to mark all notifications as seen' });
  }
};

export const dismissNotification = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const { notificationId } = req.params;

    const deletedCount = await prisma.$executeRaw`
      DELETE FROM "Notification"
      WHERE "id" = ${notificationId} AND "userId" = ${userId}
    `;

    if (deletedCount === 0) {
      res.status(404).json({ success: false, message: 'Notification not found' });
      return;
    }

    res.json({ success: true, message: 'Notification dismissed' });
  } catch (error) {
    console.error('Error dismissing notification:', error);
    res.status(500).json({ success: false, message: 'Failed to dismiss notification' });
  }
};

import prisma from '../config/prisma';
import { randomUUID } from 'node:crypto';

type NotificationInput = {
  userId: string;
  title: string;
  message: string;
  type?: string;
  actionUrl?: string;
  metadata?: Record<string, unknown>;
};

export const createNotification = async ({
  userId,
  title,
  message,
  type = 'info',
  actionUrl,
  metadata
}: NotificationInput) => {
  try {
    const notificationId = randomUUID();
    const metadataJson = metadata ? JSON.stringify(metadata) : null;

    await prisma.$executeRaw`
      INSERT INTO "Notification" ("id", "userId", "title", "message", "type", "actionUrl", "metadata", "isSeen", "createdAt", "updatedAt")
      VALUES (${notificationId}, ${userId}, ${title}, ${message}, ${type}, ${actionUrl ?? null}, CAST(${metadataJson} AS jsonb), false, NOW(), NOW())
    `;

    return true;
  } catch (error) {
    console.error('Failed to create notification:', error);
    return null;
  }
};

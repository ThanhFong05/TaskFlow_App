import { prisma } from '@/lib/prisma';

const db = prisma as any;

export type NotificationType = 'TASK_ASSIGNED' | 'TEAM_INVITED' | 'ROLE_UPDATED' | 'SYSTEM';

export interface CreateNotificationParams {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
}

export async function createNotification(params: CreateNotificationParams) {
  try {
    return await db.notification.create({
      data: {
        userId: params.userId,
        type: params.type,
        title: params.title,
        message: params.message,
        link: params.link || null,
      },
    });
  } catch (error) {
    console.error('Failed to create in-app notification:', error);
    return null;
  }
}

export async function getUserNotifications(userId: string, limit = 20) {
  try {
    const [notifications, unreadCount] = await Promise.all([
      db.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: limit,
      }),
      db.notification.count({
        where: { userId, isRead: false },
      }),
    ]);

    return { notifications, unreadCount };
  } catch (error) {
    console.warn('Could not query notifications (table may not exist yet):', error);
    return { notifications: [], unreadCount: 0 };
  }
}

export async function markNotificationAsRead(id: string, userId: string) {
  try {
    return await db.notification.updateMany({
      where: { id, userId },
      data: { isRead: true },
    });
  } catch (error) {
    console.error('Failed to mark notification as read:', error);
    return null;
  }
}

export async function markAllNotificationsAsRead(userId: string) {
  try {
    return await db.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  } catch (error) {
    console.error('Failed to mark all notifications as read:', error);
    return null;
  }
}

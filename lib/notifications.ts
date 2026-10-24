import { prisma } from '@/lib/prisma';

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
    return await prisma.notification.create({
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
  const [notifications, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    }),
    prisma.notification.count({
      where: { userId, isRead: false },
    }),
  ]);

  return { notifications, unreadCount };
}

export async function markNotificationAsRead(id: string, userId: string) {
  return await prisma.notification.updateMany({
    where: { id, userId },
    data: { isRead: true },
  });
}

export async function markAllNotificationsAsRead(userId: string) {
  return await prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  });
}

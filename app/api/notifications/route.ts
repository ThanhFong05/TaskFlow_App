import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { getUserNotifications } from '@/lib/notifications';

export async function GET(req: Request) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { notifications, unreadCount } = await getUserNotifications(authUser.id);

    return NextResponse.json({
      notifications,
      unreadCount,
    });
  } catch (error: any) {
    console.error('Failed to get notifications:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to get notifications' },
      { status: 500 }
    );
  }
}

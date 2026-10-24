import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { markAllNotificationsAsRead } from '@/lib/notifications';

export async function PUT(req: Request) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await markAllNotificationsAsRead(authUser.id);

    return NextResponse.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Failed to mark all notifications read:', error);
    const message = error instanceof Error ? error.message : 'Failed to mark all notifications read';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

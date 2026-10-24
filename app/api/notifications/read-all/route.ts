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
  } catch (error: any) {
    console.error('Failed to mark all notifications read:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to mark all notifications read' },
      { status: 500 }
    );
  }
}

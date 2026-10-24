import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { markNotificationAsRead } from '@/lib/notifications';

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    await markNotificationAsRead(id, authUser.id);

    return NextResponse.json({ success: true, message: 'Notification marked as read' });
  } catch (error) {
    console.error('Failed to mark notification read:', error);
    const message = error instanceof Error ? error.message : 'Failed to mark notification read';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

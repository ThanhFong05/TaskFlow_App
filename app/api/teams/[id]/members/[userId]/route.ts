import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: teamId, userId: targetUserId } = await params;

    // Check if requester is Owner
    const currentMember = await prisma.teamMember.findUnique({
      where: {
        teamId_userId: {
          teamId,
          userId: authUser.id,
        },
      },
    });

    if (currentMember?.role !== 'OWNER' && authUser.id !== targetUserId) {
      return NextResponse.json(
        { error: 'Forbidden: Only the team Owner can remove members' },
        { status: 403 }
      );
    }

    // Check target membership
    const targetMember = await prisma.teamMember.findUnique({
      where: {
        teamId_userId: {
          teamId,
          userId: targetUserId,
        },
      },
    });

    if (!targetMember) {
      return NextResponse.json(
        { error: 'Member not found in this team' },
        { status: 404 }
      );
    }

    if (targetMember.role === 'OWNER' && targetUserId === authUser.id) {
      return NextResponse.json(
        { error: 'Cannot remove yourself as Owner. Please delete the team or transfer ownership.' },
        { status: 400 }
      );
    }

    // Also unassign this user's tasks in this team
    await prisma.task.updateMany({
      where: {
        teamId,
        assigneeId: targetUserId,
      },
      data: {
        assigneeId: null,
      },
    });

    await prisma.teamMember.delete({
      where: {
        teamId_userId: {
          teamId,
          userId: targetUserId,
        },
      },
    });

    return NextResponse.json({ message: 'Member removed successfully' });
  } catch (error: any) {
    console.error('Failed to remove member:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to remove member' },
      { status: 500 }
    );
  }
}

import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createNotification } from '@/lib/notifications';
import { logActivity } from '@/lib/activity';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: teamId } = await params;
    const body = await req.json();
    const email = body?.email?.trim()?.toLowerCase();
    const requestedRole = body?.role === 'ADMIN' ? 'ADMIN' : 'MEMBER';

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Role check: Only Owner or Admin can add members
    const currentMember = await prisma.teamMember.findUnique({
      where: {
        teamId_userId: {
          teamId,
          userId: authUser.id,
        },
      },
      include: {
        team: true,
      },
    });

    if (!currentMember || (currentMember.role !== 'OWNER' && currentMember.role !== 'ADMIN')) {
      return NextResponse.json(
        { error: 'Forbidden: Only the team Owner or Admin can add new members' },
        { status: 403 }
      );
    }

    // Admins can only add Members (not Admins or Owners)
    const assignedRole = currentMember.role === 'OWNER' ? requestedRole : 'MEMBER';

    // Find the user to add by email
    const targetUser = await prisma.user.findUnique({
      where: { email },
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: `User with email "${email}" has not registered yet. Please have them register first.` },
        { status: 404 }
      );
    }

    // Check if already a member
    const existingMembership = await prisma.teamMember.findUnique({
      where: {
        teamId_userId: {
          teamId,
          userId: targetUser.id,
        },
      },
    });

    if (existingMembership) {
      return NextResponse.json(
        { error: 'This user is already a member of the team' },
        { status: 400 }
      );
    }

    // Add member
    const newMember = await prisma.teamMember.create({
      data: {
        teamId,
        userId: targetUser.id,
        role: assignedRole,
      },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    const teamName = currentMember.team.name;
    const inviterName = authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'Someone';

    // In-app Notification for the added user
    await createNotification({
      userId: targetUser.id,
      type: 'TEAM_INVITED',
      title: 'Added to Team',
      message: `${inviterName} added you to team "${teamName}" as ${assignedRole}.`,
      link: `/teams/${teamId}`,
    });

    // Activity Log
    await logActivity({
      teamId,
      actorId: authUser.id,
      action: 'added_member',
      details: `Added ${targetUser.email} as ${assignedRole}`,
    });

    return NextResponse.json(newMember, { status: 201 });
  } catch (error) {
    console.error('Failed to add member:', error);
    const message = error instanceof Error ? error.message : 'Failed to add member';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

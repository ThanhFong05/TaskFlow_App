import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createNotification } from '@/lib/notifications';
import { logActivity } from '@/lib/activity';

// PUT: Update member role (Owner only)
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: teamId, userId: targetUserId } = await params;
    const body = await req.json();
    const newRole = body?.role; // 'OWNER' | 'ADMIN' | 'MEMBER'

    if (!['OWNER', 'ADMIN', 'MEMBER'].includes(newRole)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    // Role check: Only OWNER can change member roles
    const requesterMember = await prisma.teamMember.findUnique({
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

    if (requesterMember?.role !== 'OWNER') {
      return NextResponse.json(
        { error: 'Forbidden: Only the team Owner can change member roles' },
        { status: 403 }
      );
    }

    const targetMember = await prisma.teamMember.findUnique({
      where: {
        teamId_userId: {
          teamId,
          userId: targetUserId,
        },
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    if (!targetMember) {
      return NextResponse.json({ error: 'Member not found in this team' }, { status: 404 });
    }

    // If transferring ownership
    if (newRole === 'OWNER') {
      if (targetUserId === authUser.id) {
        return NextResponse.json({ error: 'You are already the owner' }, { status: 400 });
      }

      // Demote current owner to ADMIN, promote target to OWNER, and update team.ownerId
      await prisma.$transaction([
        prisma.teamMember.update({
          where: { teamId_userId: { teamId, userId: authUser.id } },
          data: { role: 'ADMIN' },
        }),
        prisma.teamMember.update({
          where: { teamId_userId: { teamId, userId: targetUserId } },
          data: { role: 'OWNER' },
        }),
        prisma.team.update({
          where: { id: teamId },
          data: { ownerId: targetUserId },
        }),
      ]);

      await createNotification({
        userId: targetUserId,
        type: 'ROLE_UPDATED',
        title: 'Team Ownership Transferred',
        message: `You are now the Owner of team "${requesterMember.team.name}".`,
        link: `/teams/${teamId}`,
      });

      await logActivity({
        teamId,
        actorId: authUser.id,
        action: 'transferred_ownership',
        details: `Transferred team ownership to ${targetMember.user.email}`,
      });

      return NextResponse.json({ message: 'Ownership transferred successfully' });
    }

    // Regular role change (ADMIN <-> MEMBER)
    if (targetMember.role === 'OWNER') {
      return NextResponse.json(
        { error: 'Cannot change the Owner role directly. Transfer ownership instead.' },
        { status: 400 }
      );
    }

    const updated = await prisma.teamMember.update({
      where: {
        teamId_userId: {
          teamId,
          userId: targetUserId,
        },
      },
      data: {
        role: newRole,
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    await createNotification({
      userId: targetUserId,
      type: 'ROLE_UPDATED',
      title: 'Role Updated',
      message: `Your role in team "${requesterMember.team.name}" was changed to ${newRole}.`,
      link: `/teams/${teamId}`,
    });

    await logActivity({
      teamId,
      actorId: authUser.id,
      action: 'updated_role',
      details: `Changed role of ${targetMember.user.email} to ${newRole}`,
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Failed to update member role:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to update member role' },
      { status: 500 }
    );
  }
}

// DELETE: Remove member (or leave team)
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

    // Requester membership
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

    if (!currentMember) {
      return NextResponse.json(
        { error: 'Forbidden: You are not a member of this team' },
        { status: 403 }
      );
    }

    // Target membership
    const targetMember = await prisma.teamMember.findUnique({
      where: {
        teamId_userId: {
          teamId,
          userId: targetUserId,
        },
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    if (!targetMember) {
      return NextResponse.json({ error: 'Member not found in this team' }, { status: 404 });
    }

    const isSelf = authUser.id === targetUserId;
    const isOwner = currentMember.role === 'OWNER';
    const isAdmin = currentMember.role === 'ADMIN';

    // Disallow Owner from leaving without transferring ownership
    if (targetMember.role === 'OWNER' && isSelf) {
      return NextResponse.json(
        { error: 'Cannot remove yourself as Owner. Please transfer ownership or delete the team.' },
        { status: 400 }
      );
    }

    // Permission checks:
    // 1. Owner can remove anyone (except self)
    // 2. Admin can remove Members only (cannot remove Owner or other Admins)
    // 3. Member can only remove themselves (leave team)
    if (!isOwner && !isSelf) {
      if (isAdmin) {
        if (targetMember.role === 'OWNER' || targetMember.role === 'ADMIN') {
          return NextResponse.json(
            { error: 'Forbidden: Admins cannot remove the Owner or other Admins' },
            { status: 403 }
          );
        }
      } else {
        return NextResponse.json(
          { error: 'Forbidden: Members cannot remove other team members' },
          { status: 403 }
        );
      }
    }

    // Unassign tasks assigned to this member in this team
    await prisma.task.updateMany({
      where: {
        teamId,
        assigneeId: targetUserId,
      },
      data: {
        assigneeId: null,
      },
    });

    // Delete membership
    await prisma.teamMember.delete({
      where: {
        teamId_userId: {
          teamId,
          userId: targetUserId,
        },
      },
    });

    // Log activity
    await logActivity({
      teamId,
      actorId: authUser.id,
      action: isSelf ? 'left_team' : 'removed_member',
      details: isSelf
        ? `${targetMember.user.email} left the team`
        : `Removed ${targetMember.user.email} from the team`,
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

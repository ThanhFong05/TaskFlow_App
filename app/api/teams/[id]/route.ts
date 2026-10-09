import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Check membership
    const membership = await prisma.teamMember.findUnique({
      where: {
        teamId_userId: {
          teamId: id,
          userId: authUser.id,
        },
      },
    });

    if (!membership) {
      return NextResponse.json(
        { error: 'Forbidden: You are not a member of this team' },
        { status: 403 }
      );
    }

    const team = await prisma.team.findUnique({
      where: { id },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
          },
          orderBy: { joinedAt: 'asc' },
        },
        tasks: {
          include: {
            assignee: {
              select: { id: true, name: true, email: true },
            },
            creator: {
              select: { id: true, name: true, email: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    return NextResponse.json({
      ...team,
      currentUserRole: membership.role,
    });
  } catch (error: any) {
    console.error('Failed to get team:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to get team' },
      { status: 500 }
    );
  }
}

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

    // Check if team exists and if current user is OWNER
    const team = await prisma.team.findUnique({
      where: { id },
    });

    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    // Role check: Only Owner can update
    const membership = await prisma.teamMember.findUnique({
      where: {
        teamId_userId: {
          teamId: id,
          userId: authUser.id,
        },
      },
    });

    if (membership?.role !== 'OWNER' && team.ownerId !== authUser.id) {
      return NextResponse.json(
        { error: 'Forbidden: Only the team Owner can update team details' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { name, description } = body;

    const updatedTeam = await prisma.team.update({
      where: { id },
      data: {
        name: name !== undefined ? name.trim() : team.name,
        description: description !== undefined ? description?.trim() : team.description,
      },
    });

    return NextResponse.json(updatedTeam);
  } catch (error: any) {
    console.error('Failed to update team:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to update team' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const team = await prisma.team.findUnique({
      where: { id },
    });

    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    // Role check: Only Owner can delete
    const membership = await prisma.teamMember.findUnique({
      where: {
        teamId_userId: {
          teamId: id,
          userId: authUser.id,
        },
      },
    });

    if (membership?.role !== 'OWNER' && team.ownerId !== authUser.id) {
      return NextResponse.json(
        { error: 'Forbidden: Only the team Owner can delete this team' },
        { status: 403 }
      );
    }

    await prisma.team.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Team deleted successfully' });
  } catch (error: any) {
    console.error('Failed to delete team:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to delete team' },
      { status: 500 }
    );
  }
}

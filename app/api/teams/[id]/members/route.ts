import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

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
    const { email, role = 'MEMBER' } = await req.json();

    if (!email || !email.trim()) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Role check: Only Owner can add members
    const currentMember = await prisma.teamMember.findUnique({
      where: {
        teamId_userId: {
          teamId,
          userId: authUser.id,
        },
      },
    });

    if (currentMember?.role !== 'OWNER') {
      return NextResponse.json(
        { error: 'Forbidden: Only the team Owner can add new members' },
        { status: 403 }
      );
    }

    // Find the user to add by email
    const targetUser = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
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
        role: role === 'OWNER' ? 'OWNER' : 'MEMBER',
      },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return NextResponse.json(newMember, { status: 201 });
  } catch (error: any) {
    console.error('Failed to add member:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to add member' },
      { status: 500 }
    );
  }
}

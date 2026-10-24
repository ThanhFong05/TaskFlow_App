import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getTeamActivities } from '@/lib/activity';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: teamId } = await params;

    const membership = await prisma.teamMember.findUnique({
      where: {
        teamId_userId: {
          teamId,
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

    const activities = await getTeamActivities(teamId, 50);

    return NextResponse.json(activities);
  } catch (error) {
    console.error('Failed to get team activities:', error);
    const message = error instanceof Error ? error.message : 'Failed to get activities';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

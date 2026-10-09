import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const authUser = await getAuthUser(req);

    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userProfile = await prisma.user.findUnique({
      where: { id: authUser.id },
      include: {
        teams: {
          include: {
            team: true,
          },
        },
      },
    });

    return NextResponse.json({
      user: {
        id: authUser.id,
        email: authUser.email,
        name: userProfile?.name || authUser.user_metadata?.name || authUser.email?.split('@')[0],
        teams: userProfile?.teams || [],
      },
    });
  } catch (error: any) {
    console.error('Fetch me error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch user' },
      { status: 500 }
    );
  }
}

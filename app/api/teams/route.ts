import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const teams = await prisma.team.findMany({
      where: {
        members: {
          some: {
            userId: authUser.id,
          },
        },
      },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
          },
        },
        _count: {
          select: { tasks: true, members: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(teams);
  } catch (error: any) {
    console.error('Failed to fetch teams:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch teams' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { name, description } = body;

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: 'Team name is required' },
        { status: 400 }
      );
    }

    // Create team and immediately add creator as OWNER member
    const team = await prisma.team.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        ownerId: authUser.id,
        members: {
          create: {
            userId: authUser.id,
            role: 'OWNER',
          },
        },
      },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
          },
        },
        _count: {
          select: { tasks: true, members: true },
        },
      },
    });

    return NextResponse.json(team, { status: 201 });
  } catch (error: any) {
    console.error('Failed to create team:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to create team' },
      { status: 500 }
    );
  }
}

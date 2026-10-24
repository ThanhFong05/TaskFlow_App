import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Use cast to prevent IDE cached type errors if PrismaClient is reloaded
const db = prisma as any;

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

    // Verify membership
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

    try {
      const messages = await db.message.findMany({
        where: { teamId },
        include: {
          sender: {
            select: { id: true, name: true, email: true },
          },
        },
        orderBy: { createdAt: 'asc' },
        take: 100, // recent 100 messages
      });

      return NextResponse.json(messages);
    } catch (dbError: any) {
      // If table doesn't exist yet in database, return empty array gracefully
      if (dbError?.code === 'P2021' || dbError?.message?.includes('does not exist')) {
        console.warn('Message table does not exist in database yet. Returning empty list.');
        return NextResponse.json([]);
      }
      throw dbError;
    }
  } catch (error: any) {
    console.error('Failed to get team messages:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to get messages' },
      { status: 500 }
    );
  }
}

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

    // Verify membership
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

    const body = await req.json();
    const content = body?.content?.trim();

    if (!content) {
      return NextResponse.json({ error: 'Message content cannot be empty' }, { status: 400 });
    }

    try {
      const message = await db.message.create({
        data: {
          content,
          teamId,
          senderId: authUser.id,
        },
        include: {
          sender: {
            select: { id: true, name: true, email: true },
          },
        },
      });

      return NextResponse.json(message, { status: 201 });
    } catch (dbError: any) {
      if (dbError?.code === 'P2021' || dbError?.message?.includes('does not exist')) {
        return NextResponse.json(
          {
            error:
              'Table "Message" chưa tồn tại trong database. Vui lòng mở lại Supabase và chạy "npx prisma db push" hoặc thực thi file migration.sql trong Supabase SQL Editor.',
          },
          { status: 500 }
        );
      }
      throw dbError;
    }
  } catch (error: any) {
    console.error('Failed to post team message:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to post message' },
      { status: 500 }
    );
  }
}

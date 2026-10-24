import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createNotification } from '@/lib/notifications';
import { logActivity } from '@/lib/activity';

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

    // Check that requester is a member of the team
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

    // Parse URL search params for filtering & search
    const url = new URL(req.url);
    const status = url.searchParams.get('status');
    const priority = url.searchParams.get('priority');
    const assigneeId = url.searchParams.get('assigneeId');
    const search = url.searchParams.get('search');

    const whereClause: any = {
      teamId,
    };

    if (status && status !== 'All') {
      whereClause.status = status;
    }
    if (priority && priority !== 'All') {
      whereClause.priority = priority;
    }
    if (assigneeId && assigneeId !== 'All') {
      whereClause.assigneeId = assigneeId;
    }
    if (search && search.trim()) {
      whereClause.OR = [
        { title: { contains: search.trim(), mode: 'insensitive' } },
        { description: { contains: search.trim(), mode: 'insensitive' } },
      ];
    }

    const tasks = await prisma.task.findMany({
      where: whereClause,
      include: {
        assignee: {
          select: { id: true, name: true, email: true },
        },
        creator: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(tasks);
  } catch (error) {
    console.error('Failed to fetch team tasks:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch tasks';
    return NextResponse.json({ error: message }, { status: 500 });
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

    // Check membership
    const membership = await prisma.teamMember.findUnique({
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

    if (!membership) {
      return NextResponse.json(
        { error: 'Forbidden: Only team members can create tasks' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { title, description, status, priority, dueDate, assigneeId } = body;

    if (!title || !title.trim()) {
      return NextResponse.json(
        { error: 'Task title is required' },
        { status: 400 }
      );
    }

    // If assigneeId provided, ensure assignee is a team member
    if (assigneeId) {
      const assigneeMember = await prisma.teamMember.findUnique({
        where: {
          teamId_userId: {
            teamId,
            userId: assigneeId,
          },
        },
      });

      if (!assigneeMember) {
        return NextResponse.json(
          { error: 'Assignee must be a member of this team' },
          { status: 400 }
        );
      }
    }

    const task = await prisma.task.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        status: status || 'To Do',
        priority: priority || 'Medium',
        dueDate: dueDate ? new Date(dueDate) : null,
        teamId,
        assigneeId: assigneeId || null,
        creatorId: authUser.id,
      },
      include: {
        assignee: {
          select: { id: true, name: true, email: true },
        },
        creator: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    const teamName = membership.team.name;
    const creatorName = authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'A team member';

    // In-app Notification for assignee (if assigned to someone else)
    if (assigneeId && assigneeId !== authUser.id) {
      await createNotification({
        userId: assigneeId,
        type: 'TASK_ASSIGNED',
        title: 'Task Assigned',
        message: `${creatorName} assigned you to "${task.title}" in team "${teamName}".`,
        link: `/teams/${teamId}`,
      });
    }

    // Activity Log
    await logActivity({
      teamId,
      actorId: authUser.id,
      action: 'created_task',
      details: `Created task "${task.title}"`,
    });

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error('Failed to create team task:', error);
    const message = error instanceof Error ? error.message : 'Failed to create task';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

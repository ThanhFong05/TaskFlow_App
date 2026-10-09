import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

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
    const body = await req.json();

    const existingTask = await prisma.task.findUnique({
      where: { id },
      include: { team: true },
    });

    if (!existingTask) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // If task belongs to a team, verify membership
    if (existingTask.teamId) {
      const membership = await prisma.teamMember.findUnique({
        where: {
          teamId_userId: {
            teamId: existingTask.teamId,
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
    }

    // Filter update fields
    const { id: _, createdAt, updatedAt, team, assignee, creator, ...updateData } = body;

    if (updateData.dueDate !== undefined) {
      updateData.dueDate = updateData.dueDate ? new Date(updateData.dueDate) : null;
    }

    const updatedTask = await prisma.task.update({
      where: { id },
      data: updateData,
      include: {
        assignee: {
          select: { id: true, name: true, email: true },
        },
        creator: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return NextResponse.json(updatedTask);
  } catch (error: any) {
    console.error('Failed to update task:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to update task' },
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

    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        team: true,
      },
    });

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Authorization rule: Only task creator, assignee, or team Owner can delete
    let isOwner = false;
    if (task.teamId) {
      const membership = await prisma.teamMember.findUnique({
        where: {
          teamId_userId: {
            teamId: task.teamId,
            userId: authUser.id,
          },
        },
      });
      isOwner = membership?.role === 'OWNER' || task.team?.ownerId === authUser.id;
    }

    const isCreator = task.creatorId === authUser.id;
    const isAssignee = task.assigneeId === authUser.id;

    if (!isCreator && !isAssignee && !isOwner) {
      return NextResponse.json(
        { error: 'Forbidden: Only the task creator, assignee, or team Owner can delete this task' },
        { status: 403 }
      );
    }

    await prisma.task.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Task deleted successfully' });
  } catch (error: any) {
    console.error('Failed to delete task:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to delete task' },
      { status: 500 }
    );
  }
}

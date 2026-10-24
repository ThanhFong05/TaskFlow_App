import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createNotification } from '@/lib/notifications';
import { logActivity } from '@/lib/activity';

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

    // Role check: If task belongs to a team, verify membership & role permissions
    let role = 'MEMBER';
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
      role = membership.role;
    }

    // Permission check for editing:
    // OWNER and ADMIN can edit ANY task in the team.
    // MEMBER can edit tasks they created, tasks assigned to them, or move task status.
    const isOwnerOrAdmin = role === 'OWNER' || role === 'ADMIN';
    const isCreator = existingTask.creatorId === authUser.id;
    const isAssignee = existingTask.assigneeId === authUser.id;

    if (!isOwnerOrAdmin && !isCreator && !isAssignee) {
      // If only moving status, allow team member to update status
      const isOnlyStatusUpdate =
        Object.keys(body).length === 1 && body.status !== undefined;

      if (!isOnlyStatusUpdate) {
        return NextResponse.json(
          { error: 'Forbidden: Members can only edit their own tasks or assigned tasks' },
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

    // Notify new assignee if assignee changed and is not the current user
    if (
      updateData.assigneeId &&
      updateData.assigneeId !== existingTask.assigneeId &&
      updateData.assigneeId !== authUser.id &&
      existingTask.teamId
    ) {
      const actorName = authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'A team member';
      await createNotification({
        userId: updateData.assigneeId,
        type: 'TASK_ASSIGNED',
        title: 'Task Assigned',
        message: `${actorName} assigned you to "${updatedTask.title}" in team "${existingTask.team?.name || 'Workspace'}".`,
        link: `/teams/${existingTask.teamId}`,
      });
    }

    // Log Activity
    if (existingTask.teamId) {
      let actionDesc = `Updated task "${updatedTask.title}"`;
      if (updateData.status && updateData.status !== existingTask.status) {
        actionDesc = `Moved task "${updatedTask.title}" to ${updateData.status}`;
      }

      await logActivity({
        teamId: existingTask.teamId,
        actorId: authUser.id,
        action: 'updated_task',
        details: actionDesc,
      });
    }

    return NextResponse.json(updatedTask);
  } catch (error) {
    console.error('Failed to update task:', error);
    const message = error instanceof Error ? error.message : 'Failed to update task';
    return NextResponse.json({ error: message }, { status: 500 });
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

    // Role check:
    // OWNER – delete any task
    // ADMIN – delete all tasks
    // MEMBER – can ONLY delete their own tasks (creatorId === user.id)
    let canDelete = false;

    if (task.teamId) {
      const membership = await prisma.teamMember.findUnique({
        where: {
          teamId_userId: {
            teamId: task.teamId,
            userId: authUser.id,
          },
        },
      });

      if (membership) {
        if (membership.role === 'OWNER' || membership.role === 'ADMIN' || task.team?.ownerId === authUser.id) {
          canDelete = true;
        } else if (membership.role === 'MEMBER' && task.creatorId === authUser.id) {
          canDelete = true;
        }
      }
    } else {
      canDelete = task.creatorId === authUser.id;
    }

    if (!canDelete) {
      return NextResponse.json(
        { error: 'Forbidden: Members can only delete tasks they created. Admins and Owners can delete any task.' },
        { status: 403 }
      );
    }

    await prisma.task.delete({
      where: { id },
    });

    // Log Activity
    if (task.teamId) {
      await logActivity({
        teamId: task.teamId,
        actorId: authUser.id,
        action: 'deleted_task',
        details: `Deleted task "${task.title}"`,
      });
    }

    return NextResponse.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Failed to delete task:', error);
    const message = error instanceof Error ? error.message : 'Failed to delete task';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

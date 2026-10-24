import { prisma } from '@/lib/prisma';

const db = prisma as any;

export interface LogActivityParams {
  teamId: string;
  actorId: string;
  action: string;
  details?: string;
}

export async function logActivity(params: LogActivityParams) {
  try {
    return await db.activityLog.create({
      data: {
        teamId: params.teamId,
        actorId: params.actorId,
        action: params.action,
        details: params.details || null,
      },
    });
  } catch (error) {
    console.error('Failed to log team activity:', error);
    return null;
  }
}

export async function getTeamActivities(teamId: string, limit = 40) {
  try {
    return await db.activityLog.findMany({
      where: { teamId },
      include: {
        actor: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  } catch (error) {
    console.warn('Could not query activityLog (table may not exist yet):', error);
    return [];
  }
}

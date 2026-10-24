import { prisma } from '@/lib/prisma';

export interface LogActivityParams {
  teamId: string;
  actorId: string;
  action: string;
  details?: string;
}

export async function logActivity(params: LogActivityParams) {
  try {
    return await prisma.activityLog.create({
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
  return await prisma.activityLog.findMany({
    where: { teamId },
    include: {
      actor: {
        select: { id: true, name: true, email: true },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
}

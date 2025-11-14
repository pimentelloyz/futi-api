import { prisma } from '../../infra/prisma/client.js';
import { ERROR_CODES } from '../../domain/constants.js';

interface PendingEvaluationsResponse {
  match: {
    id: string;
    scheduledAt: Date;
    status: string;
    venue: string | null;
    homeTeamId: string;
    awayTeamId: string;
    homeScore: number;
    awayScore: number;
  };
  teamId: string;
  evaluatorPlayerId: string;
  expiresAt: string;
  players: Array<{
    id: string;
    name: string;
    positionSlug: string | null;
    number: number | null;
    isActive: boolean;
  }>;
}

export class PendingEvaluationsController {
  async handle(params: {
    userId?: string;
  }): Promise<{ statusCode: number; body: PendingEvaluationsResponse | { error: string } }> {
    const { userId } = params;
    if (!userId) return { statusCode: 401, body: { error: ERROR_CODES.UNAUTHORIZED } };

    const mePlayer = await prisma.player.findUnique({ where: { userId }, select: { id: true } });
    if (!mePlayer) return { statusCode: 404, body: { error: ERROR_CODES.PLAYER_NOT_FOUND } };

    const prismaExt = prisma as unknown as {
      playersOnTeams: {
        findMany: (args: {
          where: { playerId?: string; teamId?: string };
          select: { teamId?: true; playerId?: true };
        }) => Promise<Array<{ teamId?: string; playerId?: string }>>;
      };
    };
    const memberships = await prismaExt.playersOnTeams.findMany({
      where: { playerId: mePlayer.id },
      select: { teamId: true },
    });
    const teamIds = memberships.map((m) => m.teamId!).filter((id): id is string => Boolean(id));
    if (!teamIds.length) return { statusCode: 404, body: { error: 'no_team' } };

    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const recentMatch = await prisma.match.findFirst({
      where: {
        scheduledAt: { gte: twentyFourHoursAgo, lte: now },
        OR: [{ homeTeamId: { in: teamIds } }, { awayTeamId: { in: teamIds } }],
      },
      orderBy: { scheduledAt: 'desc' },
      select: {
        id: true,
        scheduledAt: true,
        status: true,
        venue: true,
        homeTeamId: true,
        awayTeamId: true,
        homeScore: true,
        awayScore: true,
      },
    });
    if (!recentMatch) return { statusCode: 404, body: { error: 'no_recent_match' } };

    if (recentMatch.scheduledAt.getTime() < twentyFourHoursAgo.getTime()) {
      return { statusCode: 410, body: { error: 'evaluation_expired' } };
    }

    const myTeamId = teamIds.includes(recentMatch.homeTeamId)
      ? recentMatch.homeTeamId
      : recentMatch.awayTeamId;

    const pendingAssignments = await prisma.matchPlayerEvaluationAssignment.findMany({
      where: { matchId: recentMatch.id, evaluatorPlayerId: mePlayer.id, completedAt: null },
      select: { targetPlayerId: true },
    });

    let targetPlayerIds = pendingAssignments.map((a) => a.targetPlayerId);

    if (targetPlayerIds.length === 0) {
      const lineup = await prisma.matchLineupEntry.findMany({
        where: { matchId: recentMatch.id, teamId: myTeamId },
        select: { playerId: true },
      });
      targetPlayerIds = lineup.map((l) => l.playerId).filter((id) => id !== mePlayer.id);
    }

    if (targetPlayerIds.length === 0) {
      const roster = await prismaExt.playersOnTeams.findMany({
        where: { teamId: myTeamId },
        select: { playerId: true },
      });
      targetPlayerIds = roster.map((r) => r.playerId!).filter((id) => id && id !== mePlayer.id);
    }

    const players = await prisma.player.findMany({
      where: { id: { in: targetPlayerIds } },
      select: { id: true, name: true, positionSlug: true, number: true, isActive: true },
    });

    return {
      statusCode: 200,
      body: {
        match: recentMatch,
        teamId: myTeamId,
        evaluatorPlayerId: mePlayer.id,
        expiresAt: new Date(recentMatch.scheduledAt.getTime() + 24 * 60 * 60 * 1000).toISOString(),
        players,
      },
    };
  }
}

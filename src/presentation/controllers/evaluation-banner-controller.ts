import { prisma } from '../../infra/prisma/client.js';
import { ERROR_CODES } from '../../domain/constants.js';

interface EvaluationBannerResponse {
  evaluationBanner: null | {
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
    pendingCount: number;
    expiresAt: string;
    players?: Array<{
      id: string;
      name: string;
      positionSlug: string | null;
      number: number | null;
      isActive: boolean;
    }>;
  };
}

export class EvaluationBannerController {
  async handle(params: {
    userId?: string;
    teamId?: string;
    includePlayers?: boolean;
  }): Promise<{ statusCode: number; body: EvaluationBannerResponse | { error: string } }> {
    const { userId, teamId, includePlayers } = params;
    if (!userId) return { statusCode: 401, body: { error: ERROR_CODES.UNAUTHORIZED } };

    const mePlayer = await prisma.player.findUnique({ where: { userId }, select: { id: true } });
    if (!mePlayer) return { statusCode: 404, body: { error: ERROR_CODES.PLAYER_NOT_FOUND } };

    const prismaExt = prisma as unknown as {
      playersOnTeams: {
        findMany: (args: {
          where: { playerId?: string };
          select: { teamId?: true };
        }) => Promise<Array<{ teamId?: string }>>;
      };
    };
    const memberships = await prismaExt.playersOnTeams.findMany({
      where: { playerId: mePlayer.id },
      select: { teamId: true },
    });
    const allTeamIds = memberships.map((m) => m.teamId!).filter(Boolean);
    if (!allTeamIds.length) return { statusCode: 404, body: { evaluationBanner: null } };
    const focusTeamIds = teamId && allTeamIds.includes(teamId) ? [teamId] : allTeamIds;

    const now = new Date();
    const windowStart = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const recentMatch = await prisma.match.findFirst({
      where: {
        scheduledAt: { gte: windowStart, lte: now },
        OR: [{ homeTeamId: { in: focusTeamIds } }, { awayTeamId: { in: focusTeamIds } }],
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

    if (!recentMatch) return { statusCode: 200, body: { evaluationBanner: null } };

    const pendingAssignments = await prisma.matchPlayerEvaluationAssignment.findMany({
      where: { matchId: recentMatch.id, evaluatorPlayerId: mePlayer.id, completedAt: null },
      select: { targetPlayerId: true },
    });

    const pendingCount = pendingAssignments.length;
    if (pendingCount === 0) return { statusCode: 200, body: { evaluationBanner: null } };

    let players:
      | Array<{
          id: string;
          name: string;
          positionSlug: string | null;
          number: number | null;
          isActive: boolean;
        }>
      | undefined;
    if (includePlayers) {
      const playerIds = pendingAssignments.map((a) => a.targetPlayerId);
      players = await prisma.player.findMany({
        where: { id: { in: playerIds } },
        select: { id: true, name: true, positionSlug: true, number: true, isActive: true },
      });
    }

    return {
      statusCode: 200,
      body: {
        evaluationBanner: {
          match: recentMatch,
          pendingCount,
          expiresAt: new Date(
            recentMatch.scheduledAt.getTime() + 24 * 60 * 60 * 1000,
          ).toISOString(),
          players,
        },
      },
    };
  }
}

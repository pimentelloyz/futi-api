import { z } from 'zod';

import { prisma } from '../../infra/prisma/client.js';
import { ERROR_CODES } from '../../domain/constants.js';

const lineupSchema = z.object({
  home: z.array(z.string()).default([]),
  away: z.array(z.string()).default([]),
});

export class MatchLineupSetController {
  async handle(params: {
    matchId: string;
    body: unknown;
  }): Promise<{ statusCode: number; body: unknown }> {
    const { matchId, body } = params;
    const parsed = lineupSchema.safeParse(body);
    if (!parsed.success) return { statusCode: 400, body: { error: ERROR_CODES.INVALID_REQUEST } };
    try {
      const match = await prisma.match.findUnique({
        where: { id: matchId },
        select: { homeTeamId: true, awayTeamId: true },
      });
      if (!match) return { statusCode: 404, body: { error: ERROR_CODES.MATCH_NOT_FOUND } };
      await prisma.matchLineupEntry.deleteMany({ where: { matchId } });
      const data: Array<{ matchId: string; teamId: string; playerId: string }> = [];
      for (const pid of parsed.data.home)
        data.push({ matchId, teamId: match.homeTeamId, playerId: pid });
      for (const pid of parsed.data.away)
        data.push({ matchId, teamId: match.awayTeamId, playerId: pid });
      if (data.length) await prisma.matchLineupEntry.createMany({ data });
      return { statusCode: 204, body: undefined };
    } catch (e) {
      console.error('[set_lineup_ctrl_error]', (e as Error).message);
      return { statusCode: 500, body: { error: ERROR_CODES.INTERNAL_ERROR } };
    }
  }
}

export class MatchLineupGetController {
  async handle(params: { matchId: string }): Promise<{ statusCode: number; body: unknown }> {
    const { matchId } = params;
    try {
      const match = await prisma.match.findUnique({
        where: { id: matchId },
        select: { homeTeamId: true, awayTeamId: true },
      });
      if (!match) return { statusCode: 404, body: { error: ERROR_CODES.MATCH_NOT_FOUND } };
      const entries = (await prisma.matchLineupEntry.findMany({
        where: { matchId },
        select: { playerId: true, teamId: true },
      })) as Array<{ playerId: string; teamId: string }>;
      const home = entries.filter((e) => e.teamId === match.homeTeamId).map((e) => e.playerId);
      const away = entries.filter((e) => e.teamId === match.awayTeamId).map((e) => e.playerId);
      return { statusCode: 200, body: { home, away } };
    } catch (e) {
      console.error('[get_lineup_ctrl_error]', (e as Error).message);
      return { statusCode: 500, body: { error: ERROR_CODES.INTERNAL_ERROR } };
    }
  }
}

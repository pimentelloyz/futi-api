import { z } from 'zod';

import { prisma } from '../../infra/prisma/client.js';
import { ERROR_CODES } from '../../domain/constants.js';
import {
  getFormationById,
  getPlayersCountByFormat,
  validateFormation,
  type MatchFormat,
} from '../../domain/constants/formations.js';

// Schema antigo (retrocompatibilidade)
const lineupSchema = z.object({
  home: z.array(z.string()).default([]),
  away: z.array(z.string()).default([]),
});

// Schema novo com formações táticas
const lineupWithFormationSchema = z.object({
  homeFormation: z.string(), // ID da formação (ex: 'fut11-4-3-3')
  awayFormation: z.string(),
  home: z.array(
    z.object({
      playerId: z.string(),
      position: z.string(), // GK, CB, LB, RB, CDM, CM, CAM, LW, RW, ST
      isStarting: z.boolean().default(true),
    }),
  ),
  away: z.array(
    z.object({
      playerId: z.string(),
      position: z.string(),
      isStarting: z.boolean().default(true),
    }),
  ),
});

export class MatchLineupSetController {
  async handle(params: {
    matchId: string;
    body: unknown;
  }): Promise<{ statusCode: number; body: unknown }> {
    const { matchId, body } = params;

    // Tentar novo schema primeiro, depois fallback para antigo
    const parsedNew = lineupWithFormationSchema.safeParse(body);
    const parsedOld = lineupSchema.safeParse(body);

    if (!parsedNew.success && !parsedOld.success) {
      return {
        statusCode: 400,
        body: {
          error: ERROR_CODES.INVALID_REQUEST,
          details: parsedNew.error.flatten(),
        },
      };
    }

    try {
      const match = await prisma.match.findUnique({
        where: { id: matchId },
        include: {
          league: {
            select: {
              matchFormat: true,
            },
          },
        },
      });

      if (!match) return { statusCode: 404, body: { error: ERROR_CODES.MATCH_NOT_FOUND } };

      const matchFormat = (match.league?.matchFormat as MatchFormat) || 'FUT11';
      const requiredPlayers = getPlayersCountByFormat(matchFormat);

      await prisma.matchLineupEntry.deleteMany({ where: { matchId } });

      // Processar com formação tática
      if (parsedNew.success) {
        const { homeFormation, awayFormation, home, away } = parsedNew.data;

        // Validar formações
        if (!validateFormation(homeFormation, matchFormat)) {
          return {
            statusCode: 400,
            body: {
              error: 'INVALID_FORMATION',
              message: `Formação ${homeFormation} não é válida para ${matchFormat}`,
            },
          };
        }

        if (!validateFormation(awayFormation, matchFormat)) {
          return {
            statusCode: 400,
            body: {
              error: 'INVALID_FORMATION',
              message: `Formação ${awayFormation} não é válida para ${matchFormat}`,
            },
          };
        }

        // Validar quantidade de jogadores
        if (home.length !== requiredPlayers) {
          return {
            statusCode: 400,
            body: {
              error: 'INVALID_PLAYER_COUNT',
              message: `Time da casa deve ter ${requiredPlayers} jogadores (${matchFormat})`,
            },
          };
        }

        if (away.length !== requiredPlayers) {
          return {
            statusCode: 400,
            body: {
              error: 'INVALID_PLAYER_COUNT',
              message: `Time visitante deve ter ${requiredPlayers} jogadores (${matchFormat})`,
            },
          };
        }

        // Validar posições da formação
        const homeFormationData = getFormationById(homeFormation);
        const awayFormationData = getFormationById(awayFormation);

        if (!homeFormationData || !awayFormationData) {
          return {
            statusCode: 400,
            body: { error: 'FORMATION_NOT_FOUND' },
          };
        }

        const homePositions = homeFormationData.positions.map((p) => p.position);
        const awayPositions = awayFormationData.positions.map((p) => p.position);

        // Validar se todas as posições foram preenchidas
        const homePlayerPositions = home.map((p) => p.position);
        const awayPlayerPositions = away.map((p) => p.position);

        const invalidHomePositions = homePlayerPositions.filter((p) => !homePositions.includes(p));
        const invalidAwayPositions = awayPlayerPositions.filter((p) => !awayPositions.includes(p));

        if (invalidHomePositions.length > 0) {
          return {
            statusCode: 400,
            body: {
              error: 'INVALID_POSITIONS',
              message: `Posições inválidas no time da casa: ${invalidHomePositions.join(', ')}`,
            },
          };
        }

        if (invalidAwayPositions.length > 0) {
          return {
            statusCode: 400,
            body: {
              error: 'INVALID_POSITIONS',
              message: `Posições inválidas no time visitante: ${invalidAwayPositions.join(', ')}`,
            },
          };
        }

        const data: Array<{
          matchId: string;
          teamId: string;
          playerId: string;
          position: string;
          isStarting: boolean;
        }> = [];

        for (const player of home) {
          data.push({
            matchId,
            teamId: match.homeTeamId,
            playerId: player.playerId,
            position: player.position,
            isStarting: player.isStarting,
          });
        }

        for (const player of away) {
          data.push({
            matchId,
            teamId: match.awayTeamId,
            playerId: player.playerId,
            position: player.position,
            isStarting: player.isStarting,
          });
        }

        if (data.length) await prisma.matchLineupEntry.createMany({ data });

        return {
          statusCode: 200,
          body: {
            message: 'Escalação definida com sucesso',
            homeFormation,
            awayFormation,
            totalPlayers: data.length,
          },
        };
      }

      // Processar modo antigo (retrocompatibilidade)
      if (parsedOld.success) {
        const { home, away } = parsedOld.data;

        const data: Array<{ matchId: string; teamId: string; playerId: string }> = [];
        for (const pid of home) data.push({ matchId, teamId: match.homeTeamId, playerId: pid });
        for (const pid of away) data.push({ matchId, teamId: match.awayTeamId, playerId: pid });
        if (data.length) await prisma.matchLineupEntry.createMany({ data });
        return { statusCode: 204, body: undefined };
      }

      return { statusCode: 400, body: { error: ERROR_CODES.INVALID_REQUEST } };
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

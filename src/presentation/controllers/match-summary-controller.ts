import { prisma } from '../../infra/prisma/client.js';
import { ERROR_CODES } from '../../domain/constants.js';

/**
 * Controller para obter súmula completa da partida
 * Retorna: informações da partida, escalações, eventos (gols, cartões), placar
 */
export class MatchSummaryController {
  async handle(params: { matchId: string }): Promise<{ statusCode: number; body: unknown }> {
    const { matchId } = params;

    if (!matchId) {
      return { statusCode: 400, body: { error: ERROR_CODES.INVALID_REQUEST } };
    }

    try {
      // Buscar dados completos da partida
      const match: any = await prisma.match.findUnique({
        where: { id: matchId },
        include: {
          homeTeam: {
            select: {
              id: true,
              name: true,
            },
          },
          awayTeam: {
            select: {
              id: true,
              name: true,
            },
          },
          league: {
            select: {
              id: true,
              name: true,
            },
          },
          events: {
            include: {
              player: {
                select: {
                  id: true,
                  name: true,
                  number: true,
                },
              },
              team: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
            orderBy: {
              minute: 'asc',
            },
          },
          lineup: {
            include: {
              player: {
                select: {
                  id: true,
                  name: true,
                  number: true,
                  positionSlug: true,
                },
              },
              team: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      });

      if (!match) {
        return { statusCode: 404, body: { error: ERROR_CODES.MATCH_NOT_FOUND } };
      }

      // Organizar escalações por time
      const homeLineup = match.lineup
        .filter((entry) => entry.teamId === match.homeTeamId)
        .map((entry) => ({
          id: entry.id,
          player: entry.player,
          isStarting: entry.isStarting,
        }));

      const awayLineup = match.lineup
        .filter((entry) => entry.teamId === match.awayTeamId)
        .map((entry) => ({
          id: entry.id,
          player: entry.player,
          isStarting: entry.isStarting,
        }));

      // Organizar eventos por tipo
      const goals = match.events
        .filter((e) => e.type === 'GOAL' || e.type === 'OWN_GOAL')
        .map((e) => ({
          id: e.id,
          type: e.type,
          minute: e.minute,
          player: e.player,
          team: e.team,
          createdAt: e.createdAt,
        }));

      const yellowCards = match.events
        .filter((e) => e.type === 'YELLOW_CARD')
        .map((e) => ({
          id: e.id,
          minute: e.minute,
          player: e.player,
          team: e.team,
          createdAt: e.createdAt,
        }));

      const redCards = match.events
        .filter((e) => e.type === 'RED_CARD')
        .map((e) => ({
          id: e.id,
          minute: e.minute,
          player: e.player,
          team: e.team,
          createdAt: e.createdAt,
        }));

      const fouls = match.events
        .filter((e) => e.type === 'FOUL')
        .map((e) => ({
          id: e.id,
          minute: e.minute,
          player: e.player,
          team: e.team,
          createdAt: e.createdAt,
        }));

      // Construir resposta
      const summary = {
        match: {
          id: match.id,
          status: match.status,
          scheduledAt: match.scheduledAt,
          venue: match.venue,
          homeScore: match.homeScore,
          awayScore: match.awayScore,
          homeTeam: match.homeTeam,
          awayTeam: match.awayTeam,
          league: match.league,
        },
        lineup: {
          home: homeLineup,
          away: awayLineup,
        },
        events: {
          goals,
          yellowCards,
          redCards,
          fouls,
          all: match.events.map((e) => ({
            id: e.id,
            type: e.type,
            minute: e.minute,
            player: e.player,
            team: e.team,
            createdAt: e.createdAt,
          })),
        },
        statistics: {
          totalEvents: match.events.length,
          totalGoals: goals.length,
          totalYellowCards: yellowCards.length,
          totalRedCards: redCards.length,
          totalFouls: fouls.length,
          homeGoals: goals.filter((g) => g.team?.id === match.homeTeamId).length,
          awayGoals: goals.filter((g) => g.team?.id === match.awayTeamId).length,
          homeYellowCards: yellowCards.filter((c) => c.team?.id === match.homeTeamId).length,
          awayYellowCards: yellowCards.filter((c) => c.team?.id === match.awayTeamId).length,
          homeRedCards: redCards.filter((c) => c.team?.id === match.homeTeamId).length,
          awayRedCards: redCards.filter((c) => c.team?.id === match.awayTeamId).length,
        },
      };

      return { statusCode: 200, body: summary };
    } catch (error) {
      console.error('[match_summary_error]', error);
      return { statusCode: 500, body: { error: ERROR_CODES.INTERNAL_ERROR } };
    }
  }
}

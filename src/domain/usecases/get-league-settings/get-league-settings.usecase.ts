import { PrismaClient } from '@prisma/client';
import { GetLeagueSettingsInput, GetLeagueSettingsOutput } from './get-league-settings.dto.js';

const TIEBREAK_LABELS: Record<string, string> = {
  POINTS: 'Pontos',
  WINS: 'Vitórias',
  GOAL_DIFFERENCE: 'Saldo de Gols',
  GOALS_FOR: 'Gols Marcados',
  GOALS_AGAINST: 'Gols Sofridos',
  HEAD_TO_HEAD_POINTS: 'Confronto Direto (Pontos)',
  HEAD_TO_HEAD_GOAL_DIFF: 'Confronto Direto (Saldo)',
  HEAD_TO_HEAD_GOALS_FOR: 'Confronto Direto (Gols Marcados)',
  HEAD_TO_HEAD_GOALS_AWAY: 'Confronto Direto (Gols Fora)',
  AWAY_GOALS: 'Gols Fora',
  WINS_AWAY: 'Vitórias Fora',
  FAIR_PLAY: 'Fair Play',
  RED_CARDS: 'Cartões Vermelhos',
  YELLOW_CARDS: 'Cartões Amarelos',
  DRAW: 'Sorteio',
  UEFA_COEFFICIENT: 'Coeficiente UEFA',
};

export class GetLeagueSettingsUseCase {
  constructor(private readonly prisma: PrismaClient) {}

  async execute(input: GetLeagueSettingsInput): Promise<GetLeagueSettingsOutput> {
    // Buscar liga com todas as informações necessárias
    const league = await this.prisma.league.findUnique({
      where: { id: input.leagueId },
      include: {
        format: true,
        phases: {
          include: {
            config: {
              include: {
                tiebreakRules: {
                  orderBy: { order: 'asc' },
                },
              },
            },
          },
          orderBy: { order: 'asc' },
        },
        disciplineRule: true,
        teams: {
          select: { id: true },
        },
        matches: {
          select: {
            id: true,
            status: true,
          },
        },
      },
    });

    if (!league) {
      throw new Error('league_not_found');
    }

    // Verificar se usuário tem permissão (LEAGUE_MANAGER ou ADMIN)
    const membership = await this.prisma.accessMembership.findFirst({
      where: {
        userId: input.userId,
        OR: [
          { leagueId: input.leagueId },
          { teamId: null, leagueId: null, role: { in: ['ADMIN', 'MASTER'] } },
        ],
      },
    });

    if (!membership) {
      throw new Error('unauthorized');
    }

    // Determinar se liga já começou
    const hasStarted = league.startAt ? new Date(league.startAt) <= new Date() : false;

    // Verificar se pode editar (não começou)
    const canEdit = !hasStarted && league.isActive;

    // Calcular estatísticas de partidas
    const matchStats = league.matches.reduce(
      (acc, match) => {
        acc.total++;
        if (match.status === 'SCHEDULED') acc.scheduled++;
        if (match.status === 'IN_PROGRESS') acc.inProgress++;
        if (match.status === 'FINISHED') acc.finished++;
        return acc;
      },
      { total: 0, scheduled: 0, inProgress: 0, finished: 0 }
    );

    return {
      league: {
        id: league.id,
        name: league.name,
        slug: league.slug,
        description: league.description,
        icon: league.icon,
        banner: league.banner,
        startAt: league.startAt,
        endAt: league.endAt,
        isActive: league.isActive,
        isPublic: league.isPublic,
        hasStarted,
        canEdit,
      },
      format: league.format
        ? {
            id: league.format.id,
            name: league.format.name,
            slug: league.format.slug,
            type: league.format.type,
          }
        : null,
      phases: league.phases.map((phase) => {
        const tiebreakRules = phase.config?.tiebreakRules.map((rule) => ({
          id: rule.id,
          order: rule.order,
          criterion: rule.criterion,
          criterionLabel: TIEBREAK_LABELS[rule.criterion] || rule.criterion,
        })) || [];

        return {
          id: phase.id,
          name: phase.name,
          order: phase.order,
          type: phase.type,
          status: phase.status,
          tiebreakRules,
        };
      }),
      disciplineRule: league.disciplineRule
        ? {
            id: league.disciplineRule.id,
            yellowCardsForSuspension: league.disciplineRule.yellowCardsForSuspension,
            yellowCardsAccumulation: league.disciplineRule.yellowCardsAccumulation,
            resetYellowsAfterPhaseOrder: league.disciplineRule.resetYellowsAfterPhaseOrder,
            redCardMinimumGames: league.disciplineRule.redCardMinimumGames,
            doubleYellowGames: league.disciplineRule.doubleYellowGames,
          }
        : null,
      teams: {
        total: league.teams.length,
        confirmed: league.teams.length,
        pending: 0,
      },
      matches: matchStats,
    };
  }
}

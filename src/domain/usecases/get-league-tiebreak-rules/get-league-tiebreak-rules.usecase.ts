import { PrismaClient } from '@prisma/client';
import { GetLeagueTiebreakRulesInput, GetLeagueTiebreakRulesOutput } from './get-league-tiebreak-rules.dto.js';

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

const AVAILABLE_CRITERIA = Object.keys(TIEBREAK_LABELS).map((key) => ({
  value: key,
  label: TIEBREAK_LABELS[key],
}));

export class GetLeagueTiebreakRulesUseCase {
  constructor(private readonly prisma: PrismaClient) {}

  async execute(input: GetLeagueTiebreakRulesInput): Promise<GetLeagueTiebreakRulesOutput> {
    // Verificar se liga existe
    const league = await this.prisma.league.findUnique({
      where: { id: input.leagueId },
      include: {
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
        },
      },
    });

    if (!league) {
      throw new Error('league_not_found');
    }

    // Verificar permissão
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

    // Se phaseId foi especificada, buscar apenas dessa fase
    if (input.phaseId) {
      const phase = league.phases.find((p) => p.id === input.phaseId);
      if (!phase) {
        throw new Error('phase_not_found');
      }

      const rules = phase.config?.tiebreakRules.map((rule) => ({
        id: rule.id,
        order: rule.order,
        criterion: rule.criterion,
        criterionLabel: TIEBREAK_LABELS[rule.criterion] || rule.criterion,
      })) || [];

      return {
        rules,
        availableCriteria: AVAILABLE_CRITERIA,
      };
    }

    // Caso contrário, retornar da primeira fase
    const firstPhase = league.phases[0];
    const rules = firstPhase?.config?.tiebreakRules.map((rule) => ({
      id: rule.id,
      order: rule.order,
      criterion: rule.criterion,
      criterionLabel: TIEBREAK_LABELS[rule.criterion] || rule.criterion,
    })) || [];

    return {
      rules,
      availableCriteria: AVAILABLE_CRITERIA,
    };
  }
}

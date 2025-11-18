import { PrismaClient } from '@prisma/client';

// ============================================================================
// INTERFACES & TYPES
// ============================================================================

export interface CreateDisciplineRuleDTO {
  leagueId: string;
  yellowCardsForSuspension?: number;
  yellowCardsAccumulation?: boolean;
  resetYellowsAfterPhaseOrder?: number;
  redCardMinimumGames?: number;
  doubleYellowGames?: number;
}

export interface UpdateDisciplineRuleDTO {
  yellowCardsForSuspension?: number;
  yellowCardsAccumulation?: boolean;
  resetYellowsAfterPhaseOrder?: number;
  redCardMinimumGames?: number;
  doubleYellowGames?: number;
}

export interface DisciplineRuleDTO {
  id: string;
  leagueId: string;
  yellowCardsForSuspension: number;
  yellowCardsAccumulation: boolean;
  resetYellowsAfterPhaseOrder: number | null;
  redCardMinimumGames: number;
  doubleYellowGames: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface PlayerSuspensionCheck {
  playerId: string;
  isSuspended: boolean;
  reason?: string;
  suspensionGames?: number;
  yellowCardsCount?: number;
}

// ============================================================================
// SERVICE
// ============================================================================

/**
 * DisciplineRuleService - Gerencia regras disciplinares de ligas
 *
 * Responsabilidades:
 * - Configurar regras de cartões amarelos e vermelhos
 * - Calcular suspensões automáticas
 * - Verificar elegibilidade de jogadores
 * - Gerenciar acúmulo e reset de cartões
 *
 * Princípios SOLID:
 * - Single Responsibility: Focado apenas em disciplina/cartões
 * - Open/Closed: Extensível para novas regras sem modificar código
 */
export class DisciplineRuleService {
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Cria regras disciplinares para uma liga
   */
  async createRules(data: CreateDisciplineRuleDTO): Promise<DisciplineRuleDTO> {
    // Verificar se liga existe
    const league = await this.prisma.league.findUnique({
      where: { id: data.leagueId },
    });

    if (!league) {
      throw new Error('Liga não encontrada');
    }

    // Verificar se já existem regras para esta liga
    const existing = await this.prisma.disciplineRule.findUnique({
      where: { leagueId: data.leagueId },
    });

    if (existing) {
      throw new Error('Liga já possui regras disciplinares configuradas');
    }

    const rules = await this.prisma.disciplineRule.create({
      data: {
        leagueId: data.leagueId,
        yellowCardsForSuspension: data.yellowCardsForSuspension ?? 3,
        yellowCardsAccumulation: data.yellowCardsAccumulation ?? true,
        resetYellowsAfterPhaseOrder: data.resetYellowsAfterPhaseOrder ?? null,
        redCardMinimumGames: data.redCardMinimumGames ?? 1,
        doubleYellowGames: data.doubleYellowGames ?? 1,
      },
    });

    return this.mapToDTO(rules);
  }

  /**
   * Busca regras disciplinares de uma liga
   */
  async getRulesByLeagueId(leagueId: string): Promise<DisciplineRuleDTO | null> {
    const rules = await this.prisma.disciplineRule.findUnique({
      where: { leagueId },
    });

    if (!rules) return null;
    return this.mapToDTO(rules);
  }

  /**
   * Atualiza regras disciplinares
   */
  async updateRules(leagueId: string, data: UpdateDisciplineRuleDTO): Promise<DisciplineRuleDTO> {
    const rules = await this.prisma.disciplineRule.update({
      where: { leagueId },
      data: {
        yellowCardsForSuspension: data.yellowCardsForSuspension,
        yellowCardsAccumulation: data.yellowCardsAccumulation,
        resetYellowsAfterPhaseOrder: data.resetYellowsAfterPhaseOrder,
        redCardMinimumGames: data.redCardMinimumGames,
        doubleYellowGames: data.doubleYellowGames,
      },
    });

    return this.mapToDTO(rules);
  }

  /**
   * Deleta regras disciplinares de uma liga
   */
  async deleteRules(leagueId: string): Promise<void> {
    await this.prisma.disciplineRule.delete({
      where: { leagueId },
    });
  }

  /**
   * Verifica se um jogador está suspenso para o próximo jogo
   */
  async checkPlayerSuspension(playerId: string, leagueId: string): Promise<PlayerSuspensionCheck> {
    const rules = await this.getRulesByLeagueId(leagueId);
    if (!rules) {
      return { playerId, isSuspended: false };
    }

    // Buscar estatísticas do jogador na liga
    const playerStats = await this.getPlayerDisciplineStats(playerId, leagueId);

    // Verificar suspensão por cartões amarelos
    if (rules.yellowCardsAccumulation) {
      if (playerStats.yellowCards >= rules.yellowCardsForSuspension) {
        const suspensionCount = Math.floor(
          playerStats.yellowCards / rules.yellowCardsForSuspension,
        );
        return {
          playerId,
          isSuspended: true,
          reason: 'Acúmulo de cartões amarelos',
          suspensionGames: suspensionCount,
          yellowCardsCount: playerStats.yellowCards,
        };
      }
    }

    // TODO: Implementar verificação de suspensão por cartões vermelhos
    // Requer tabela adicional para rastrear suspensões ativas

    return { playerId, isSuspended: false, yellowCardsCount: playerStats.yellowCards };
  }

  /**
   * Reseta cartões amarelos após uma fase específica
   */
  async resetYellowCardsAfterPhase(leagueId: string, phaseOrder: number): Promise<number> {
    const rules = await this.getRulesByLeagueId(leagueId);

    if (!rules || !rules.resetYellowsAfterPhaseOrder) {
      return 0;
    }

    if (phaseOrder !== rules.resetYellowsAfterPhaseOrder) {
      return 0;
    }

    // Buscar todas as standings da liga
    const phases = await this.prisma.leaguePhase.findMany({
      where: { leagueId, order: { lte: phaseOrder } },
      select: { id: true },
    });

    const phaseIds = phases.map((p) => p.id);

    // Resetar cartões amarelos
    const result = await this.prisma.leagueStanding.updateMany({
      where: {
        phaseId: { in: phaseIds },
      },
      data: {
        yellowCards: 0,
      },
    });

    return result.count;
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  private async getPlayerDisciplineStats(
    playerId: string,
    leagueId: string,
  ): Promise<{ yellowCards: number; redCards: number }> {
    // Buscar todas as fases da liga
    const phases = await this.prisma.leaguePhase.findMany({
      where: { leagueId },
      select: { id: true },
    });

    const phaseIds = phases.map((p) => p.id);

    // Buscar estatísticas do jogador através dos times
    const playerTeams = await this.prisma.playersOnTeams.findMany({
      where: { playerId },
      select: { teamId: true },
    });

    const teamIds = playerTeams.map((pt) => pt.teamId);

    // Somar cartões de todas as fases
    const standings = await this.prisma.leagueStanding.findMany({
      where: {
        phaseId: { in: phaseIds },
        teamId: { in: teamIds },
      },
      select: {
        yellowCards: true,
        redCards: true,
      },
    });

    const totalYellows = standings.reduce((sum, s) => sum + s.yellowCards, 0);
    const totalReds = standings.reduce((sum, s) => sum + s.redCards, 0);

    return {
      yellowCards: totalYellows,
      redCards: totalReds,
    };
  }

  private mapToDTO(rules: DisciplineRule): DisciplineRuleDTO {
    return {
      id: rules.id,
      leagueId: rules.leagueId,
      yellowCardsForSuspension: rules.yellowCardsForSuspension,
      yellowCardsAccumulation: rules.yellowCardsAccumulation,
      resetYellowsAfterPhaseOrder: rules.resetYellowsAfterPhaseOrder,
      redCardMinimumGames: rules.redCardMinimumGames,
      doubleYellowGames: rules.doubleYellowGames,
      createdAt: rules.createdAt,
      updatedAt: rules.updatedAt,
    };
  }
}

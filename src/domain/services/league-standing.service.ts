import { PrismaClient } from '@prisma/client';

// ============================================================================
// INTERFACES & TYPES
// ============================================================================

export interface StandingDTO {
  id: string;
  phaseId: string;
  teamId: string;
  groupId: string | null;
  position: number | null;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  winsHome: number;
  winsAway: number;
  goalsHome: number;
  goalsAway: number;
  yellowCards: number;
  redCards: number;
  team?: {
    id: string;
    name: string;
    icon: string | null;
  };
}

export interface UpdateStandingDTO {
  wins?: number;
  draws?: number;
  losses?: number;
  goalsFor?: number;
  goalsAgainst?: number;
  yellowCards?: number;
  redCards?: number;
}

export interface MatchResultDTO {
  homeTeamId: string;
  awayTeamId: string;
  homeScore: number;
  awayScore: number;
  homeYellowCards?: number;
  awayYellowCards?: number;
  homeRedCards?: number;
  awayRedCards?: number;
}

// ============================================================================
// SERVICE
// ============================================================================

/**
 * LeagueStandingService - Gerencia tabelas de classificação
 *
 * Responsabilidades:
 * - Criar e atualizar standings por fase/grupo
 * - Calcular pontos e estatísticas
 * - Ordenar tabelas por critérios de desempate
 * - Processar resultados de partidas
 *
 * Princípios SOLID:
 * - Single Responsibility: Focado apenas em classificações
 * - Open/Closed: Extensível para novos critérios de ordenação
 */
export class LeagueStandingService {
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Cria standings para todos os times de uma fase
   */
  async createStandingsForPhase(phaseId: string, groupId?: string): Promise<StandingDTO[]> {
    const phase = await this.prisma.leaguePhase.findUnique({
      where: { id: phaseId },
      include: { league: { include: { teams: true } } },
    });

    if (!phase) {
      throw new Error('Fase não encontrada');
    }

    const standings: StandingDTO[] = [];

    for (const leagueTeam of phase.league.teams) {
      const standing = await this.prisma.leagueStanding.create({
        data: {
          phaseId,
          teamId: leagueTeam.teamId,
          groupId: groupId || null,
        },
        include: {
          team: {
            select: {
              id: true,
              name: true,
              icon: true,
            },
          },
        },
      });

      standings.push(this.mapToDTO(standing));
    }

    return standings;
  }

  /**
   * Busca standings de uma fase (com opção de filtrar por grupo)
   */
  async getStandingsByPhase(phaseId: string, groupId?: string): Promise<StandingDTO[]> {
    const standings = await this.prisma.leagueStanding.findMany({
      where: {
        phaseId,
        groupId: groupId || undefined,
      },
      include: {
        team: {
          select: {
            id: true,
            name: true,
            icon: true,
          },
        },
      },
      orderBy: [{ points: 'desc' }, { goalDifference: 'desc' }, { goalsFor: 'desc' }],
    });

    return standings.map((s) => this.mapToDTO(s));
  }

  /**
   * Atualiza standing de um time específico
   */
  async updateStanding(standingId: string, data: UpdateStandingDTO): Promise<StandingDTO> {
    const standing = await this.prisma.leagueStanding.update({
      where: { id: standingId },
      data: {
        wins: data.wins,
        draws: data.draws,
        losses: data.losses,
        goalsFor: data.goalsFor,
        goalsAgainst: data.goalsAgainst,
        goalDifference:
          data.goalsFor !== undefined && data.goalsAgainst !== undefined
            ? data.goalsFor - data.goalsAgainst
            : undefined,
        points:
          data.wins !== undefined && data.draws !== undefined
            ? data.wins * 3 + data.draws
            : undefined,
        yellowCards: data.yellowCards,
        redCards: data.redCards,
      },
      include: {
        team: {
          select: {
            id: true,
            name: true,
            icon: true,
          },
        },
      },
    });

    return this.mapToDTO(standing);
  }

  /**
   * Processa resultado de uma partida e atualiza standings
   */
  async processMatchResult(
    phaseId: string,
    matchResult: MatchResultDTO,
    groupId?: string,
  ): Promise<{ home: StandingDTO; away: StandingDTO }> {
    const { homeTeamId, awayTeamId, homeScore, awayScore } = matchResult;

    // Determinar resultado
    const homeWin = homeScore > awayScore;
    const draw = homeScore === awayScore;
    const awayWin = awayScore > homeScore;

    // Buscar standings existentes
    let homeStanding = await this.prisma.leagueStanding.findFirst({
      where: { phaseId, teamId: homeTeamId, groupId: groupId || null },
    });

    let awayStanding = await this.prisma.leagueStanding.findFirst({
      where: { phaseId, teamId: awayTeamId, groupId: groupId || null },
    });

    // Criar se não existir
    if (!homeStanding) {
      homeStanding = await this.prisma.leagueStanding.create({
        data: { phaseId, teamId: homeTeamId, groupId: groupId || null },
      });
    }

    if (!awayStanding) {
      awayStanding = await this.prisma.leagueStanding.create({
        data: { phaseId, teamId: awayTeamId, groupId: groupId || null },
      });
    }

    // Atualizar home team
    const updatedHome = await this.prisma.leagueStanding.update({
      where: { id: homeStanding.id },
      data: {
        played: { increment: 1 },
        wins: homeWin ? { increment: 1 } : undefined,
        draws: draw ? { increment: 1 } : undefined,
        losses: awayWin ? { increment: 1 } : undefined,
        goalsFor: { increment: homeScore },
        goalsAgainst: { increment: awayScore },
        goalDifference: { increment: homeScore - awayScore },
        points: { increment: homeWin ? 3 : draw ? 1 : 0 },
        winsHome: homeWin ? { increment: 1 } : undefined,
        goalsHome: { increment: homeScore },
        yellowCards: matchResult.homeYellowCards
          ? { increment: matchResult.homeYellowCards }
          : undefined,
        redCards: matchResult.homeRedCards ? { increment: matchResult.homeRedCards } : undefined,
      },
      include: {
        team: {
          select: { id: true, name: true, icon: true },
        },
      },
    });

    // Atualizar away team
    const updatedAway = await this.prisma.leagueStanding.update({
      where: { id: awayStanding.id },
      data: {
        played: { increment: 1 },
        wins: awayWin ? { increment: 1 } : undefined,
        draws: draw ? { increment: 1 } : undefined,
        losses: homeWin ? { increment: 1 } : undefined,
        goalsFor: { increment: awayScore },
        goalsAgainst: { increment: homeScore },
        goalDifference: { increment: awayScore - homeScore },
        points: { increment: awayWin ? 3 : draw ? 1 : 0 },
        winsAway: awayWin ? { increment: 1 } : undefined,
        goalsAway: { increment: awayScore },
        yellowCards: matchResult.awayYellowCards
          ? { increment: matchResult.awayYellowCards }
          : undefined,
        redCards: matchResult.awayRedCards ? { increment: matchResult.awayRedCards } : undefined,
      },
      include: {
        team: {
          select: { id: true, name: true, icon: true },
        },
      },
    });

    return {
      home: this.mapToDTO(updatedHome),
      away: this.mapToDTO(updatedAway),
    };
  }

  /**
   * Recalcula posições baseado em pontos e critérios de desempate
   */
  async recalculatePositions(phaseId: string, groupId?: string): Promise<StandingDTO[]> {
    const standings = await this.getStandingsByPhase(phaseId, groupId);

    // Ordenar e atualizar posições
    for (let i = 0; i < standings.length; i++) {
      await this.prisma.leagueStanding.update({
        where: { id: standings[i].id },
        data: { position: i + 1 },
      });
    }

    return this.getStandingsByPhase(phaseId, groupId);
  }

  /**
   * Deleta standings de uma fase
   */
  async deleteStandingsByPhase(phaseId: string): Promise<number> {
    const result = await this.prisma.leagueStanding.deleteMany({
      where: { phaseId },
    });

    return result.count;
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  private mapToDTO(standing: {
    id: string;
    phaseId: string;
    teamId: string;
    groupId: string | null;
    position: number | null;
    played: number;
    wins: number;
    draws: number;
    losses: number;
    goalsFor: number;
    goalsAgainst: number;
    goalDifference: number;
    points: number;
    winsHome: number;
    winsAway: number;
    goalsHome: number;
    goalsAway: number;
    yellowCards: number;
    redCards: number;
    team?: {
      id: string;
      name: string;
      icon: string | null;
    };
  }): StandingDTO {
    return {
      id: standing.id,
      phaseId: standing.phaseId,
      teamId: standing.teamId,
      groupId: standing.groupId,
      position: standing.position,
      played: standing.played,
      wins: standing.wins,
      draws: standing.draws,
      losses: standing.losses,
      goalsFor: standing.goalsFor,
      goalsAgainst: standing.goalsAgainst,
      goalDifference: standing.goalDifference,
      points: standing.points,
      winsHome: standing.winsHome,
      winsAway: standing.winsAway,
      goalsHome: standing.goalsHome,
      goalsAway: standing.goalsAway,
      yellowCards: standing.yellowCards,
      redCards: standing.redCards,
      team: standing.team
        ? {
            id: standing.team.id,
            name: standing.team.name,
            icon: standing.team.icon,
          }
        : undefined,
    };
  }
}

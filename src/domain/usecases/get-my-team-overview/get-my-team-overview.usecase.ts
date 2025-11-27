import { PrismaClient } from '@prisma/client';
import { GetMyTeamOverviewInput, GetMyTeamOverviewOutput } from './get-my-team-overview.dto.js';
import { PLAYER_LITE_SELECT } from '../../../infra/prisma/selects.js';

export class NoTeamFoundError extends Error {
  constructor() {
    super('User has no associated teams');
    this.name = 'NoTeamFoundError';
  }
}

export class TeamNotFoundError extends Error {
  constructor(teamId: string) {
    super(`Team with id ${teamId} not found or is inactive`);
    this.name = 'TeamNotFoundError';
  }
}

export class GetMyTeamOverviewUseCase {
  constructor(private readonly prisma: PrismaClient) {}

  async execute(input: GetMyTeamOverviewInput): Promise<GetMyTeamOverviewOutput> {
    // 1. Buscar times do usuário via AccessMembership
    const memberships = await this.prisma.accessMembership.findMany({
      where: {
        userId: input.userId,
        teamId: { not: null },
        role: { in: ['MANAGER', 'ASSISTANT', 'PLAYER'] },
      },
      select: { teamId: true, team: { select: { id: true, name: true } } },
    });

    let myTeams = memberships.filter((m) => m.team).map((m) => m.team!);

    // 2. Se não tem membership, buscar como jogador via PlayersOnTeams
    if (!myTeams.length) {
      const mePlayer = await this.prisma.player.findUnique({
        where: { userId: input.userId },
        select: { id: true },
      });

      if (mePlayer) {
        const playerTeams = await this.prisma.team.findMany({
          where: { players: { some: { playerId: mePlayer.id } } },
          select: { id: true, name: true },
        });
        myTeams = playerTeams;
      }
    }

    if (!myTeams.length) {
      throw new NoTeamFoundError();
    }

    // 3. Selecionar time (teamId fornecido ou primeiro da lista)
    const selectedTeamId = input.teamId || myTeams[0].id;
    const team = myTeams.find((t) => t.id === selectedTeamId) || myTeams[0];

    // 4. Carregar dados completos do time
    const fullTeam = await this.prisma.team.findUnique({
      where: { id: team.id },
      select: { id: true, name: true, icon: true, description: true, isActive: true },
    });

    if (!fullTeam || !fullTeam.isActive) {
      throw new TeamNotFoundError(team.id);
    }

    // 5. Buscar jogadores do time em uma query otimizada
    const teamPlayers = await this.prisma.player.findMany({
      where: { teams: { some: { teamId: team.id } } },
      select: { ...PLAYER_LITE_SELECT, photo: true },
    });

    // 6. Buscar partidas recentes, próximas partidas e próxima partida em paralelo
    const now = new Date();
    const [recentMatches, upcomingMatches] = await Promise.all([
      // Partidas passadas/em andamento (com placares e times)
      this.prisma.match.findMany({
        where: {
          OR: [{ homeTeamId: team.id }, { awayTeamId: team.id }],
          scheduledAt: { lt: now },
        },
        orderBy: { scheduledAt: 'desc' },
        take: 5,
        select: {
          id: true,
          scheduledAt: true,
          status: true,
          venue: true,
          homeTeamId: true,
          awayTeamId: true,
          homeScore: true,
          awayScore: true,
          homeTeam: {
            select: { id: true, name: true, icon: true },
          },
          awayTeam: {
            select: { id: true, name: true, icon: true },
          },
        },
      }),
      // Próximas partidas futuras (com times completos)
      this.prisma.match.findMany({
        where: {
          status: 'SCHEDULED',
          scheduledAt: { gte: now },
          OR: [{ homeTeamId: team.id }, { awayTeamId: team.id }],
        },
        orderBy: { scheduledAt: 'asc' },
        take: 10,
        select: {
          id: true,
          scheduledAt: true,
          venue: true,
          homeTeamId: true,
          awayTeamId: true,
          status: true,
          homeTeam: {
            select: { id: true, name: true, icon: true },
          },
          awayTeam: {
            select: { id: true, name: true, icon: true },
          },
        },
      }),
    ]);

    const nextMatch = upcomingMatches[0] || null;

    // 7. Buscar evaluation banner (se usuário é jogador)
    const evaluationBanner = await this.getEvaluationBanner(input.userId, team.id, now);

    return {
      team: {
        id: fullTeam.id,
        name: fullTeam.name,
        icon: fullTeam.icon,
        description: fullTeam.description,
        isActive: fullTeam.isActive,
      },
      players: teamPlayers.map((p) => ({
        id: p.id,
        name: p.name,
        photo: p.photo,
        positionSlug: p.positionSlug,
        number: p.number,
        isActive: p.isActive,
      })),
      recentMatches: recentMatches.map((m) => ({
        id: m.id,
        scheduledAt: m.scheduledAt,
        status: m.status,
        venue: m.venue,
        homeTeamId: m.homeTeamId,
        awayTeamId: m.awayTeamId,
        homeScore: m.homeScore,
        awayScore: m.awayScore,
        homeTeam: m.homeTeam,
        awayTeam: m.awayTeam,
      })),
      upcomingMatches: upcomingMatches.map((m) => ({
        id: m.id,
        scheduledAt: m.scheduledAt,
        venue: m.venue,
        homeTeamId: m.homeTeamId,
        awayTeamId: m.awayTeamId,
        status: m.status,
        homeTeam: m.homeTeam,
        awayTeam: m.awayTeam,
      })),
      next_game: nextMatch ? {
        id: nextMatch.id,
        scheduledAt: nextMatch.scheduledAt,
        venue: nextMatch.venue,
        homeTeamId: nextMatch.homeTeamId,
        awayTeamId: nextMatch.awayTeamId,
        status: nextMatch.status,
        homeTeam: nextMatch.homeTeam,
        awayTeam: nextMatch.awayTeam,
      } : null,
      evaluationBanner,
    };
  }

  private async getEvaluationBanner(
    userId: string,
    teamId: string,
    now: Date,
  ): Promise<GetMyTeamOverviewOutput['evaluationBanner']> {
    // Verificar se usuário é jogador
    const mePlayer = await this.prisma.player.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!mePlayer) {
      return null;
    }

    // Buscar partida nas últimas 24h
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const recent24hMatch = await this.prisma.match.findFirst({
      where: {
        scheduledAt: { gte: twentyFourHoursAgo, lte: now },
        OR: [{ homeTeamId: teamId }, { awayTeamId: teamId }],
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

    if (!recent24hMatch) {
      return null;
    }

    // Verificar se há avaliações pendentes
    const pendingCount = await this.prisma.matchPlayerEvaluationAssignment.count({
      where: {
        matchId: recent24hMatch.id,
        evaluatorPlayerId: mePlayer.id,
        completedAt: null,
      },
    });

    if (pendingCount === 0) {
      return null;
    }

    return {
      match: recent24hMatch,
      expiresAt: new Date(recent24hMatch.scheduledAt.getTime() + 24 * 60 * 60 * 1000).toISOString(),
    };
  }
}

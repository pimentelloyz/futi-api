import { PrismaClient } from '@prisma/client';

import {
  IDisciplineRepository,
  DisciplineCard,
  PlayerDisciplineHistory,
} from '../../domain/repositories/discipline.repository.interface.js';

export class PrismaDisciplineRepository implements IDisciplineRepository {
  constructor(private prisma: PrismaClient) {}

  async listLeagueCards(leagueId: string): Promise<DisciplineCard[]> {
    const events = await this.prisma.matchEvent.findMany({
      where: {
        type: {
          in: ['YELLOW_CARD', 'RED_CARD'],
        },
        match: {
          leagueId,
        },
        playerId: { not: null },
        teamId: { not: null },
      },
      include: {
        player: {
          select: {
            id: true,
            name: true,
          },
        },
        team: {
          select: {
            id: true,
            name: true,
          },
        },
        match: {
          select: {
            id: true,
            homeTeamId: true,
            awayTeamId: true,
            scheduledAt: true,
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
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return events.map((event) => ({
      id: event.id,
      matchId: event.matchId,
      playerId: event.playerId!,
      teamId: event.teamId!,
      type: event.type as 'YELLOW_CARD' | 'RED_CARD',
      minute: event.minute ?? undefined,
      createdAt: event.createdAt,
      player: event.player!,
      team: event.team!,
      match: {
        ...event.match,
        scheduledFor: event.match.scheduledAt,
      },
    }));
  }

  async getPlayerLeagueDiscipline(
    playerId: string,
    leagueId: string,
  ): Promise<PlayerDisciplineHistory> {
    const player = await this.prisma.player.findUnique({
      where: { id: playerId },
      select: { id: true, name: true },
    });

    if (!player) {
      throw new Error('Player not found');
    }

    const events = await this.prisma.matchEvent.findMany({
      where: {
        playerId,
        type: {
          in: ['YELLOW_CARD', 'RED_CARD'],
        },
        match: {
          leagueId,
        },
        teamId: { not: null },
      },
      include: {
        player: {
          select: {
            id: true,
            name: true,
          },
        },
        team: {
          select: {
            id: true,
            name: true,
          },
        },
        match: {
          select: {
            id: true,
            homeTeamId: true,
            awayTeamId: true,
            scheduledAt: true,
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
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const cards: DisciplineCard[] = events.map((event) => ({
      id: event.id,
      matchId: event.matchId,
      playerId: event.playerId!,
      teamId: event.teamId!,
      type: event.type as 'YELLOW_CARD' | 'RED_CARD',
      minute: event.minute ?? undefined,
      createdAt: event.createdAt,
      player: event.player!,
      team: event.team!,
      match: {
        ...event.match,
        scheduledFor: event.match.scheduledAt,
      },
    }));

    const totalYellowCards = cards.filter((c) => c.type === 'YELLOW_CARD').length;
    const totalRedCards = cards.filter((c) => c.type === 'RED_CARD').length;

    return {
      playerId: player.id,
      playerName: player.name,
      totalYellowCards,
      totalRedCards,
      cards,
    };
  }

  async getPlayerFullDiscipline(playerId: string): Promise<PlayerDisciplineHistory> {
    const player = await this.prisma.player.findUnique({
      where: { id: playerId },
      select: { id: true, name: true },
    });

    if (!player) {
      throw new Error('Player not found');
    }

    const events = await this.prisma.matchEvent.findMany({
      where: {
        playerId,
        type: {
          in: ['YELLOW_CARD', 'RED_CARD'],
        },
        teamId: { not: null },
      },
      include: {
        player: {
          select: {
            id: true,
            name: true,
          },
        },
        team: {
          select: {
            id: true,
            name: true,
          },
        },
        match: {
          select: {
            id: true,
            homeTeamId: true,
            awayTeamId: true,
            scheduledAt: true,
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
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const cards: DisciplineCard[] = events.map((event) => ({
      id: event.id,
      matchId: event.matchId,
      playerId: event.playerId!,
      teamId: event.teamId!,
      type: event.type as 'YELLOW_CARD' | 'RED_CARD',
      minute: event.minute ?? undefined,
      createdAt: event.createdAt,
      player: event.player!,
      team: event.team!,
      match: {
        ...event.match,
        scheduledFor: event.match.scheduledAt,
      },
    }));

    const totalYellowCards = cards.filter((c) => c.type === 'YELLOW_CARD').length;
    const totalRedCards = cards.filter((c) => c.type === 'RED_CARD').length;

    return {
      playerId: player.id,
      playerName: player.name,
      totalYellowCards,
      totalRedCards,
      cards,
    };
  }
}

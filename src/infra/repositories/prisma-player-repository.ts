import { PrismaClient } from '@prisma/client';

import { prisma } from '../prisma/client.js';
import { PlayerRepository } from '../../data/protocols/player-repository.js';
import { AddPlayerInput } from '../../domain/usecases/add-player.js';
import { IPlayerRepository } from '../../domain/repositories/player.repository.interface.js';
import { PLAYER_LITE_SELECT } from '../prisma/selects.js';

export class PrismaPlayerRepository implements PlayerRepository, IPlayerRepository {
  private prisma: PrismaClient;

  constructor(prismaClient?: PrismaClient) {
    this.prisma = prismaClient ?? prisma;
  }

  async add(data: AddPlayerInput): Promise<{ id: string }> {
    const teamIds = (data.teamIds ?? []).filter(Boolean);
    const created = await this.prisma.player.create({
      data: {
        name: data.name,
        number: data.number ?? null,
        isActive: data.isActive ?? true,
        photo: data.photo ?? null,
        positionSlug: data.positionSlug ?? null,
        teams: teamIds.length ? { create: teamIds.map((teamId) => ({ teamId })) } : undefined,
      },
      select: { id: true },
    });
    return created;
  }

  async addForUser(userId: string, data: AddPlayerInput): Promise<{ id: string }> {
    const teamIds = (data.teamIds ?? []).filter(Boolean);
    return this.prisma.player.create({
      data: {
        name: data.name,
        positionSlug: data.positionSlug ?? null,
        number: data.number ?? null,
        isActive: data.isActive ?? true,
        userId,
        photo: data.photo ?? null,
        teams: teamIds.length ? { create: teamIds.map((teamId) => ({ teamId })) } : undefined,
      },
      select: { id: true },
    });
  }

  async findByUserId(userId: string): Promise<{
    id: string;
    name: string;
    positionSlug?: string | null;
    position?: { slug: string; name: string; description?: string | null } | null;
    number?: number | null;
    isActive: boolean;
  } | null> {
    const player = await this.prisma.player.findUnique({
      where: { userId },
      select: {
        id: true,
        name: true,
        photo: true,
        positionSlug: true,
        number: true,
        isActive: true,
        position: { select: { slug: true, name: true, description: true } },
      },
    });
    return player;
  }

  async getTeamIds(playerId: string): Promise<string[]> {
    const playerTeams = await this.prisma.playersOnTeams.findMany({
      where: { playerId },
      select: { teamId: true },
    });
    return playerTeams.map((pt) => pt.teamId);
  }

  async linkToTeam(playerId: string, teamId: string, assignedBy: string): Promise<void> {
    // Buscar o userId do player
    const player = await this.prisma.player.findUnique({
      where: { id: playerId },
      select: { userId: true },
    });

    // Criar relação PlayersOnTeams
    await this.prisma.playersOnTeams.create({
      data: {
        playerId,
        teamId,
        assignedBy,
      },
    });

    // Criar AccessMembership com role PLAYER (se o player tiver userId)
    if (player?.userId) {
      // Verificar se já existe membership para evitar duplicatas
      const existingMembership = await this.prisma.accessMembership.findFirst({
        where: {
          userId: player.userId,
          teamId,
          role: 'PLAYER',
        },
      });

      if (!existingMembership) {
        await this.prisma.accessMembership.create({
          data: {
            userId: player.userId,
            teamId,
            role: 'PLAYER',
          },
        });
      }
    }
  }

  // Clean Arch adapter: listagem/paginação por time
  async countByTeam(teamId: string): Promise<number> {
    return this.prisma.player.count({ where: { teams: { some: { teamId } } } });
  }

  async listByTeam(query: {
    teamId: string;
    page: number;
    limit: number;
    sort: 'name' | 'number' | 'positionSlug' | 'isActive';
    order: 'asc' | 'desc';
  }): Promise<
    {
      id: string;
      name: string;
      positionSlug: string | null;
      number: number | null;
      isActive: boolean;
    }[]
  > {
    const { teamId, page, limit, sort, order } = query;
    const skip = (page - 1) * limit;
    const orderBy = { [sort]: order } as Record<string, 'asc' | 'desc'>;
    const where = { teams: { some: { teamId } } } as const;
    const rows = await this.prisma.player.findMany({
      where,
      orderBy,
      skip,
      take: limit,
      select: PLAYER_LITE_SELECT,
    });
    return rows;
  }
}

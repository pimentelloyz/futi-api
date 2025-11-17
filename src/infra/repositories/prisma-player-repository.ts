import { PrismaClient } from '@prisma/client';

import { prisma } from '../prisma/client.js';
import { PlayerRepository } from '../../data/protocols/player-repository.js';
import { AddPlayerInput } from '../../domain/usecases/add-player.js';
import { IPlayerRepository } from '../../domain/repositories/player.repository.interface.js';

export class PrismaPlayerRepository implements PlayerRepository, IPlayerRepository {
  private prisma: PrismaClient;

  constructor(prismaClient?: PrismaClient) {
    this.prisma = prismaClient ?? prisma;
  }

  async add(data: AddPlayerInput): Promise<{ id: string }> {
    const connectTeams = (data.teamIds ?? []).map((id) => ({ id }));
    const db = this.prisma as unknown as {
      player: {
        create: (args: {
          data: {
            name: string;
            number: number | null;
            isActive: boolean;
            photo: string | null;
            positionSlug: string | null;
            teams?: { connect: Array<{ id: string }> };
          };
          select: { id: true };
        }) => Promise<{ id: string }>;
      };
    };
    const created = await db.player.create({
      data: {
        name: data.name,
        number: data.number ?? null,
        isActive: data.isActive ?? true,
        photo: data.photo ?? null,
        positionSlug: data.positionSlug ?? null,
        teams: connectTeams.length ? { connect: connectTeams } : undefined,
      },
      select: { id: true },
    });
    return created;
  }

  async addForUser(userId: string, data: AddPlayerInput): Promise<{ id: string }> {
    const connectTeams = (data.teamIds ?? []).map((id) => ({ id }));
    const db = this.prisma as unknown as {
      player: {
        create: (args: {
          data: {
            name: string;
            positionSlug: string | null;
            number: number | null;
            isActive: boolean;
            userId: string;
            photo: string | null;
            teams?: { connect: Array<{ id: string }> };
          };
          select: { id: true };
        }) => Promise<{ id: string }>;
      };
    };
    return db.player.create({
      data: {
        name: data.name,
        positionSlug: data.positionSlug ?? null,
        number: data.number ?? null,
        isActive: data.isActive ?? true,
        userId,
        photo: data.photo ?? null,
        teams: connectTeams.length ? { connect: connectTeams } : undefined,
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
    const db = this.prisma as unknown as {
      player: {
        findUnique: (args: {
          where: { userId: string };
          select: {
            id: true;
            name: true;
            photo: true;
            positionSlug: true;
            number: true;
            isActive: true;
            position: { select: { slug: true; name: true; description: true } };
          };
        }) => Promise<{
          id: string;
          name: string;
          photo: string | null;
          positionSlug: string | null;
          number: number | null;
          isActive: boolean;
          position: { slug: string; name: string; description: string | null } | null;
        } | null>;
      };
    };
    const player = await db.player.findUnique({
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
    await this.prisma.playersOnTeams.create({
      data: {
        playerId,
        teamId,
        assignedBy,
      },
    });
  }
}

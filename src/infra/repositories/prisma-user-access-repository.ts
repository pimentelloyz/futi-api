import { PrismaClient } from '@prisma/client';

import { prisma } from '../prisma/client.js';
import { IUserAccessRepository } from '../../domain/repositories/user-access.repository.interface.js';

export class PrismaUserAccessRepository implements IUserAccessRepository {
  private prisma: PrismaClient;

  constructor(prismaClient?: PrismaClient) {
    this.prisma = prismaClient ?? prisma;
  }

  async getTeamIdsByUserId(userId: string): Promise<string[]> {
    const [accessMemberships, player] = await Promise.all([
      this.prisma.accessMembership.findMany({
        where: { userId, teamId: { not: null } },
        select: { teamId: true },
      }),
      this.prisma.player.findUnique({
        where: { userId },
        select: { id: true },
      }),
    ]);

    let playerTeams: Array<{ teamId: string }> = [];
    if (player) {
      playerTeams = await this.prisma.playersOnTeams.findMany({
        where: { playerId: player.id },
        select: { teamId: true },
      });
    }

    const teamIds = Array.from(
      new Set([
        ...accessMemberships.map((a) => a.teamId).filter((id): id is string => id !== null),
        ...playerTeams.map((p) => p.teamId),
      ]),
    );

    return teamIds;
  }
}

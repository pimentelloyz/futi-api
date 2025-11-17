import { PrismaClient } from '@prisma/client';

import { prisma } from '../prisma/client.js';
import { ILeagueRepository } from '../../domain/repositories/league.repository.interface.js';

export class PrismaLeagueRepository implements ILeagueRepository {
  private prisma: PrismaClient;

  constructor(prismaClient?: PrismaClient) {
    this.prisma = prismaClient ?? prisma;
  }

  async exists(leagueId: string): Promise<boolean> {
    const count = await this.prisma.league.count({ where: { id: leagueId } });
    return count > 0;
  }
}

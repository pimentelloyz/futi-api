import { PrismaClient } from '@prisma/client';

import { prisma } from '../prisma/client.js';
import { TeamBasic, TeamRepository } from '../../data/protocols/team-repository.js';
import { AddTeamInput } from '../../domain/usecases/add-team.js';
import { ITeamRepository } from '../../domain/repositories/team.repository.interface.js';

export class PrismaTeamRepository implements TeamRepository, ITeamRepository {
  private prisma: PrismaClient;

  constructor(prismaClient?: PrismaClient) {
    this.prisma = prismaClient ?? prisma;
  }

  async add(data: AddTeamInput): Promise<{ id: string }> {
    const created = await this.prisma.team.create({
      data: {
        name: data.name,
        icon: data.icon ?? null,
        description: data.description ?? null,
        isActive: data.isActive ?? true,
      },
      select: { id: true },
    });
    return created;
  }

  async list(params?: { isActive?: boolean }): Promise<TeamBasic[]> {
    const where = params?.isActive == null ? {} : { isActive: params.isActive };
    const items = await this.prisma.team.findMany({
      where,
      orderBy: { name: 'asc' },
      select: { id: true, name: true, icon: true, description: true, isActive: true },
    });
    return items as TeamBasic[];
  }

  async exists(teamId: string): Promise<boolean> {
    const count = await this.prisma.team.count({ where: { id: teamId } });
    return count > 0;
  }

  async getLeagueIds(teamId: string): Promise<string[]> {
    const leagueTeams = await this.prisma.leagueTeam.findMany({
      where: { teamId },
      select: { leagueId: true },
    });
    return leagueTeams.map((lt) => lt.leagueId);
  }

  async linkToLeague(teamId: string, leagueId: string): Promise<void> {
    await this.prisma.leagueTeam.create({
      data: { teamId, leagueId },
    });
  }
}

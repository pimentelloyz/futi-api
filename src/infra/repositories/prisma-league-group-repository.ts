import type { PrismaClient } from '@prisma/client';

import type {
  ILeagueGroupRepository,
  LeagueGroup,
} from '../../domain/repositories/league-group.repository.interface.js';

export class PrismaLeagueGroupRepository implements ILeagueGroupRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: string): Promise<LeagueGroup | null> {
    const group = await this.prisma.leagueGroup.findUnique({
      where: { id },
      include: {
        teams: {
          include: {
            team: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!group) return null;

    return {
      id: group.id,
      leagueId: group.leagueId,
      name: group.name,
      teams: group.teams.map((t) => ({
        id: t.id,
        teamId: t.teamId,
        team: t.team,
      })),
    };
  }

  async create(data: { leagueId: string; name: string }) {
    const group = await this.prisma.leagueGroup.create({
      data: {
        leagueId: data.leagueId,
        name: data.name,
      },
    });

    return {
      id: group.id,
      leagueId: group.leagueId,
      name: group.name,
    };
  }

  async addTeam(data: { groupId: string; teamId: string }) {
    const entry = await this.prisma.leagueGroupTeam.create({
      data: {
        groupId: data.groupId,
        teamId: data.teamId,
      },
    });

    return {
      id: entry.id,
      groupId: entry.groupId,
      teamId: entry.teamId,
    };
  }

  async teamExistsInGroup(groupId: string, teamId: string): Promise<boolean> {
    const count = await this.prisma.leagueGroupTeam.count({
      where: {
        groupId,
        teamId,
      },
    });
    return count > 0;
  }
}

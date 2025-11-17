import type { PrismaClient } from '@prisma/client';

import type {
  ILeagueTeamRepository,
  LeagueTeam,
} from '../../domain/repositories/league-team.repository.interface.js';

export class PrismaLeagueTeamRepository implements ILeagueTeamRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findByLeagueId(leagueId: string): Promise<LeagueTeam[]> {
    const teams = await this.prisma.leagueTeam.findMany({
      where: { leagueId },
      include: {
        team: {
          select: {
            id: true,
            name: true,
            icon: true,
          },
        },
      },
      orderBy: { team: { name: 'asc' } },
    });

    return teams.map((t) => ({
      id: t.id,
      leagueId: t.leagueId,
      teamId: t.teamId,
      division: t.division,
      team: t.team,
    }));
  }

  async add(data: { leagueId: string; teamId: string; division?: string | null }) {
    const result = await this.prisma.leagueTeam.create({
      data: {
        leagueId: data.leagueId,
        teamId: data.teamId,
        division: data.division,
      },
    });

    return {
      id: result.id,
      leagueId: result.leagueId,
      teamId: result.teamId,
      division: result.division,
    };
  }

  async exists(leagueId: string, teamId: string): Promise<boolean> {
    const count = await this.prisma.leagueTeam.count({
      where: {
        leagueId,
        teamId,
      },
    });
    return count > 0;
  }
}

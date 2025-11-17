import type { PrismaClient } from '@prisma/client';

import type {
  IMatchRepository,
  Match,
} from '../../domain/repositories/match.repository.interface.js';

export class PrismaLeagueFixturesRepository implements IMatchRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async createBulk(
    matches: Array<{
      homeTeamId: string;
      awayTeamId: string;
      scheduledAt: Date;
      leagueId: string;
      groupId: string;
    }>,
  ): Promise<Match[]> {
    const created: Match[] = [];

    for (const match of matches) {
      const result = await this.prisma.match.create({
        data: {
          homeTeamId: match.homeTeamId,
          awayTeamId: match.awayTeamId,
          scheduledAt: match.scheduledAt,
          leagueId: match.leagueId,
          groupId: match.groupId,
        },
      });

      created.push({
        id: result.id,
        homeTeamId: result.homeTeamId,
        awayTeamId: result.awayTeamId,
        scheduledAt: result.scheduledAt,
        leagueId: result.leagueId!,
        groupId: result.groupId!,
      });
    }

    return created;
  }
}

import { ILeagueGroupRepository } from '../../repositories/league-group.repository.interface.js';
import { IMatchRepository } from '../../repositories/match.repository.interface.js';

import { GenerateFixturesInput, GenerateFixturesOutput } from './generate-fixtures.dto.js';

export class GenerateFixturesUseCase {
  constructor(
    private readonly leagueGroupRepository: ILeagueGroupRepository,
    private readonly matchRepository: IMatchRepository,
  ) {}

  async execute(input: GenerateFixturesInput): Promise<GenerateFixturesOutput> {
    const group = await this.leagueGroupRepository.findById(input.groupId);
    if (!group || group.leagueId !== input.leagueId) {
      throw new Error('GROUP_NOT_FOUND');
    }

    const teamIds = group.teams.map((t) => t.teamId);
    const rounds = this.roundRobinPairs(teamIds);

    // Create matches starting tomorrow, spacing 7 days per round
    const matchesToCreate: Array<{
      homeTeamId: string;
      awayTeamId: string;
      scheduledAt: Date;
      leagueId: string;
      groupId: string;
    }> = [];

    const start = new Date();
    start.setDate(start.getDate() + 1);

    for (let r = 0; r < rounds.length; r++) {
      const day = new Date(start);
      day.setDate(start.getDate() + r * 7);

      for (const [home, away] of rounds[r]) {
        matchesToCreate.push({
          homeTeamId: home,
          awayTeamId: away,
          scheduledAt: day,
          leagueId: input.leagueId,
          groupId: input.groupId,
        });
      }
    }

    const matches = await this.matchRepository.createBulk(matchesToCreate);

    return {
      count: matches.length,
      matches: matches.map((m) => ({
        id: m.id,
        homeTeamId: m.homeTeamId,
        awayTeamId: m.awayTeamId,
        scheduledAt: m.scheduledAt,
        leagueId: m.leagueId,
        groupId: m.groupId!,
      })),
    };
  }

  private roundRobinPairs(teams: string[]): Array<Array<[string, string]>> {
    const n = teams.length;
    if (n < 2) return [];

    const players = teams.slice();
    if (n % 2 === 1) players.push('__BYE__');

    const m = players.length;
    const rounds: Array<Array<[string, string]>> = [];

    for (let round = 0; round < m - 1; round++) {
      const pairs: Array<[string, string]> = [];
      for (let i = 0; i < m / 2; i++) {
        const a = players[i];
        const b = players[m - 1 - i];
        if (a !== '__BYE__' && b !== '__BYE__') {
          pairs.push([a, b]);
        }
      }
      // Rotate
      players.splice(1, 0, players.pop()!);
      rounds.push(pairs);
    }

    return rounds;
  }
}

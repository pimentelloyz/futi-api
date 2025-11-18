import {
  PlayerRepository,
  PlayerLite,
  ListTeamPlayersQuery,
} from '../repositories/player-repository.js';
import { TeamRepository } from '../repositories/team-repository.js';

export type ListTeamPlayersInput = ListTeamPlayersQuery & { includeTeam?: boolean };

export type ListTeamPlayersOutput = {
  items: PlayerLite[];
  page: number;
  limit: number;
  total: number;
  team?: { id: string; name: string };
};

export class ListTeamPlayersUseCase {
  constructor(
    private readonly players: PlayerRepository,
    private readonly teams: TeamRepository,
  ) {}

  async execute(input: ListTeamPlayersInput): Promise<{ statusCode: number; body: unknown }> {
    const { teamId, page, limit, sort, order, includeTeam } = input;
    if (!teamId) return { statusCode: 400, body: { error: 'invalid_team_id' } };

    const team = await this.teams.getMeta(teamId);
    if (!team || team.isActive === false)
      return { statusCode: 404, body: { error: 'team_not_found' } };

    const total = await this.players.countByTeam(teamId);
    const items = await this.players.listByTeam({ teamId, page, limit, sort, order });

    const payload: ListTeamPlayersOutput = { items, page, limit, total };
    if (includeTeam) payload.team = { id: team.id, name: team.name };

    return { statusCode: 200, body: payload };
  }
}

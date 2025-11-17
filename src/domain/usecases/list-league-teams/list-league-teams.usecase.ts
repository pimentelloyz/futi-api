import { ILeagueRepository } from '../../repositories/league.repository.interface.js';
import { ILeagueTeamRepository } from '../../repositories/league-team.repository.interface.js';

import { ListLeagueTeamsInput, ListLeagueTeamsOutput } from './list-league-teams.dto.js';

export class ListLeagueTeamsUseCase {
  constructor(
    private readonly leagueRepository: ILeagueRepository,
    private readonly leagueTeamRepository: ILeagueTeamRepository,
  ) {}

  async execute(input: ListLeagueTeamsInput): Promise<ListLeagueTeamsOutput> {
    const leagueExists = await this.leagueRepository.exists(input.leagueId);
    if (!leagueExists) {
      throw new Error('LEAGUE_NOT_FOUND');
    }

    const teams = await this.leagueTeamRepository.findByLeagueId(input.leagueId);

    return { teams };
  }
}

import { ILeagueRepository } from '../../repositories/league.repository.interface.js';
import { ILeagueTeamRepository } from '../../repositories/league-team.repository.interface.js';

import { AddTeamToLeagueInput, AddTeamToLeagueOutput } from './add-team-to-league.dto.js';

export class AddTeamToLeagueUseCase {
  constructor(
    private readonly leagueRepository: ILeagueRepository,
    private readonly leagueTeamRepository: ILeagueTeamRepository,
  ) {}

  async execute(input: AddTeamToLeagueInput): Promise<AddTeamToLeagueOutput> {
    const leagueExists = await this.leagueRepository.exists(input.leagueId);
    if (!leagueExists) {
      throw new Error('LEAGUE_NOT_FOUND');
    }

    const alreadyLinked = await this.leagueTeamRepository.exists(input.leagueId, input.teamId);
    if (alreadyLinked) {
      throw new Error('TEAM_ALREADY_IN_LEAGUE');
    }

    const result = await this.leagueTeamRepository.add({
      leagueId: input.leagueId,
      teamId: input.teamId,
      division: input.division,
    });

    return result;
  }
}

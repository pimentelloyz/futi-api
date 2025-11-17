import { ILeagueRepository } from '../../repositories/league.repository.interface.js';
import { IUserAccessRepository } from '../../repositories/user-access.repository.interface.js';

import { GetMyLeagueDetailsInput, GetMyLeagueDetailsOutput } from './get-my-league-details.dto.js';

export class GetMyLeagueDetailsUseCase {
  constructor(
    private readonly leagueRepository: ILeagueRepository,
    private readonly userAccessRepository: IUserAccessRepository,
  ) {}

  async execute(input: GetMyLeagueDetailsInput): Promise<GetMyLeagueDetailsOutput> {
    const teamIds = await this.userAccessRepository.getTeamIdsByUserId(input.userId);

    if (teamIds.length === 0) {
      throw new Error('LEAGUE_NOT_FOUND');
    }

    const league = await this.leagueRepository.findByIdWithDetails(input.leagueId, teamIds);

    if (!league) {
      throw new Error('LEAGUE_NOT_FOUND');
    }

    return league;
  }
}

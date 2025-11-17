import { ILeagueRepository } from '../../repositories/league.repository.interface.js';
import { IUserAccessRepository } from '../../repositories/user-access.repository.interface.js';

import { ListMyLeaguesInput, ListMyLeaguesOutput } from './list-my-leagues.dto.js';

export class ListMyLeaguesUseCase {
  constructor(
    private readonly leagueRepository: ILeagueRepository,
    private readonly userAccessRepository: IUserAccessRepository,
  ) {}

  async execute(input: ListMyLeaguesInput): Promise<ListMyLeaguesOutput> {
    const teamIds = await this.userAccessRepository.getTeamIdsByUserId(input.userId);

    if (teamIds.length === 0) {
      return { leagues: [] };
    }

    const leagues = await this.leagueRepository.listByTeamIds(teamIds);

    return {
      leagues: leagues.map((league) => ({
        id: league.id,
        name: league.name,
        slug: league.slug,
        description: league.description,
        isActive: league.isActive,
      })),
    };
  }
}

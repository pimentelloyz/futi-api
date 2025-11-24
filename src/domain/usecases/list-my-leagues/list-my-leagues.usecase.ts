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

    const enrichedLeagues = await this.leagueRepository.listByTeamIdsEnriched(
      teamIds,
      input.userId,
      input.role,
    );

    return {
      leagues: enrichedLeagues.map(({ league, format, teamsCount, myRole }) => ({
        id: league.id,
        name: league.name,
        slug: league.slug,
        description: league.description,
        isActive: league.isActive,
        isPublic: league.isPublic,
        icon: league.icon,
        banner: league.banner,
        startAt: league.startAt,
        endAt: league.endAt,
        format,
        teamsCount,
        myRole,
      })),
    };
  }
}

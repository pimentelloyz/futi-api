import { ILeagueRepository } from '../../repositories/league.repository.interface.js';

import { GetLeagueInput, GetLeagueOutput } from './get-league.dto.js';

export class GetLeagueUseCase {
  constructor(private readonly leagueRepository: ILeagueRepository) {}

  async execute(input: GetLeagueInput): Promise<GetLeagueOutput> {
    // Try to find by ID first, then by slug
    let league = await this.leagueRepository.findById(input.identifier);

    if (!league) {
      league = await this.leagueRepository.findBySlug(input.identifier);
    }

    if (!league) {
      throw new Error('LEAGUE_NOT_FOUND');
    }

    return {
      id: league.id,
      name: league.name,
      slug: league.slug,
      description: league.description,
      icon: league.icon,
      banner: league.banner,
      startAt: league.startAt,
      endAt: league.endAt,
      isActive: league.isActive,
      isPublic: league.isPublic,
      isOngoing: league.isOngoing(),
      matchFormat: league.matchFormat as any,
      createdAt: league.createdAt,
      updatedAt: league.updatedAt,
    };
  }
}

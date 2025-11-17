import { ILeagueRepository } from '../../repositories/league.repository.interface.js';

import { UpdateLeagueInput, UpdateLeagueOutput } from './update-league.dto.js';

export class UpdateLeagueUseCase {
  constructor(private readonly leagueRepository: ILeagueRepository) {}

  async execute(input: UpdateLeagueInput): Promise<UpdateLeagueOutput> {
    const league = await this.leagueRepository.findById(input.leagueId);
    if (!league) {
      throw new Error('LEAGUE_NOT_FOUND');
    }

    // Check slug uniqueness if changing
    if (input.slug && input.slug !== league.slug) {
      const existing = await this.leagueRepository.findBySlug(input.slug);
      if (existing) {
        throw new Error('SLUG_ALREADY_EXISTS');
      }
    }

    const updated = await this.leagueRepository.update(input.leagueId, {
      name: input.name,
      slug: input.slug,
      description: input.description,
      startAt: input.startAt,
      endAt: input.endAt,
      isActive: input.isActive,
      icon: input.icon,
      banner: input.banner,
    });

    return {
      id: updated.id,
      name: updated.name,
      slug: updated.slug,
    };
  }
}

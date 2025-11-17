import { ILeagueRepository } from '../../repositories/league.repository.interface.js';

import { CreateLeagueInput, CreateLeagueOutput } from './create-league.dto.js';

export class CreateLeagueUseCase {
  constructor(private readonly leagueRepository: ILeagueRepository) {}

  async execute(input: CreateLeagueInput): Promise<CreateLeagueOutput> {
    // Check if slug already exists
    const existing = await this.leagueRepository.findBySlug(input.slug);
    if (existing) {
      throw new Error('SLUG_ALREADY_EXISTS');
    }

    const league = await this.leagueRepository.create({
      name: input.name,
      slug: input.slug,
      description: input.description,
      icon: input.icon,
      banner: input.banner,
      startAt: input.startAt,
      endAt: input.endAt,
      isPublic: input.isPublic,
    });

    return {
      id: league.id,
      name: league.name,
      slug: league.slug,
    };
  }
}

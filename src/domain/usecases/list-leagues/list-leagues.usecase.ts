import { ILeagueRepository } from '../../repositories/league.repository.interface.js';

import { ListLeaguesInput, ListLeaguesOutput } from './list-leagues.dto.js';

export class ListLeaguesUseCase {
  constructor(private readonly leagueRepository: ILeagueRepository) {}

  async execute(input: ListLeaguesInput): Promise<ListLeaguesOutput> {
    const page = Math.max(input.page || 1, 1);
    const pageSizeRaw = Math.max(input.pageSize || 20, 1);
    const pageSize = Math.min(pageSizeRaw, 20); // Max 20 per page

    const filters = {
      q: input.q,
      name: input.name,
      slug: input.slug,
      isActive: input.isActive,
      startAtFrom: input.startAtFrom ? new Date(input.startAtFrom) : undefined,
      startAtTo: input.startAtTo ? new Date(input.startAtTo) : undefined,
      endAtFrom: input.endAtFrom ? new Date(input.endAtFrom) : undefined,
      endAtTo: input.endAtTo ? new Date(input.endAtTo) : undefined,
    };

    const pagination = {
      page,
      pageSize,
      orderBy: input.orderBy || 'createdAt',
      order: input.order || (input.orderBy === 'name' ? 'asc' : 'desc'),
    };

    const { items, total } = await this.leagueRepository.list(filters, pagination);

    return {
      items: items.map((league) => ({
        id: league.id,
        name: league.name,
        slug: league.slug,
        description: league.description,
        icon: league.icon,
        banner: league.banner,
        startAt: league.startAt,
        endAt: league.endAt,
        isActive: league.isActive,
        createdAt: league.createdAt,
        updatedAt: league.updatedAt,
      })),
      page,
      pageSize,
      total,
      hasNext: (page - 1) * pageSize + items.length < total,
    };
  }
}

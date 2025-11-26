import { ILeagueRepository } from '../../repositories/league.repository.interface.js';
import { PrismaAccessMembershipRepository } from '../../../infra/repositories/prisma-access-membership-repository.js';
import { AccessRole } from '../../constants/access-roles.js';

import { CreateLeagueInput, CreateLeagueOutput } from './create-league.dto.js';

export class CreateLeagueUseCase {
  constructor(
    private readonly leagueRepository: ILeagueRepository,
    private readonly accessRepository: PrismaAccessMembershipRepository = new PrismaAccessMembershipRepository(),
  ) {}

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
      matchFormat: input.matchFormat || 'FUT11',
    });

    // Criar acesso de LEAGUE_MANAGER para o usuário que criou a liga
    await this.accessRepository.grant(
      input.userId,
      AccessRole.LEAGUE_MANAGER,
      null,
      league.id,
    );

    return {
      id: league.id,
      name: league.name,
      slug: league.slug,
      matchFormat: league.matchFormat as any,
    };
  }
}

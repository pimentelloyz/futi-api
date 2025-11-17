import { ILeagueGroupRepository } from '../../repositories/league-group.repository.interface.js';
import { ILeagueRepository } from '../../repositories/league.repository.interface.js';

import { CreateGroupInput, CreateGroupOutput } from './create-group.dto.js';

export class CreateGroupUseCase {
  constructor(
    private readonly leagueRepository: ILeagueRepository,
    private readonly leagueGroupRepository: ILeagueGroupRepository,
  ) {}

  async execute(input: CreateGroupInput): Promise<CreateGroupOutput> {
    const leagueExists = await this.leagueRepository.exists(input.leagueId);
    if (!leagueExists) {
      throw new Error('LEAGUE_NOT_FOUND');
    }

    const group = await this.leagueGroupRepository.create({
      leagueId: input.leagueId,
      name: input.name,
    });

    return group;
  }
}

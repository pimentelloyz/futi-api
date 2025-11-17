import { ILeagueRepository } from '../../repositories/league.repository.interface.js';

import { DeleteLeagueInput, DeleteLeagueOutput } from './delete-league.dto.js';

export class DeleteLeagueUseCase {
  constructor(private readonly leagueRepository: ILeagueRepository) {}

  async execute(input: DeleteLeagueInput): Promise<DeleteLeagueOutput> {
    const league = await this.leagueRepository.findById(input.leagueId);
    if (!league) {
      throw new Error('LEAGUE_NOT_FOUND');
    }

    await this.leagueRepository.softDelete(input.leagueId);

    return { success: true };
  }
}

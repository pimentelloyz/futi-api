import { IPlayerRepository } from '../../repositories/player.repository.interface.js';
import { CheckPlayerExistsInput, CheckPlayerExistsOutput } from './check-player-exists.dto.js';

export class CheckPlayerExistsUseCase {
  constructor(private readonly playerRepository: IPlayerRepository) {}

  async execute(input: CheckPlayerExistsInput): Promise<CheckPlayerExistsOutput> {
    const player = await this.playerRepository.findByUserId(input.userId);
    
    return {
      exists: !!player,
      playerId: player?.id,
    };
  }
}

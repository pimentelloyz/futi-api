import { AddPlayer, AddPlayerInput } from '../../domain/usecases/add-player.js';
import { PlayerRepository } from '../protocols/player-repository.js';

export class DbAddPlayer implements AddPlayer {
  constructor(private readonly repo: PlayerRepository) {}

  async add(input: AddPlayerInput): Promise<{ id: string }> {
    const isActive = input.isActive ?? true;
    return this.repo.add({ ...input, isActive });
  }
}

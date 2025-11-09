import {
  EnsurePlayerForUser,
  EnsurePlayerForUserInput,
} from '../../domain/usecases/ensure-player-for-user.js';
import { PlayerRepository } from '../protocols/player-repository.js';

export class DbEnsurePlayerForUser implements EnsurePlayerForUser {
  constructor(private readonly repo: PlayerRepository) {}

  async ensure(input: EnsurePlayerForUserInput): Promise<{ id: string }> {
    const existing = await this.repo.findByUserId(input.userId);
    if (existing) return { id: existing.id };
    return this.repo.addForUser(input.userId, input);
  }
}

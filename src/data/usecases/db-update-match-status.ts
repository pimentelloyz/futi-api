import {
  UpdateMatchStatus,
  UpdateMatchStatusInput,
} from '../../domain/usecases/update-match-status.js';
import { MatchRepository } from '../protocols/match-repository.js';

export class DbUpdateMatchStatus implements UpdateMatchStatus {
  constructor(private readonly repo: MatchRepository) {}

  async updateStatus(
    input: UpdateMatchStatusInput,
  ): Promise<{ id: string; status: 'SCHEDULED' | 'IN_PROGRESS' | 'FINISHED' | 'CANCELED' }> {
    return this.repo.updateStatus(input.id, input.status);
  }
}

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
    // regras de transição:
    // SCHEDULED -> IN_PROGRESS | CANCELED
    // IN_PROGRESS -> FINISHED | CANCELED
    // FINISHED/CANCELED -> sem transição
    const current = await this.repo.getById(input.id);
    if (!current) {
      throw new Error('not_found');
    }
    const from = current.status;
    const to = input.status;
    const allowed: Record<string, Array<'SCHEDULED' | 'IN_PROGRESS' | 'FINISHED' | 'CANCELED'>> = {
      SCHEDULED: ['IN_PROGRESS', 'CANCELED'],
      IN_PROGRESS: ['FINISHED', 'CANCELED'],
      FINISHED: [],
      CANCELED: [],
    };
    if (!allowed[from].includes(to)) {
      throw new Error('invalid_transition');
    }
    return this.repo.updateStatus(input.id, input.status);
  }
}

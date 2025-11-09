import {
  UpdateMatchScore,
  UpdateMatchScoreInput,
} from '../../domain/usecases/update-match-score.js';
import { MatchRepository } from '../protocols/match-repository.js';

export class DbUpdateMatchScore implements UpdateMatchScore {
  constructor(private readonly repo: MatchRepository) {}

  async updateScore(input: UpdateMatchScoreInput): Promise<{ id: string }> {
    return this.repo.updateScore(input.id, input.homeScore, input.awayScore);
  }
}

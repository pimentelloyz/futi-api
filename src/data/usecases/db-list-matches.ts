import { ListMatches, ListMatchesParams } from '../../domain/usecases/list-matches.js';
import { MatchRepository } from '../protocols/match-repository.js';

export class DbListMatches implements ListMatches {
  constructor(private readonly repo: MatchRepository) {}

  async list(params: ListMatchesParams & { page?: number; limit?: number }) {
    return this.repo.list(params);
  }
}

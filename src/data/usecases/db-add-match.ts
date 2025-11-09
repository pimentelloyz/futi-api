import { AddMatch, AddMatchInput } from '../../domain/usecases/add-match.js';
import { MatchRepository } from '../protocols/match-repository.js';

export class DbAddMatch implements AddMatch {
  constructor(private readonly repo: MatchRepository) {}

  async add(input: AddMatchInput): Promise<{ id: string }> {
    const data: AddMatchInput = {
      ...input,
      status: input.status ?? 'SCHEDULED',
      homeScore: input.homeScore ?? 0,
      awayScore: input.awayScore ?? 0,
    };
    return this.repo.add(data);
  }
}

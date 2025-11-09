import { ListMatches, ListMatchesParams } from '../../domain/usecases/list-matches.js';
import { MatchRepository } from '../protocols/match-repository.js';

export class DbListMatches implements ListMatches {
  constructor(private readonly repo: MatchRepository) {}

  async list(
    params: ListMatchesParams,
  ): Promise<
    Array<{
      id: string;
      homeTeamId: string;
      awayTeamId: string;
      scheduledAt: Date;
      status: 'SCHEDULED' | 'IN_PROGRESS' | 'FINISHED' | 'CANCELED';
      homeScore: number;
      awayScore: number;
    }>
  > {
    return this.repo.list(params);
  }
}

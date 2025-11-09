import { AddMatchInput } from '../../domain/usecases/add-match.js';

export interface MatchRepository {
  add(data: AddMatchInput): Promise<{ id: string }>;
  list(params: {
    status?: 'SCHEDULED' | 'IN_PROGRESS' | 'FINISHED' | 'CANCELED';
    teamId?: string;
    from?: Date;
    to?: Date;
  }): Promise<
    Array<{
      id: string;
      homeTeamId: string;
      awayTeamId: string;
      scheduledAt: Date;
      status: 'SCHEDULED' | 'IN_PROGRESS' | 'FINISHED' | 'CANCELED';
      homeScore: number;
      awayScore: number;
    }>
  >;
  updateScore(id: string, homeScore: number, awayScore: number): Promise<{ id: string }>;
  updateStatus(
    id: string,
    status: 'SCHEDULED' | 'IN_PROGRESS' | 'FINISHED' | 'CANCELED',
  ): Promise<{ id: string; status: 'SCHEDULED' | 'IN_PROGRESS' | 'FINISHED' | 'CANCELED' }>;
}

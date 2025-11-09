export type MatchStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'FINISHED' | 'CANCELED';

export interface Match {
  id: string;
  homeTeamId: string;
  awayTeamId: string;
  scheduledAt: Date;
  status: MatchStatus;
  homeScore: number;
  awayScore: number;
  createdAt: Date;
  updatedAt: Date;
}

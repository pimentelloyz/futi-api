export type ListMatchesParams = {
  status?: 'SCHEDULED' | 'IN_PROGRESS' | 'FINISHED' | 'CANCELED';
  teamId?: string;
  from?: Date;
  to?: Date;
};

export interface ListMatches {
  list(params: ListMatchesParams): Promise<{
    items: Array<{
      id: string;
      homeTeamId: string;
      awayTeamId: string;
      scheduledAt: Date;
      status: 'SCHEDULED' | 'IN_PROGRESS' | 'FINISHED' | 'CANCELED';
      homeScore: number;
      awayScore: number;
    }>;
    page: number;
    limit: number;
    total: number;
  }>;
}

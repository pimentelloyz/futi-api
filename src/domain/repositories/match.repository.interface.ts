export interface Match {
  id: string;
  homeTeamId: string;
  awayTeamId: string;
  scheduledAt: Date;
  leagueId: string;
  groupId: string | null;
}

export interface IMatchRepository {
  createBulk(
    matches: Array<{
      homeTeamId: string;
      awayTeamId: string;
      scheduledAt: Date;
      leagueId: string;
      groupId: string;
    }>,
  ): Promise<Match[]>;
}

export interface GenerateFixturesInput {
  leagueId: string;
  groupId: string;
}

export interface GenerateFixturesOutput {
  count: number;
  matches: Array<{
    id: string;
    homeTeamId: string;
    awayTeamId: string;
    scheduledAt: Date;
    leagueId: string;
    groupId: string;
  }>;
}

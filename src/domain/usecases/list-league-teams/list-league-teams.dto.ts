export interface ListLeagueTeamsInput {
  leagueId: string;
}

export interface ListLeagueTeamsOutput {
  teams: Array<{
    id: string;
    leagueId: string;
    teamId: string;
    division: string | null;
    team: {
      id: string;
      name: string;
      icon: string | null;
    };
  }>;
}

export interface LeagueTeam {
  id: string;
  leagueId: string;
  teamId: string;
  division: string | null;
  team: {
    id: string;
    name: string;
    icon: string | null;
  };
}

export interface ILeagueTeamRepository {
  findByLeagueId(leagueId: string): Promise<LeagueTeam[]>;

  add(data: { leagueId: string; teamId: string; division?: string | null }): Promise<{
    id: string;
    leagueId: string;
    teamId: string;
    division: string | null;
  }>;

  exists(leagueId: string, teamId: string): Promise<boolean>;
}

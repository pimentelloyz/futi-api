export interface ITeamRepository {
  exists(teamId: string): Promise<boolean>;

  getLeagueIds(teamId: string): Promise<string[]>;

  linkToLeague(teamId: string, leagueId: string): Promise<void>;
}

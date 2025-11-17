export interface ILeagueRepository {
  exists(leagueId: string): Promise<boolean>;
}

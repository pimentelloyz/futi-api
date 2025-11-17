export interface LeagueGroup {
  id: string;
  leagueId: string;
  name: string;
  teams: Array<{
    id: string;
    teamId: string;
    team: {
      id: string;
      name: string;
    };
  }>;
}

export interface ILeagueGroupRepository {
  findById(id: string): Promise<LeagueGroup | null>;

  create(data: { leagueId: string; name: string }): Promise<{
    id: string;
    leagueId: string;
    name: string;
  }>;

  addTeam(data: { groupId: string; teamId: string }): Promise<{
    id: string;
    groupId: string;
    teamId: string;
  }>;

  teamExistsInGroup(groupId: string, teamId: string): Promise<boolean>;
}

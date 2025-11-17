export interface AddTeamToGroupInput {
  leagueId: string;
  groupId: string;
  teamId: string;
}

export interface AddTeamToGroupOutput {
  id: string;
  groupId: string;
  teamId: string;
}

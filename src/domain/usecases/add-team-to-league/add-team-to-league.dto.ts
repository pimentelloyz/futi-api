export interface AddTeamToLeagueInput {
  leagueId: string;
  teamId: string;
  division?: string | null;
}

export interface AddTeamToLeagueOutput {
  id: string;
  leagueId: string;
  teamId: string;
  division: string | null;
}

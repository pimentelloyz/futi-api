export interface ListTeamLeaguesInput {
  teamId: string;
}

export interface LeagueInfo {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  banner: string | null;
  description: string | null;
  isPublic: boolean;
}

export interface ListTeamLeaguesOutput {
  leagues: LeagueInfo[];
}

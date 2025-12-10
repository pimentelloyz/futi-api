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
  format: {
    id: string;
    name: string;
    slug: string;
    type: string;
  } | null;
}

export interface ListTeamLeaguesOutput {
  leagues: LeagueInfo[];
}

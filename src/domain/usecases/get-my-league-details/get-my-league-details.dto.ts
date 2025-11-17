export interface GetMyLeagueDetailsInput {
  userId: string;
  leagueId: string;
}

export interface GetMyLeagueDetailsOutput {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  banner: string | null;
  startAt: Date | null;
  endAt: Date | null;
  isActive: boolean;
  isPublic: boolean;
  teams: Array<{
    id: string;
    teamId: string;
    division: string | null;
    team: {
      id: string;
      name: string;
    };
  }>;
  groups: Array<{
    id: string;
    name: string;
    teams: Array<{
      id: string;
      teamId: string;
      team: {
        id: string;
        name: string;
      };
    }>;
  }>;
}

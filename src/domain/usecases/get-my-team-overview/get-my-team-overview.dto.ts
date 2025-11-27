export interface GetMyTeamOverviewInput {
  userId: string;
  teamId?: string;
}

export interface PlayerLite {
  id: string;
  name: string;
  photo: string | null;
  positionSlug: string | null;
  number: number;
  isActive: boolean;
}

export interface TeamInfo {
  id: string;
  name: string;
  icon: string | null;
}

export interface MatchSummary {
  id: string;
  scheduledAt: Date;
  status: string;
  venue: string | null;
  homeTeamId: string;
  awayTeamId: string;
  homeScore: number;
  awayScore: number;
  homeTeam?: TeamInfo;
  awayTeam?: TeamInfo;
}

export interface EvaluationBanner {
  match: MatchSummary;
  expiresAt: string;
}

export interface UpcomingMatch {
  id: string;
  scheduledAt: Date;
  venue: string | null;
  homeTeamId: string;
  awayTeamId: string;
  homeTeam: TeamInfo;
  awayTeam: TeamInfo;
  status: string;
}

export interface GetMyTeamOverviewOutput {
  team: {
    id: string;
    name: string;
    icon: string | null;
    description: string | null;
    isActive: boolean;
  };
  players: PlayerLite[];
  recentMatches: MatchSummary[];
  upcomingMatches: UpcomingMatch[];
  next_game: UpcomingMatch | null;
  evaluationBanner: EvaluationBanner | null;
}

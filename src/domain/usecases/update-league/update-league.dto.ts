export type MatchFormat = 'FUTSAL' | 'FUT7' | 'FUT11';

export interface UpdateLeagueInput {
  leagueId: string;
  name?: string;
  slug?: string;
  description?: string | null;
  startAt?: Date | null;
  endAt?: Date | null;
  isActive?: boolean;
  icon?: string | null;
  banner?: string | null;
  matchFormat?: MatchFormat;
}

export interface UpdateLeagueOutput {
  id: string;
  name: string;
  slug: string;
  matchFormat: MatchFormat;
}

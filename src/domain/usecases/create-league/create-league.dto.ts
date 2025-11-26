export type MatchFormat = 'FUTSAL' | 'FUT7' | 'FUT11';

export interface CreateLeagueInput {
  userId: string;
  name: string;
  slug: string;
  description?: string | null;
  icon?: string | null;
  banner?: string | null;
  startAt?: Date | null;
  endAt?: Date | null;
  isPublic?: boolean;
  matchFormat?: MatchFormat;
}

export interface CreateLeagueOutput {
  id: string;
  name: string;
  slug: string;
  matchFormat: MatchFormat;
}

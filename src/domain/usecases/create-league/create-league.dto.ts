export interface CreateLeagueInput {
  name: string;
  slug: string;
  description?: string | null;
  icon?: string | null;
  banner?: string | null;
  startAt?: Date | null;
  endAt?: Date | null;
  isPublic?: boolean;
}

export interface CreateLeagueOutput {
  id: string;
  name: string;
  slug: string;
}

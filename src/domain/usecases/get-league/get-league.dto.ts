export interface GetLeagueInput {
  identifier: string; // Can be ID or slug
}

export interface GetLeagueOutput {
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
  isOngoing: boolean;
  createdAt: Date;
  updatedAt: Date;
}

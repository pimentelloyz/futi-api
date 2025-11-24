export interface ListMyLeaguesInput {
  userId: string;
  role?: string;
}

export interface ListMyLeaguesOutput {
  leagues: Array<{
    id: string;
    name: string;
    slug: string;
    description: string | null;
    isActive: boolean;
    isPublic: boolean;
    icon: string | null;
    banner: string | null;
    startAt: Date | null;
    endAt: Date | null;
    format: {
      id: string;
      name: string;
      slug: string;
    } | null;
    teamsCount: number;
    myRole: string;
  }>;
}

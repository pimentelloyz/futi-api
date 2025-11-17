export interface ListMyLeaguesInput {
  userId: string;
}

export interface ListMyLeaguesOutput {
  leagues: Array<{
    id: string;
    name: string;
    slug: string;
    description: string | null;
    isActive: boolean;
  }>;
}

export interface IPlayerRepository {
  findByUserId(userId: string): Promise<{
    id: string;
    name: string;
    positionSlug?: string | null;
    position?: { slug: string; name: string; description?: string | null } | null;
    number?: number | null;
    isActive: boolean;
  } | null>;

  addForUser(userId: string, data: { name: string; isActive?: boolean; positionSlug?: string | null; number?: number | null; photo?: string | null; teamIds?: string[] }): Promise<{ id: string }>;

  getTeamIds(playerId: string): Promise<string[]>;

  linkToTeam(playerId: string, teamId: string, assignedBy: string): Promise<void>;
}

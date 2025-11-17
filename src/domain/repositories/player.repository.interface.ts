export interface IPlayerRepository {
  findByUserId(userId: string): Promise<{
    id: string;
    name: string;
    positionSlug?: string | null;
    position?: { slug: string; name: string; description?: string | null } | null;
    number?: number | null;
    isActive: boolean;
  } | null>;

  getTeamIds(playerId: string): Promise<string[]>;

  linkToTeam(playerId: string, teamId: string, assignedBy: string): Promise<void>;
}

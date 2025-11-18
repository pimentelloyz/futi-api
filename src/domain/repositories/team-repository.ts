export type TeamMeta = { id: string; name: string; isActive: boolean };

export interface TeamRepository {
  getMeta(teamId: string): Promise<TeamMeta | null>;
}

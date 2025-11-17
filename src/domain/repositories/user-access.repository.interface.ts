export interface IUserAccessRepository {
  getTeamIdsByUserId(userId: string): Promise<string[]>;
}

export type PlayerLite = {
  id: string;
  name: string;
  positionSlug: string | null;
  number: number | null;
  isActive: boolean;
};

export interface ListTeamPlayersQuery {
  teamId: string;
  page: number;
  limit: number;
  sort: 'name' | 'number' | 'positionSlug' | 'isActive';
  order: 'asc' | 'desc';
}

export interface PlayerRepository {
  countByTeam(teamId: string): Promise<number>;
  listByTeam(query: ListTeamPlayersQuery): Promise<PlayerLite[]>;
}

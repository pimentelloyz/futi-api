import { League } from '../entities/league.entity.js';

export interface LeagueFilters {
  q?: string;
  name?: string;
  slug?: string;
  isActive?: boolean;
  isPublic?: boolean;
  startAtFrom?: Date;
  startAtTo?: Date;
  endAtFrom?: Date;
  endAtTo?: Date;
}

export interface PaginationParams {
  page: number;
  pageSize: number;
  orderBy?: string;
  order?: 'asc' | 'desc';
}

export type MatchFormat = 'FUTSAL' | 'FUT7' | 'FUT11';

export interface ILeagueRepository {
  create(data: {
    name: string;
    slug: string;
    description?: string | null;
    icon?: string | null;
    banner?: string | null;
    startAt?: Date | null;
    endAt?: Date | null;
    isPublic?: boolean;
    matchFormat?: MatchFormat;
  }): Promise<League>;

  findById(id: string): Promise<League | null>;

  findBySlug(slug: string): Promise<League | null>;

  list(
    filters: LeagueFilters,
    pagination: PaginationParams,
  ): Promise<{ items: League[]; total: number }>;

  listByTeamIds(teamIds: string[]): Promise<League[]>;
  listByTeamIdsEnriched(teamIds: string[], userId: string, role?: string): Promise<Array<{
    league: League;
    format: { id: string; name: string; slug: string } | null;
    teamsCount: number;
    myRole: string;
  }>>;

  update(
    id: string,
    data: {
      name?: string;
      slug?: string;
      description?: string | null;
      startAt?: Date | null;
      endAt?: Date | null;
      isActive?: boolean;
      icon?: string | null;
      banner?: string | null;
      matchFormat?: MatchFormat;
    },
  ): Promise<League>;

  softDelete(id: string): Promise<void>;

  exists(leagueId: string): Promise<boolean>;

  findByIdWithDetails(
    id: string,
    teamIds: string[],
  ): Promise<{
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
    teams: Array<{
      id: string;
      teamId: string;
      division: string | null;
      team: {
        id: string;
        name: string;
      };
    }>;
    groups: Array<{
      id: string;
      name: string;
      teams: Array<{
        id: string;
        teamId: string;
        team: {
          id: string;
          name: string;
        };
      }>;
    }>;
  } | null>;
}

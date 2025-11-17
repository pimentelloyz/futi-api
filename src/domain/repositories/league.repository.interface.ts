import { League } from '../entities/league.entity.js';

export interface LeagueFilters {
  q?: string;
  name?: string;
  slug?: string;
  isActive?: boolean;
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
  }): Promise<League>;

  findById(id: string): Promise<League | null>;

  findBySlug(slug: string): Promise<League | null>;

  list(
    filters: LeagueFilters,
    pagination: PaginationParams,
  ): Promise<{ items: League[]; total: number }>;

  listByTeamIds(teamIds: string[]): Promise<League[]>;

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
    },
  ): Promise<League>;

  softDelete(id: string): Promise<void>;

  exists(leagueId: string): Promise<boolean>;
}

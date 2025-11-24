import { PrismaClient } from '@prisma/client';

import { prisma } from '../prisma/client.js';
import {
  ILeagueRepository,
  LeagueFilters,
  PaginationParams,
} from '../../domain/repositories/league.repository.interface.js';
import { League } from '../../domain/entities/league.entity.js';

export class PrismaLeagueRepository implements ILeagueRepository {
  private prisma: PrismaClient;

  constructor(prismaClient?: PrismaClient) {
    this.prisma = prismaClient ?? prisma;
  }

  async create(data: {
    name: string;
    slug: string;
    description?: string | null;
    icon?: string | null;
    banner?: string | null;
    startAt?: Date | null;
    endAt?: Date | null;
    isPublic?: boolean;
  }): Promise<League> {
    const league = await this.prisma.league.create({
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description,
        icon: data.icon,
        banner: data.banner,
        startAt: data.startAt,
        endAt: data.endAt,
        isPublic: data.isPublic ?? false,
      },
    });
    return this.toDomain(league);
  }

  async findById(id: string): Promise<League | null> {
    const league = await this.prisma.league.findUnique({ where: { id } });
    return league ? this.toDomain(league) : null;
  }

  async findBySlug(slug: string): Promise<League | null> {
    const league = await this.prisma.league.findUnique({ where: { slug } });
    return league ? this.toDomain(league) : null;
  }

  async list(
    filters: LeagueFilters,
    pagination: PaginationParams,
  ): Promise<{ items: League[]; total: number }> {
    const where: Record<string, unknown> = {};
    const andClauses: Array<Record<string, unknown>> = [];

    if (filters.q) {
      andClauses.push({
        OR: [
          { name: { contains: filters.q, mode: 'insensitive' } },
          { slug: { contains: filters.q, mode: 'insensitive' } },
        ],
      });
    }
    if (filters.name) andClauses.push({ name: { contains: filters.name, mode: 'insensitive' } });
    if (filters.slug) andClauses.push({ slug: { contains: filters.slug, mode: 'insensitive' } });
    if (filters.isActive !== undefined) andClauses.push({ isActive: filters.isActive });
    if (filters.isPublic !== undefined) andClauses.push({ isPublic: filters.isPublic });
    if (filters.startAtFrom || filters.startAtTo) {
      const range: Record<string, Date> = {};
      if (filters.startAtFrom) range.gte = filters.startAtFrom;
      if (filters.startAtTo) range.lte = filters.startAtTo;
      if (Object.keys(range).length) andClauses.push({ startAt: range });
    }
    if (filters.endAtFrom || filters.endAtTo) {
      const range: Record<string, Date> = {};
      if (filters.endAtFrom) range.gte = filters.endAtFrom;
      if (filters.endAtTo) range.lte = filters.endAtTo;
      if (Object.keys(range).length) andClauses.push({ endAt: range });
    }
    if (andClauses.length) where.AND = andClauses;

    const skip = (pagination.page - 1) * pagination.pageSize;
    const orderByField = pagination.orderBy || 'createdAt';
    const order = pagination.order || (orderByField === 'name' ? 'asc' : 'desc');

    const [total, leagues] = await Promise.all([
      this.prisma.league.count({ where: where as never }),
      this.prisma.league.findMany({
        where: where as never,
        orderBy: { [orderByField]: order } as never,
        skip,
        take: pagination.pageSize,
      }),
    ]);

    return {
      items: leagues.map((l) => this.toDomain(l)),
      total,
    };
  }

  async listByTeamIds(teamIds: string[]): Promise<League[]> {
    if (teamIds.length === 0) return [];

    const leagues = await this.prisma.league.findMany({
      where: { teams: { some: { teamId: { in: teamIds } } } },
      orderBy: { name: 'asc' },
    });

    return leagues.map((l) => this.toDomain(l));
  }

  async listByTeamIdsEnriched(
    teamIds: string[],
    userId: string,
    role?: string,
  ): Promise<Array<{
    league: League;
    format: { id: string; name: string; slug: string } | null;
    teamsCount: number;
    myRole: string;
  }>> {
    if (teamIds.length === 0) return [];

    const leagues = await this.prisma.league.findMany({
      where: { teams: { some: { teamId: { in: teamIds } } } },
      include: {
        format: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        _count: {
          select: {
            teams: true,
          },
        },
        accessMemberships: {
          where: {
            userId,
            ...(role && { role }),
          },
          select: {
            role: true,
          },
          take: 1,
        },
      },
      orderBy: { name: 'asc' },
    });

    return leagues.map((l) => ({
      league: this.toDomain(l),
      format: l.format,
      teamsCount: l._count.teams,
      myRole: l.accessMemberships[0]?.role || 'UNKNOWN',
    }));
  }

  async update(
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
  ): Promise<League> {
    const league = await this.prisma.league.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.slug !== undefined && { slug: data.slug }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.startAt !== undefined && { startAt: data.startAt }),
        ...(data.endAt !== undefined && { endAt: data.endAt }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
        ...(data.icon !== undefined && { icon: data.icon }),
        ...(data.banner !== undefined && { banner: data.banner }),
      },
    });
    return this.toDomain(league);
  }

  async softDelete(id: string): Promise<void> {
    await this.prisma.league.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async exists(leagueId: string): Promise<boolean> {
    const count = await this.prisma.league.count({ where: { id: leagueId } });
    return count > 0;
  }

  async findByIdWithDetails(id: string, teamIds: string[]) {
    const league = await this.prisma.league.findFirst({
      where: {
        id,
        teams: { some: { teamId: { in: teamIds } } },
      },
      include: {
        teams: {
          include: {
            team: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        groups: {
          include: {
            teams: {
              include: {
                team: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!league) return null;

    return {
      id: league.id,
      name: league.name,
      slug: league.slug,
      description: league.description,
      icon: league.icon,
      banner: league.banner,
      startAt: league.startAt,
      endAt: league.endAt,
      isActive: league.isActive,
      isPublic: league.isPublic,
      teams: league.teams.map((lt) => ({
        id: lt.id,
        teamId: lt.teamId,
        division: lt.division,
        team: lt.team,
      })),
      groups: league.groups.map((g) => ({
        id: g.id,
        name: g.name,
        teams: g.teams.map((t) => ({
          id: t.id,
          teamId: t.teamId,
          team: t.team,
        })),
      })),
    };
  }

  private toDomain(league: {
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
    createdAt: Date;
    updatedAt: Date;
  }): League {
    return new League(
      league.id,
      league.name,
      league.slug,
      league.description,
      league.icon,
      league.banner,
      league.startAt,
      league.endAt,
      league.isActive,
      league.isPublic,
      league.createdAt,
      league.updatedAt,
    );
  }
}

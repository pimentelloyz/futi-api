import type { PrismaClient, League } from '@prisma/client';

export interface CreateLeagueDTO {
  name: string;
  slug: string;
  description?: string | null;
  icon?: string | null;
  banner?: string | null;
  startAt?: Date | null;
  endAt?: Date | null;
  isActive?: boolean;
  isPublic?: boolean;
}

export interface UpdateLeagueDTO {
  name?: string;
  slug?: string;
  description?: string | null;
  icon?: string | null;
  banner?: string | null;
  startAt?: Date | null;
  endAt?: Date | null;
  isActive?: boolean;
  isPublic?: boolean;
}

export interface ListLeaguesFilters {
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
  page?: number;
  pageSize?: number;
  orderBy?: string;
  order?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  hasNext: boolean;
}

export class LeagueService {
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Cria uma nova liga
   */
  async createLeague(data: CreateLeagueDTO): Promise<League> {
    // Validações
    if (!data.name || data.name.trim().length === 0) {
      throw new Error('League name is required');
    }
    if (!data.slug || data.slug.trim().length === 0) {
      throw new Error('League slug is required');
    }

    // Verifica se o slug já existe
    const existing = await this.prisma.league.findUnique({
      where: { slug: data.slug },
    });
    if (existing) {
      throw new Error('League slug already exists');
    }

    // Cria a liga
    return this.prisma.league.create({
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description,
        icon: data.icon,
        banner: data.banner,
        startAt: data.startAt,
        endAt: data.endAt,
        isActive: data.isActive ?? true,
        isPublic: data.isPublic ?? false,
      },
    });
  }

  /**
   * Lista ligas públicas (sem autenticação necessária)
   */
  async listPublicLeagues(
    filters: ListLeaguesFilters = {},
    pagination: PaginationParams = {},
  ): Promise<PaginatedResult<League>> {
    return this.listLeagues({ ...filters, isPublic: true }, pagination);
  }

  /**
   * Lista todas as ligas (com filtros e paginação)
   */
  async listLeagues(
    filters: ListLeaguesFilters = {},
    pagination: PaginationParams = {},
  ): Promise<PaginatedResult<League>> {
    const page = Math.max(pagination.page ?? 1, 1);
    const pageSizeRaw = Math.max(pagination.pageSize ?? 20, 1);
    const pageSize = Math.min(pageSizeRaw, 20); // máximo 20 por página
    const skip = (page - 1) * pageSize;
    const orderByField = pagination.orderBy || 'createdAt';
    const order = pagination.order || (orderByField === 'name' ? 'asc' : 'desc');

    // Constrói o where dinâmico
    const where: Record<string, unknown> = {};
    const andClauses: Array<Record<string, unknown>> = [];

    // Busca por texto (q)
    if (filters.q && filters.q.trim().length > 0) {
      andClauses.push({
        OR: [
          { name: { contains: filters.q, mode: 'insensitive' } },
          { slug: { contains: filters.q, mode: 'insensitive' } },
        ],
      });
    }

    // Filtros específicos
    if (filters.name) {
      andClauses.push({ name: { contains: filters.name, mode: 'insensitive' } });
    }
    if (filters.slug) {
      andClauses.push({ slug: { contains: filters.slug, mode: 'insensitive' } });
    }
    if (typeof filters.isActive === 'boolean') {
      andClauses.push({ isActive: filters.isActive });
    }
    if (typeof filters.isPublic === 'boolean') {
      andClauses.push({ isPublic: filters.isPublic });
    }

    // Filtros de data
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

    if (andClauses.length) {
      (where as Record<string, unknown>).AND = andClauses;
    }

    // Executa queries
    const [total, items] = await Promise.all([
      this.prisma.league.count({ where: where as never }),
      this.prisma.league.findMany({
        where: where as never,
        orderBy: { [orderByField]: order } as never,
        skip,
        take: pageSize,
        include: {
          format: {
            select: {
              id: true,
              name: true,
              slug: true,
              type: true,
            },
          },
        },
      }),
    ]);

    return {
      items,
      page,
      pageSize,
      total,
      hasNext: skip + items.length < total,
    };
  }

  /**
   * Busca liga por ID
   */
  async getLeagueById(id: string): Promise<League | null> {
    return this.prisma.league.findUnique({
      where: { id },
    });
  }

  /**
   * Busca liga por slug
   */
  async getLeagueBySlug(slug: string): Promise<League | null> {
    return this.prisma.league.findUnique({
      where: { slug },
    });
  }

  /**
   * Atualiza uma liga
   */
  async updateLeague(id: string, data: UpdateLeagueDTO): Promise<League> {
    // Verifica se a liga existe
    const league = await this.prisma.league.findUnique({ where: { id } });
    if (!league) {
      throw new Error('League not found');
    }

    // Se está mudando o slug, verifica se o novo slug já existe
    if (data.slug && data.slug !== league.slug) {
      const existing = await this.prisma.league.findUnique({
        where: { slug: data.slug },
      });
      if (existing) {
        throw new Error('League slug already exists');
      }
    }

    // Atualiza a liga
    return this.prisma.league.update({
      where: { id },
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description === undefined ? undefined : data.description,
        icon: data.icon === undefined ? undefined : data.icon,
        banner: data.banner === undefined ? undefined : data.banner,
        startAt: data.startAt === undefined ? undefined : data.startAt,
        endAt: data.endAt === undefined ? undefined : data.endAt,
        isActive: data.isActive,
        isPublic: data.isPublic,
      },
    });
  }

  /**
   * Deleta uma liga (soft delete)
   */
  async deleteLeague(id: string): Promise<League> {
    const league = await this.prisma.league.findUnique({ where: { id } });
    if (!league) {
      throw new Error('League not found');
    }

    return this.prisma.league.update({
      where: { id },
      data: { isActive: false },
    });
  }

  /**
   * Verifica se uma liga é pública
   */
  async isLeaguePublic(id: string): Promise<boolean> {
    const league = await this.prisma.league.findUnique({
      where: { id },
      select: { isPublic: true },
    });
    return league?.isPublic ?? false;
  }

  /**
   * Lista ligas do usuário (via times que ele faz parte)
   */
  async listUserLeagues(userId: string): Promise<League[]> {
    // Busca teamIds do usuário via AccessMembership
    const accessMemberships = await this.prisma.accessMembership.findMany({
      where: { userId, teamId: { not: null } },
      select: { teamId: true },
    });

    // Busca teamIds do usuário via Player
    const player = await this.prisma.player.findUnique({
      where: { userId },
      select: { id: true },
    });

    let playerTeamIds: string[] = [];
    if (player) {
      const playersOnTeams = await this.prisma.playersOnTeams.findMany({
        where: { playerId: player.id },
        select: { teamId: true },
      });
      playerTeamIds = playersOnTeams.map((p) => p.teamId);
    }

    // Combina todos os teamIds
    const teamIds = Array.from(
      new Set([...accessMemberships.map((a) => a.teamId!).filter(Boolean), ...playerTeamIds]),
    );

    if (teamIds.length === 0) {
      return [];
    }

    // Busca ligas que contenham esses times
    return this.prisma.league.findMany({
      where: {
        teams: {
          some: {
            teamId: { in: teamIds },
          },
        },
      },
      orderBy: { name: 'asc' },
    });
  }
}

import { prisma } from '../prisma/client.js';
import { MatchRepository } from '../../data/protocols/match-repository.js';
import { AddMatchInput } from '../../domain/usecases/add-match.js';

export class PrismaMatchRepository implements MatchRepository {
  async add(data: AddMatchInput): Promise<{ id: string }> {
    return prisma.match.create({
      data: {
        homeTeamId: data.homeTeamId,
        awayTeamId: data.awayTeamId,
        scheduledAt: data.scheduledAt,
        status: data.status ?? 'SCHEDULED',
        homeScore: data.homeScore ?? 0,
        awayScore: data.awayScore ?? 0,
      },
      select: { id: true },
    });
  }

  async list(params: {
    status?: 'SCHEDULED' | 'IN_PROGRESS' | 'FINISHED' | 'CANCELED';
    teamId?: string;
    from?: Date;
    to?: Date;
    page?: number;
    limit?: number;
  }) {
    const where: Record<string, unknown> = {};
    if (params.status) where.status = params.status;
    if (params.teamId) {
      where.OR = [{ homeTeamId: params.teamId }, { awayTeamId: params.teamId }];
    }
    if (params.from || params.to) {
      where.scheduledAt = {
        ...(params.from ? { gte: params.from } : {}),
        ...(params.to ? { lte: params.to } : {}),
      };
    }
    const page = params.page && params.page > 0 ? params.page : 1;
    const limit = params.limit && params.limit > 0 ? Math.min(params.limit, 100) : 20;
    const skip = (page - 1) * limit;
    const [total, rows] = await Promise.all([
      prisma.match.count({ where }),
      prisma.match.findMany({
        where,
        orderBy: { scheduledAt: 'asc' },
        skip,
        take: limit,
        select: {
          id: true,
          homeTeamId: true,
          awayTeamId: true,
          scheduledAt: true,
          status: true,
          homeScore: true,
          awayScore: true,
          homeTeam: {
            select: {
              id: true,
              name: true,
              icon: true,
            },
          },
          awayTeam: {
            select: {
              id: true,
              name: true,
              icon: true,
            },
          },
        },
      }),
    ]);
    return { items: rows, page, limit, total };
  }

  async updateScore(id: string, homeScore: number, awayScore: number): Promise<{ id: string }> {
    return prisma.match.update({
      where: { id },
      data: { homeScore, awayScore },
      select: { id: true },
    });
  }

  async updateStatus(
    id: string,
    status: 'SCHEDULED' | 'IN_PROGRESS' | 'FINISHED' | 'CANCELED',
  ): Promise<{ id: string; status: 'SCHEDULED' | 'IN_PROGRESS' | 'FINISHED' | 'CANCELED' }> {
    return prisma.match.update({
      where: { id },
      data: { status },
      select: { id: true, status: true },
    });
  }

  async getById(
    id: string,
  ): Promise<{ id: string; status: 'SCHEDULED' | 'IN_PROGRESS' | 'FINISHED' | 'CANCELED' } | null> {
    return prisma.match.findUnique({
      where: { id },
      select: { id: true, status: true },
    });
  }
}

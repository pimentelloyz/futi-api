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
  }) {
    const where: Record<string, unknown> = {};
    if (params.status) where.status = params.status;
    if (params.teamId) {
      // matches where team participates as home or away
      where.OR = [{ homeTeamId: params.teamId }, { awayTeamId: params.teamId }];
    }
    if (params.from || params.to) {
      where.scheduledAt = {
        ...(params.from ? { gte: params.from } : {}),
        ...(params.to ? { lte: params.to } : {}),
      };
    }
    const rows = await prisma.match.findMany({
      where,
      orderBy: { scheduledAt: 'asc' },
      select: {
        id: true,
        homeTeamId: true,
        awayTeamId: true,
        scheduledAt: true,
        status: true,
        homeScore: true,
        awayScore: true,
      },
    });
    return rows;
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
}

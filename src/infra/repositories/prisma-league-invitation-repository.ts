import { PrismaClient } from '@prisma/client';

import { prisma } from '../prisma/client.js';
import { ILeagueInvitationRepository } from '../../domain/repositories/league-invitation.repository.interface.js';
import { LeagueInvitation } from '../../domain/entities/league-invitation.entity.js';

export class PrismaLeagueInvitationRepository implements ILeagueInvitationRepository {
  private prisma: PrismaClient;

  constructor(prismaClient?: PrismaClient) {
    this.prisma = prismaClient ?? prisma;
  }

  async create(data: {
    code: string;
    leagueId: string;
    createdBy: string | null;
    maxUses: number;
    expiresAt: Date | null;
  }): Promise<LeagueInvitation> {
    const rec = await this.prisma.leagueInvitation.create({
      data: {
        code: data.code,
        leagueId: data.leagueId,
        createdBy: data.createdBy,
        maxUses: data.maxUses,
        expiresAt: data.expiresAt,
      },
    });
    return this.toDomain(rec);
  }

  async findByCode(code: string): Promise<LeagueInvitation | null> {
    const rec = await this.prisma.leagueInvitation.findUnique({ where: { code } });
    if (!rec) return null;
    return this.toDomain(rec);
  }

  async findById(id: string): Promise<LeagueInvitation | null> {
    const rec = await this.prisma.leagueInvitation.findUnique({ where: { id } });
    if (!rec) return null;
    return this.toDomain(rec);
  }

  async listByLeague(leagueId: string, isActive?: boolean): Promise<LeagueInvitation[]> {
    const rows = await this.prisma.leagueInvitation.findMany({
      where: {
        leagueId,
        ...(isActive !== undefined && { isActive }),
      },
    });
    return rows.map((r) => this.toDomain(r));
  }

  async incrementUse(id: string): Promise<void> {
    await this.prisma.leagueInvitation.update({
      where: { id },
      data: { uses: { increment: 1 } },
    });
  }

  async revoke(id: string): Promise<void> {
    await this.prisma.leagueInvitation.update({
      where: { id },
      data: { isActive: false },
    });
  }

  private toDomain(rec: {
    id: string;
    code: string;
    leagueId: string;
    createdBy: string | null;
    maxUses: number;
    uses: number;
    isActive: boolean;
    expiresAt: Date | null;
    createdAt: Date;
  }): LeagueInvitation {
    return new LeagueInvitation(
      rec.id,
      rec.code,
      rec.leagueId,
      rec.createdBy,
      rec.maxUses,
      rec.uses,
      rec.isActive,
      rec.expiresAt,
      rec.createdAt,
    );
  }
}

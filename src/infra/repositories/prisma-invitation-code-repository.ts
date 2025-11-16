import { PrismaClient } from '@prisma/client';

import type {
  InvitationCodeCreate,
  InvitationCodeModel,
  InvitationCodeRepository,
} from '../../data/protocols/invitation-code-repository.js';

export class PrismaInvitationCodeRepository implements InvitationCodeRepository {
  private prisma: PrismaClient;

  constructor(prisma?: PrismaClient) {
    this.prisma = prisma ?? new PrismaClient();
  }

  async create(data: InvitationCodeCreate): Promise<InvitationCodeModel> {
    const rec = await this.prisma.invitationCode.create({
      data: {
        code: data.code,
        teamId: data.teamId,
        createdBy: data.createdBy ?? null,
        maxUses: data.maxUses ?? 1,
        expiresAt: data.expiresAt ?? null,
      },
    });
    return this.map(rec);
  }

  async findByCode(code: string): Promise<InvitationCodeModel | null> {
    const rec = await this.prisma.invitationCode.findUnique({ where: { code } });
    if (!rec) return null;
    return this.map(rec);
  }

  async incrementUse(id: string): Promise<InvitationCodeModel> {
    // Use a transaction to increment uses and return updated record
    const [rec] = await this.prisma.$transaction([
      this.prisma.invitationCode.update({ where: { id }, data: { uses: { increment: 1 } } }),
    ]);
    return this.map(rec);
  }

  async listByTeam(teamId: string): Promise<InvitationCodeModel[]> {
    const rows = await this.prisma.invitationCode.findMany({ where: { teamId } });
    return rows.map(this.map);
  }

  async revoke(id: string): Promise<void> {
    await this.prisma.invitationCode.update({ where: { id }, data: { isActive: false } });
  }

  private map(rec: unknown): InvitationCodeModel {
    const r = rec as {
      id: string;
      code: string;
      teamId: string;
      createdBy?: string | null;
      maxUses: number;
      uses: number;
      isActive: boolean;
      expiresAt?: Date | null;
      createdAt: Date;
    };
    return {
      id: r.id,
      code: r.code,
      teamId: r.teamId,
      createdBy: r.createdBy ?? null,
      maxUses: r.maxUses,
      uses: r.uses,
      isActive: r.isActive,
      expiresAt: r.expiresAt ?? null,
      createdAt: r.createdAt,
    };
  }
}

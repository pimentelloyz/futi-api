import { prisma } from '../prisma/client.js';
import {
  AccessMembershipRepository,
  AccessRole,
  AccessMembership,
  AccessMembershipWithTeam,
} from '../../data/protocols/access-membership-repository.js';

/* eslint-disable @typescript-eslint/no-explicit-any */

export class PrismaAccessMembershipRepository implements AccessMembershipRepository {
  async grant(
    userId: string,
    role: AccessRole,
    teamId?: string | null,
    leagueId?: string | null,
  ): Promise<AccessMembership> {
    const t = teamId ?? null;
    const l = leagueId ?? null;
    // Try to find existing membership with same keys

    const existing = await prisma.accessMembership.findFirst({
      where: { userId, teamId: t, leagueId: l } as any,
    });
    if (existing) {
      const updated = await prisma.accessMembership.update({
        where: { id: existing.id },
        data: { role },
      });
      return updated as AccessMembership;
    }

    const created = await prisma.accessMembership.create({
      data: { userId, teamId: t, leagueId: l, role } as any,
    });
    return created as AccessMembership;
  }

  async revoke(
    userId: string,
    role: AccessRole,
    teamId?: string | null,
    leagueId?: string | null,
  ): Promise<void> {
    await prisma.accessMembership.deleteMany({
      where: { userId, teamId: teamId ?? null, leagueId: leagueId ?? null, role } as any,
    });
  }

  async hasRole(
    userId: string,
    role: AccessRole,
    teamId?: string | null,
    leagueId?: string | null,
  ): Promise<boolean> {
    const where: Record<string, unknown> = { userId, role };
    if (teamId !== undefined) where.teamId = teamId ?? null;
    if (leagueId !== undefined) where.leagueId = leagueId ?? null;

    const rec = await prisma.accessMembership.findFirst({ where: where as any });
    return !!rec;
  }

  async listByUser(userId: string): Promise<AccessMembership[]> {
    return (await prisma.accessMembership.findMany({ where: { userId } })) as AccessMembership[];
  }

  async listByUserWithTeam(userId: string): Promise<AccessMembershipWithTeam[]> {
    const rows = await prisma.accessMembership.findMany({
      where: { userId } as any,
      // include typed as any until Prisma Client is regenerated after migration
      include: {
        team: {
          select: {
            id: true,
            name: true,
            icon: true,
            description: true,
            isActive: true,
          },
        },
        league: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      } as any,
      orderBy: [{ createdAt: 'asc' } as any],
    });
    return rows as unknown as AccessMembershipWithTeam[];
  }
}

/* eslint-enable @typescript-eslint/no-explicit-any */

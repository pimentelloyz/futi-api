import { prisma } from '../prisma/client.js';
import { TEAM_LITE_SELECT } from '../prisma/selects.js';
import {
  AccessMembershipRepository,
  AccessRole,
  AccessMembership,
  AccessMembershipWithTeam,
} from '../../data/protocols/access-membership-repository.js';

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
      where: { userId, teamId: t, leagueId: l },
    });
    if (existing) {
      const updated = await prisma.accessMembership.update({
        where: { id: existing.id },
        data: { role },
      });
      return updated as AccessMembership;
    }

    const created = await prisma.accessMembership.create({
      data: { userId, teamId: t, leagueId: l, role },
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
      where: { userId, teamId: teamId ?? null, leagueId: leagueId ?? null, role },
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

    const rec = await prisma.accessMembership.findFirst({ where });
    return !!rec;
  }

  async listByUser(userId: string): Promise<AccessMembership[]> {
    return (await prisma.accessMembership.findMany({ where: { userId } })) as AccessMembership[];
  }

  async listByUserWithTeam(userId: string): Promise<AccessMembershipWithTeam[]> {
    const rows = await prisma.accessMembership.findMany({
      where: { userId },
      include: {
        team: { select: TEAM_LITE_SELECT },
        league: { select: { id: true, name: true, slug: true } },
      },
      orderBy: [{ createdAt: 'asc' }],
    });
    return rows as AccessMembershipWithTeam[];
  }
}

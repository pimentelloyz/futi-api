import { prisma } from '../prisma/client.js';
import {
  AccessMembershipRepository,
  AccessRole,
  AccessMembership,
  AccessMembershipWithTeam,
} from '../../data/protocols/access-membership-repository.js';

export class PrismaAccessMembershipRepository implements AccessMembershipRepository {
  async grant(userId: string, role: AccessRole, teamId?: string | null): Promise<AccessMembership> {
    const team = teamId ?? null;
    // Upsert via unique composto só funciona com campos não nulos em Prisma
    if (team !== null) {
      const rec = await prisma.accessMembership.upsert({
        where: { userId_teamId: { userId, teamId: team } },
        update: { role },
        create: { userId, teamId: team, role },
      });
      return rec as AccessMembership;
    }
    // Para teamId nulo (ADMIN global), fazer findFirst -> update/create
    const existing = await prisma.accessMembership.findFirst({ where: { userId, teamId: null } });
    if (existing) {
      const updated = await prisma.accessMembership.update({
        where: { id: existing.id },
        data: { role },
      });
      return updated as AccessMembership;
    }
    const created = await prisma.accessMembership.create({ data: { userId, teamId: null, role } });
    return created as AccessMembership;
  }

  async revoke(userId: string, role: AccessRole, teamId?: string | null): Promise<void> {
    await prisma.accessMembership.deleteMany({ where: { userId, teamId: teamId ?? null, role } });
  }

  async hasRole(userId: string, role: AccessRole, teamId?: string | null): Promise<boolean> {
    const rec = await prisma.accessMembership.findFirst({
      where: { userId, teamId: teamId ?? null, role },
    });
    return !!rec;
  }

  async listByUser(userId: string): Promise<AccessMembership[]> {
    return (await prisma.accessMembership.findMany({ where: { userId } })) as AccessMembership[];
  }

  async listByUserWithTeam(userId: string): Promise<AccessMembershipWithTeam[]> {
    const rows = await prisma.accessMembership.findMany({
      where: { userId },
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
      },
      orderBy: [{ createdAt: 'asc' }],
    });
    return rows as unknown as AccessMembershipWithTeam[];
  }
}

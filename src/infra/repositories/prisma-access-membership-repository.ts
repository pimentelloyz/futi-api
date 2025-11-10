import { prisma } from '../prisma/client.js';
import {
  AccessMembershipRepository,
  AccessRole,
  AccessMembership,
} from '../../data/protocols/access-membership-repository.js';

export class PrismaAccessMembershipRepository implements AccessMembershipRepository {
  async grant(userId: string, role: AccessRole, teamId?: string | null): Promise<AccessMembership> {
    const rec = await prisma.accessMembership.upsert({
      where: { userId_teamId: { userId, teamId: teamId ?? null } },
      update: { role },
      create: { userId, teamId: teamId ?? null, role },
    });
    return rec as AccessMembership;
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
}

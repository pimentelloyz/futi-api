import type { PrismaClient } from '@prisma/client';

import { AccessRole, isReadOnlyRole } from '../constants/access-roles.js';

export interface AccessContext {
  teamId?: string;
  leagueId?: string;
  matchId?: string;
}

export interface UserAccess {
  userId: string;
  role: AccessRole;
  teamId?: string | null;
  leagueId?: string | null;
  matchId?: string | null;
}

export class RBACService {
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Verifica se o usuário tem uma das roles permitidas no contexto especificado
   */
  async hasPermission(
    userId: string,
    allowedRoles: AccessRole[],
    context?: AccessContext,
  ): Promise<boolean> {
    // ADMIN sempre tem permissão
    if (await this.isAdmin(userId)) {
      return true;
    }

    // Se FAN está nas roles permitidas e não há context, permite
    if (allowedRoles.includes(AccessRole.FAN) && !context) {
      return true;
    }

    // Busca memberships do usuário no contexto
    const memberships = await this.getUserMemberships(userId, context);

    // Verifica se tem alguma role permitida
    return memberships.some((m) => allowedRoles.includes(m.role as AccessRole));
  }

  /**
   * Verifica se o usuário é ADMIN
   */
  async isAdmin(userId: string): Promise<boolean> {
    const adminCount = await this.prisma.accessMembership.count({
      where: {
        userId,
        role: 'ADMIN',
        teamId: null,
        leagueId: null,
      },
    });
    return adminCount > 0;
  }

  /**
   * Verifica se a role é somente leitura
   */
  isReadOnly(role: AccessRole): boolean {
    return isReadOnlyRole(role);
  }

  /**
   * Busca todas as memberships do usuário
   */
  async getUserMemberships(userId: string, context?: AccessContext): Promise<UserAccess[]> {
    const where: Record<string, unknown> = { userId };

    if (context?.teamId) {
      where.teamId = context.teamId;
    }
    if (context?.leagueId) {
      where.leagueId = context.leagueId;
    }

    const memberships = await this.prisma.accessMembership.findMany({
      where: where as never,
      select: {
        userId: true,
        role: true,
        teamId: true,
        leagueId: true,
      },
    });

    return memberships.map((m) => ({
      userId: m.userId,
      role: m.role as AccessRole,
      teamId: m.teamId,
      leagueId: m.leagueId,
      matchId: undefined, // TODO: Implementar quando adicionar matchId ao schema
    }));
  }

  /**
   * Retorna a role mais alta do usuário em um contexto
   */
  async getHighestRole(userId: string, context?: AccessContext): Promise<AccessRole> {
    if (await this.isAdmin(userId)) {
      return AccessRole.ADMIN;
    }

    const memberships = await this.getUserMemberships(userId, context);

    if (memberships.length === 0) {
      return AccessRole.FAN;
    }

    // Retorna a role com maior prioridade
    const roleHierarchy: Record<string, number> = {
      ADMIN: 100,
      LEAGUE_MANAGER: 50,
      REFEREE_COMMISSION: 40,
      MATCH_MANAGER: 35,
      MANAGER: 30,
      ASSISTANT: 20,
      PLAYER: 10,
      FAN: 0,
    };

    return memberships.reduce((highest: AccessRole, current) => {
      const currentPriority = roleHierarchy[current.role] || 0;
      const highestPriority = roleHierarchy[highest] || 0;
      return currentPriority > highestPriority ? current.role : highest;
    }, AccessRole.FAN as AccessRole);
  }

  /**
   * Verifica se o usuário pode realizar ação de escrita (não é read-only)
   */
  async canWrite(userId: string, context?: AccessContext): Promise<boolean> {
    const role = await this.getHighestRole(userId, context);
    return !this.isReadOnly(role);
  }

  /**
   * Busca todos os teamIds que o usuário tem acesso
   */
  async getUserTeamIds(userId: string): Promise<string[]> {
    const memberships = await this.prisma.accessMembership.findMany({
      where: {
        userId,
        teamId: { not: null },
      },
      select: { teamId: true },
    });

    return memberships.map((m) => m.teamId!).filter(Boolean);
  }

  /**
   * Busca todos os leagueIds que o usuário tem acesso
   */
  async getUserLeagueIds(userId: string): Promise<string[]> {
    const memberships = await this.prisma.accessMembership.findMany({
      where: {
        userId,
        leagueId: { not: null },
      },
      select: { leagueId: true },
    });

    return memberships.map((m) => m.leagueId!).filter(Boolean);
  }
}

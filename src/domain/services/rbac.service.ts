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

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

export class RBACService {
  private permissionCache = new Map<string, CacheEntry<boolean>>();
  private membershipsCache = new Map<string, CacheEntry<UserAccess[]>>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutos

  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Verifica se o usuário tem uma das roles permitidas no contexto especificado
   */
  async hasPermission(
    userId: string,
    allowedRoles: AccessRole[],
    context?: AccessContext,
  ): Promise<boolean> {
    // Gera chave de cache
    const cacheKey = this.generatePermissionCacheKey(userId, allowedRoles, context);

    // Verifica cache
    const cached = this.permissionCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.value;
    }

    // MASTER e ADMIN sempre têm permissão
    if (await this.isMasterOrAdmin(userId)) {
      this.cachePermission(cacheKey, true);
      return true;
    }

    // Se FAN está nas roles permitidas e não há context, permite
    if (allowedRoles.includes(AccessRole.FAN) && !context) {
      this.cachePermission(cacheKey, true);
      return true;
    }

    // Busca memberships do usuário no contexto
    const memberships = await this.getUserMemberships(userId, context);

    // Verifica se tem alguma role permitida
    const hasPermission = memberships.some((m) => allowedRoles.includes(m.role as AccessRole));

    this.cachePermission(cacheKey, hasPermission);
    return hasPermission;
  }

  /**
   * Verifica se o usuário é MASTER ou ADMIN
   */
  async isMasterOrAdmin(userId: string): Promise<boolean> {
    const count = await this.prisma.accessMembership.count({
      where: {
        userId,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        role: { in: ['MASTER', 'ADMIN'] as any },
        teamId: null,
        leagueId: null,
      },
    });
    return count > 0;
  }

  /**
   * Verifica se o usuário é MASTER (nível máximo de acesso)
   */
  async isMaster(userId: string): Promise<boolean> {
    const count = await this.prisma.accessMembership.count({
      where: {
        userId,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        role: 'MASTER' as any,
        teamId: null,
        leagueId: null,
      },
    });
    return count > 0;
  }

  /**
   * Verifica se o usuário é ADMIN
   */
  async isAdmin(userId: string): Promise<boolean> {
    const count = await this.prisma.accessMembership.count({
      where: {
        userId,
        role: 'ADMIN',
        teamId: null,
        leagueId: null,
      },
    });
    return count > 0;
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
    // Gera chave de cache
    const cacheKey = this.generateMembershipsCacheKey(userId, context);

    // Verifica cache
    const cached = this.membershipsCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.value;
    }

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

    const result = memberships.map((m) => ({
      userId: m.userId,
      role: m.role as AccessRole,
      teamId: m.teamId,
      leagueId: m.leagueId,
      matchId: undefined, // TODO: Implementar quando adicionar matchId ao schema
    }));

    // Cacheia resultado
    this.membershipsCache.set(cacheKey, {
      value: result,
      expiresAt: Date.now() + this.CACHE_TTL,
    });

    return result;
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

  // ========== MÉTODOS DE CACHE ==========

  /**
   * Gera chave de cache para verificação de permissão
   */
  private generatePermissionCacheKey(
    userId: string,
    allowedRoles: AccessRole[],
    context?: AccessContext,
  ): string {
    const rolesList = allowedRoles.sort().join(',');
    const contextStr = context
      ? JSON.stringify({ t: context.teamId, l: context.leagueId, m: context.matchId })
      : 'null';
    return `perm:${userId}:${rolesList}:${contextStr}`;
  }

  /**
   * Gera chave de cache para memberships
   */
  private generateMembershipsCacheKey(userId: string, context?: AccessContext): string {
    const contextStr = context
      ? JSON.stringify({ t: context.teamId, l: context.leagueId, m: context.matchId })
      : 'null';
    return `memb:${userId}:${contextStr}`;
  }

  /**
   * Armazena resultado de permissão no cache
   */
  private cachePermission(key: string, value: boolean): void {
    this.permissionCache.set(key, {
      value,
      expiresAt: Date.now() + this.CACHE_TTL,
    });
  }

  /**
   * Invalida todo o cache de um usuário
   * Deve ser chamado quando as memberships do usuário mudarem
   */
  public invalidateUserCache(userId: string): void {
    // Remove todas as entradas que começam com o userId
    for (const key of this.permissionCache.keys()) {
      if (key.includes(`:${userId}:`)) {
        this.permissionCache.delete(key);
      }
    }
    for (const key of this.membershipsCache.keys()) {
      if (key.includes(`:${userId}:`)) {
        this.membershipsCache.delete(key);
      }
    }
  }

  /**
   * Limpa todo o cache (útil para testes ou troubleshooting)
   */
  public clearCache(): void {
    this.permissionCache.clear();
    this.membershipsCache.clear();
  }

  /**
   * Retorna estatísticas do cache
   */
  public getCacheStats(): {
    permissionsSize: number;
    membershipsSize: number;
    totalEntries: number;
  } {
    return {
      permissionsSize: this.permissionCache.size,
      membershipsSize: this.membershipsCache.size,
      totalEntries: this.permissionCache.size + this.membershipsCache.size,
    };
  }
}

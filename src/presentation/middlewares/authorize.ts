import type { Request, Response, NextFunction } from 'express';

import type { AccessRole } from '../../data/protocols/access-membership-repository.js';
import { PrismaAccessMembershipRepository } from '../../infra/repositories/prisma-access-membership-repository.js';

type TeamIdResolver = (req: Request) => string | null | undefined;

export interface RequireRoleOptions {
  // How to resolve teamId when role is team-scoped (MANAGER, ASSISTANT, PLAYER)
  // Defaults: try req.params.teamId -> req.query.teamId -> req.body.teamId
  resolveTeamId?: TeamIdResolver;
  // If true, users with ADMIN are auto-authorized even if role list doesn't include ADMIN (default: true)
  allowAdminBypass?: boolean;
}

function getStringProp(obj: unknown, key: string): string | undefined {
  if (obj && typeof obj === 'object' && key in (obj as Record<string, unknown>)) {
    const v = (obj as Record<string, unknown>)[key];
    return typeof v === 'string' ? v : undefined;
  }
  return undefined;
}

function defaultTeamIdResolver(req: Request): string | null {
  return (
    getStringProp(req.params, 'teamId') ||
    getStringProp(req.query, 'teamId') ||
    getStringProp(req.body, 'teamId') ||
    null
  );
}

async function userHasAnyRole(
  userId: string,
  roles: AccessRole[],
  teamId: string | null,
  allowAdminBypass: boolean,
): Promise<boolean> {
  const repo = new PrismaAccessMembershipRepository();
  if (allowAdminBypass) {
    const isAdmin = await repo.hasRole(userId, 'ADMIN');
    if (isAdmin) return true;
  }
  for (const role of roles) {
    if (await repo.hasRole(userId, role, teamId ?? undefined)) return true;
  }
  return false;
}

export function requireAnyRole(roles: AccessRole[], options: RequireRoleOptions = {}) {
  const resolveTeamId = options.resolveTeamId ?? defaultTeamIdResolver;
  const allowAdminBypass = options.allowAdminBypass ?? true;
  return async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user as { id?: string } | undefined;
    if (!user?.id) return res.status(401).json({ error: 'unauthorized' });
    try {
      const teamId = resolveTeamId(req) ?? null;
      const ok = await userHasAnyRole(user.id, roles, teamId, allowAdminBypass);
      if (!ok) return res.status(403).json({ error: 'not_authorized' });
      return next();
    } catch {
      // Defensive: avoid leaking details; align with our error contract
      return res.status(500).json({ error: 'internal_error' });
    }
  };
}

export function requireAdmin(options: Omit<RequireRoleOptions, 'allowAdminBypass'> = {}) {
  return requireAnyRole(['ADMIN'], { ...options, allowAdminBypass: true });
}

// Convenience helpers for common team-scoped checks
export function requireManager(options: RequireRoleOptions = {}) {
  return requireAnyRole(['MANAGER'], options);
}

export function requireAssistant(options: RequireRoleOptions = {}) {
  return requireAnyRole(['ASSISTANT'], options);
}

export function requirePlayer(options: RequireRoleOptions = {}) {
  return requireAnyRole(['PLAYER'], options);
}

/**
 * Usage examples:
 *
 * import { requireAdmin, requireManager, requireAnyRole } from '../middlewares/authorize.js';
 *
 * // Simple admin-only route
 * router.post('/admin-only', jwtAuth, requireAdmin(), handler);
 *
 * // Team-scoped route (teamId in params)
 * router.post('/teams/:teamId/manage', jwtAuth, requireManager(), handler);
 *
 * // Mixed roles accepted, admin bypass enabled by default
 * router.post('/teams/:teamId/assist-or-manage', jwtAuth, requireAnyRole(['ASSISTANT', 'MANAGER']), handler);
 */

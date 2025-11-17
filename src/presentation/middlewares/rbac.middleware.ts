import type { NextFunction, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

import type { AccessContext } from '../../domain/services/rbac.service.js';
import { RBACService } from '../../domain/services/rbac.service.js';
import { AccessRole } from '../../domain/constants/access-roles.js';
import { RBAC_ERRORS } from '../../domain/constants/rbac-errors.js';

const prisma = new PrismaClient();
const rbacService = new RBACService(prisma);

/**
 * Middleware para verificar se o usuário tem uma das roles permitidas
 */
export function requireRole(allowedRoles: AccessRole[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as Request & { user?: { id: string } }).user?.id;

      if (!userId) {
        return res.status(RBAC_ERRORS.UNAUTHORIZED.statusCode).json({
          error: RBAC_ERRORS.UNAUTHORIZED.code,
          message: RBAC_ERRORS.UNAUTHORIZED.message,
        });
      }

      // Extrai contexto da requisição
      const context: AccessContext = {
        teamId: req.params.teamId || req.body.teamId,
        leagueId: req.params.leagueId || req.body.leagueId,
        matchId: req.params.matchId || req.body.matchId,
      };

      // Verifica permissão
      const hasPermission = await rbacService.hasPermission(userId, allowedRoles, context);

      if (!hasPermission) {
        const userRole = await rbacService.getHighestRole(userId, context);

        return res.status(RBAC_ERRORS.INSUFFICIENT_ROLE.statusCode).json({
          error: RBAC_ERRORS.INSUFFICIENT_ROLE.code,
          message: RBAC_ERRORS.INSUFFICIENT_ROLE.message,
          details: {
            required: allowedRoles,
            current: userRole,
          },
        });
      }

      next();
    } catch (error) {
      console.error('[RBAC Middleware Error]', error);
      return res.status(500).json({
        error: 'INTERNAL_ERROR',
        message: 'Erro ao verificar permissões',
      });
    }
  };
}

/**
 * Middleware para verificar se o usuário pode escrever (não é read-only)
 */
export function requireWrite() {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as Request & { user?: { id: string } }).user?.id;

      if (!userId) {
        return res.status(RBAC_ERRORS.UNAUTHORIZED.statusCode).json({
          error: RBAC_ERRORS.UNAUTHORIZED.code,
          message: RBAC_ERRORS.UNAUTHORIZED.message,
        });
      }

      const context: AccessContext = {
        teamId: req.params.teamId || req.body.teamId,
        leagueId: req.params.leagueId || req.body.leagueId,
        matchId: req.params.matchId || req.body.matchId,
      };

      const canWrite = await rbacService.canWrite(userId, context);

      if (!canWrite) {
        return res.status(RBAC_ERRORS.READ_ONLY_ROLE.statusCode).json({
          error: RBAC_ERRORS.READ_ONLY_ROLE.code,
          message: RBAC_ERRORS.READ_ONLY_ROLE.message,
          hint: RBAC_ERRORS.READ_ONLY_ROLE.hint,
        });
      }

      next();
    } catch (error) {
      console.error('[RBAC Write Middleware Error]', error);
      return res.status(500).json({
        error: 'INTERNAL_ERROR',
        message: 'Erro ao verificar permissões de escrita',
      });
    }
  };
}

/**
 * Middleware para verificar se o usuário é ADMIN
 */
export function requireAdmin() {
  return requireRole([AccessRole.ADMIN]);
}

/**
 * Middleware para verificar contexto de time
 */
export function requireTeamContext() {
  return async (req: Request, res: Response, next: NextFunction) => {
    const teamId = req.params.teamId || req.body.teamId;

    if (!teamId) {
      return res.status(RBAC_ERRORS.INVALID_CONTEXT.statusCode).json({
        error: RBAC_ERRORS.INVALID_CONTEXT.code,
        message: 'teamId é obrigatório',
      });
    }

    next();
  };
}

/**
 * Middleware para verificar contexto de liga
 */
export function requireLeagueContext() {
  return async (req: Request, res: Response, next: NextFunction) => {
    const leagueId = req.params.leagueId || req.body.leagueId;

    if (!leagueId) {
      return res.status(RBAC_ERRORS.INVALID_CONTEXT.statusCode).json({
        error: RBAC_ERRORS.INVALID_CONTEXT.code,
        message: 'leagueId é obrigatório',
      });
    }

    next();
  };
}

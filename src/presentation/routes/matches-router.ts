import { Router } from 'express';

import { makeAddMatchController } from '../../main/factories/make-add-match-controller.js';
import { makeCreateRecurringMatchesController } from '../../main/factories/make-create-recurring-matches-controller.js';
import { makeListMatchesController } from '../../main/factories/make-list-matches-controller.js';
import { makeUpdateMatchScoreController } from '../../main/factories/make-update-match-score-controller.js';
import { makeUpdateMatchStatusController } from '../../main/factories/make-update-match-status-controller.js';
import { jwtAuth } from '../middlewares/jwt-auth.js';
import { requireRole } from '../middlewares/rbac.middleware.js';
import { AccessRole } from '../../domain/constants/access-roles.js';
import { MatchEvaluationAssignmentService } from '../../domain/services/match-evaluation-assignment-service.js';
import {
  MatchEventsListController,
  MatchEventCreateController,
} from '../controllers/match-events-controller.js';
import {
  MatchLineupSetController,
  MatchLineupGetController,
} from '../controllers/match-lineup-controller.js';
import { MatchSummaryController } from '../controllers/match-summary-controller.js';

export const matchesRouter = Router();

matchesRouter.use(jwtAuth);

// Criar partida - LEAGUE_MANAGER e ADMIN
matchesRouter.post(
  '/',
  requireRole([AccessRole.LEAGUE_MANAGER, AccessRole.ADMIN]),
  async (req, res) => {
    const controller = makeAddMatchController();
    const response = await controller.handle({ body: req.body });
    res.status(response.statusCode).json(response.body);
  },
);

// Criar partidas recorrentes - MANAGER, LEAGUE_MANAGER e ADMIN
matchesRouter.post(
  '/recurring',
  requireRole([AccessRole.MANAGER, AccessRole.LEAGUE_MANAGER, AccessRole.ADMIN]),
  async (req, res) => {
    const controller = makeCreateRecurringMatchesController();
    return controller.handleExpress(req, res);
  },
);

matchesRouter.get('/:id/events', async (req, res) => {
  const controller = new MatchEventsListController();
  const type = req.query.type as string | undefined;
  const response = await controller.handle({ matchId: req.params.id, type });
  return res.status(response.statusCode).json(response.body);
});

// Criar evento de partida - MATCH_MANAGER, ADMIN ou PLAYER (se liga for CUSTOM)
matchesRouter.post(
  '/:id/events',
  async (req, res, next) => {
    // Verificar role do usuário
    const { RBACService } = await import('../../domain/services/rbac.service.js');
    const rbacService = new RBACService();
    const userId = (req.user as { id: string } | undefined)?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'unauthorized' });
    }

    // Extrair contexto
    const context = {
      matchId: req.params.id as string | undefined,
    };

    const memberships = await rbacService.getUserMemberships(userId, context);
    const roles = memberships.map((m) => m.role);

    // Se for MATCH_MANAGER ou ADMIN, permite direto
    if (roles.includes('MATCH_MANAGER') || roles.includes('ADMIN')) {
      return next();
    }

    // Se for PLAYER, verifica se a liga é CUSTOM
    if (roles.includes('PLAYER')) {
      const { prisma } = await import('../../infra/prisma/client.js');
      const match = await prisma.match.findUnique({
        where: { id: req.params.id },
        include: {
          league: {
            include: {
              format: true,
            },
          },
        },
      });

      // Se a liga for CUSTOM, permite PLAYER registrar eventos
      if (match?.league?.format?.type === 'CUSTOM') {
        return next();
      }
    }

    // Se não atende nenhuma condição, retorna 403
    return res.status(403).json({
      error: 'INSUFFICIENT_ROLE',
      message: 'Only MATCH_MANAGER, ADMIN, or PLAYER (in CUSTOM leagues) can register events',
      current: roles.join(', ') || 'FAN',
      required: ['MATCH_MANAGER', 'ADMIN', 'PLAYER (CUSTOM leagues)'],
    });
  },
  async (req, res) => {
    const controller = new MatchEventCreateController();
    const response = await controller.handle({ matchId: req.params.id, body: req.body });
    return res.status(response.statusCode).json(response.body);
  },
);

// Definir escalação - MANAGER e ADMIN
matchesRouter.post(
  '/:id/lineup',
  requireRole([AccessRole.MANAGER, AccessRole.ADMIN]),
  async (req, res) => {
    const controller = new MatchLineupSetController();
    const response = await controller.handle({ matchId: req.params.id, body: req.body });
    if (response.statusCode === 204) return res.status(204).send();
    return res.status(response.statusCode).json(response.body);
  },
);

matchesRouter.get('/:id/lineup', async (req, res) => {
  const controller = new MatchLineupGetController();
  const response = await controller.handle({ matchId: req.params.id });
  return res.status(response.statusCode).json(response.body);
});

// Obter súmula completa da partida
matchesRouter.get('/:id/summary', async (req, res) => {
  const controller = new MatchSummaryController();
  const response = await controller.handle({ matchId: req.params.id });
  return res.status(response.statusCode).json(response.body);
});

matchesRouter.get('/', async (req, res) => {
  const controller = makeListMatchesController();
  const response = await controller.handle({
    query: req.query as unknown as Record<string, unknown>,
  });
  res.status(response.statusCode).json(response.body);
});

// Atualizar placar - MATCH_MANAGER e ADMIN
matchesRouter.patch(
  '/:id/score',
  requireRole([AccessRole.MATCH_MANAGER, AccessRole.ADMIN]),
  async (req, res) => {
    const controller = makeUpdateMatchScoreController();
    const response = await controller.handle({ params: req.params, body: req.body });
    res.status(response.statusCode).json(response.body);
  },
);

// Atualizar status - MATCH_MANAGER, LEAGUE_MANAGER e ADMIN
matchesRouter.patch(
  '/:id/status',
  requireRole([AccessRole.MATCH_MANAGER, AccessRole.LEAGUE_MANAGER, AccessRole.ADMIN]),
  async (req, res) => {
    const controller = makeUpdateMatchStatusController();
    const response = await controller.handle({ params: req.params, body: req.body });
    res.status(response.statusCode).json(response.body);
    // Side-effect: geração de avaliações ao finalizar partida
    if (response.statusCode !== 200) return;
    const body = response.body as { status?: string; id?: string } | undefined;
    if (body?.status !== 'FINISHED') return;
    try {
      await new MatchEvaluationAssignmentService().generateForFinishedMatch(req.params.id);
    } catch (e) {
      console.error('[post_match_eval_generation_error]', (e as Error).message);
    }
  },
);

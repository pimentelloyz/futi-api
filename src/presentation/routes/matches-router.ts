import { Router } from 'express';

import { makeAddMatchController } from '../../main/factories/make-add-match-controller.js';
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

matchesRouter.get('/:id/events', async (req, res) => {
  const controller = new MatchEventsListController();
  const type = req.query.type as string | undefined;
  const response = await controller.handle({ matchId: req.params.id, type });
  return res.status(response.statusCode).json(response.body);
});

// Criar evento de partida - MATCH_MANAGER e ADMIN
matchesRouter.post(
  '/:id/events',
  requireRole([AccessRole.MATCH_MANAGER, AccessRole.ADMIN]),
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

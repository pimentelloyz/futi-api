import { Router } from 'express';

import { makeAddMatchController } from '../../main/factories/make-add-match-controller.js';
import { makeListMatchesController } from '../../main/factories/make-list-matches-controller.js';
import { makeUpdateMatchScoreController } from '../../main/factories/make-update-match-score-controller.js';
import { makeUpdateMatchStatusController } from '../../main/factories/make-update-match-status-controller.js';
import { jwtAuth } from '../middlewares/jwt-auth.js';
import { MatchEvaluationAssignmentService } from '../../domain/services/match-evaluation-assignment-service.js';
import {
  MatchEventsListController,
  MatchEventCreateController,
} from '../controllers/match-events-controller.js';
import {
  MatchLineupSetController,
  MatchLineupGetController,
} from '../controllers/match-lineup-controller.js';

export const matchesRouter = Router();

matchesRouter.use(jwtAuth);

matchesRouter.post('/', async (req, res) => {
  const controller = makeAddMatchController();
  const response = await controller.handle({ body: req.body });
  res.status(response.statusCode).json(response.body);
});

matchesRouter.get('/:id/events', async (req, res) => {
  const controller = new MatchEventsListController();
  const response = await controller.handle({ matchId: req.params.id });
  return res.status(response.statusCode).json(response.body);
});

matchesRouter.post('/:id/events', async (req, res) => {
  const controller = new MatchEventCreateController();
  const response = await controller.handle({ matchId: req.params.id, body: req.body });
  return res.status(response.statusCode).json(response.body);
});

matchesRouter.post('/:id/lineup', async (req, res) => {
  const controller = new MatchLineupSetController();
  const response = await controller.handle({ matchId: req.params.id, body: req.body });
  if (response.statusCode === 204) return res.status(204).send();
  return res.status(response.statusCode).json(response.body);
});

matchesRouter.get('/:id/lineup', async (req, res) => {
  const controller = new MatchLineupGetController();
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

matchesRouter.patch('/:id/score', async (req, res) => {
  const controller = makeUpdateMatchScoreController();
  const response = await controller.handle({ params: req.params, body: req.body });
  res.status(response.statusCode).json(response.body);
});

matchesRouter.patch('/:id/status', async (req, res) => {
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
});

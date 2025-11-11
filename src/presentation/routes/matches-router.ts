import { Router } from 'express';
import { z } from 'zod';

import { makeAddMatchController } from '../../main/factories/make-add-match-controller.js';
import { makeListMatchesController } from '../../main/factories/make-list-matches-controller.js';
import { makeUpdateMatchScoreController } from '../../main/factories/make-update-match-score-controller.js';
import { makeUpdateMatchStatusController } from '../../main/factories/make-update-match-status-controller.js';
import { jwtAuth } from '../middlewares/jwt-auth.js';
import { PrismaMatchEventRepository } from '../../infra/repositories/prisma-match-event-repository.js';

export const matchesRouter = Router();

matchesRouter.use(jwtAuth);

matchesRouter.post('/', async (req, res) => {
  const controller = makeAddMatchController();
  const response = await controller.handle({ body: req.body });
  res.status(response.statusCode).json(response.body);
});

// Match events endpoints will be mounted on /api/matches in setup-routes
// Schema for match event creation
const addEventSchema = z.object({
  type: z.enum(['GOAL', 'FOUL', 'YELLOW_CARD', 'RED_CARD', 'OWN_GOAL']),
  minute: z.number().int().min(0).max(130).optional(),
  teamId: z.string().optional(),
  playerId: z.string().optional(),
});

matchesRouter.get('/:id/events', async (req, res) => {
  const repo = new PrismaMatchEventRepository();
  const items = await repo.listByMatch(req.params.id);
  res.json({ items });
});

matchesRouter.post('/:id/events', async (req, res) => {
  const parsed = addEventSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'invalid_request' });
  const repo = new PrismaMatchEventRepository();
  const created = await repo.add({
    matchId: req.params.id,
    type: parsed.data.type,
    minute: parsed.data.minute,
    teamId: parsed.data.teamId,
    playerId: parsed.data.playerId,
  });
  res.status(201).json(created);
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
});

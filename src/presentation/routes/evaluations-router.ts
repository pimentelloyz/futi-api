import { Router } from 'express';
import { z } from 'zod';

import { jwtAuth } from '../middlewares/jwt-auth.js';
import { PrismaMatchPlayerEvaluationRepository } from '../../infra/repositories/prisma-match-player-evaluation-repository.js';
import { prisma } from '../../infra/prisma/client.js';
import { ERROR_CODES } from '../../domain/constants.js';

export const evaluationsRouter = Router();

evaluationsRouter.use(jwtAuth);

// List pending assignments for current player
// GET /api/evaluations/pending
// Response: { items: [{ id, matchId, targetPlayerId, targetName? }] }
evaluationsRouter.get('/pending', async (req, res) => {
  try {
    const meUser = req.user as { id: string } | undefined;
    if (!meUser) return res.status(401).json({ error: 'unauthorized' });
    // Find player by user id
    const player = await prisma.player.findUnique({
      where: { userId: meUser.id },
      select: { id: true },
    });
    if (!player) return res.status(404).json({ error: 'player_not_found' });
    const repo = new PrismaMatchPlayerEvaluationRepository();
    const pending = await repo.listPendingForPlayer(player.id);
    // Enrich with target player name
    const enriched = [] as Array<{
      id: string;
      matchId: string;
      targetPlayerId: string;
      targetName?: string;
    }>;
    for (const a of pending) {
      const target = await prisma.player.findUnique({
        where: { id: a.targetPlayerId },
        select: { name: true },
      });
      enriched.push({ ...a, targetName: target?.name });
    }
    return res.json({ items: enriched });
  } catch (e) {
    console.error('[list_pending_evaluations_error]', (e as Error).message);
    return res.status(500).json({ error: ERROR_CODES.INTERNAL_ERROR });
  }
});

// Submit evaluation
// POST /api/evaluations/{assignmentId}
const evalSchema = z.object({
  rating: z.number().int().min(0).max(10),
  comment: z.string().max(500).optional(),
});

evaluationsRouter.post('/:assignmentId', async (req, res) => {
  const assignmentId = req.params.assignmentId;
  if (!assignmentId) return res.status(400).json({ error: 'invalid_assignment_id' });
  const parsed = evalSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'invalid_request' });
  try {
    const meUser = req.user as { id: string } | undefined;
    if (!meUser) return res.status(401).json({ error: 'unauthorized' });
    // ensure assignment belongs to this player's evaluator id
    const player = await prisma.player.findUnique({
      where: { userId: meUser.id },
      select: { id: true },
    });
    if (!player) return res.status(404).json({ error: 'player_not_found' });
    const assignment = await prisma.matchPlayerEvaluationAssignment.findUnique({
      where: { id: assignmentId },
      select: { evaluatorPlayerId: true },
    });
    if (!assignment) return res.status(404).json({ error: 'assignment_not_found' });
    if (assignment.evaluatorPlayerId !== player.id)
      return res.status(403).json({ error: 'forbidden' });
    const repo = new PrismaMatchPlayerEvaluationRepository();
    const done = await repo.submitEvaluation(assignmentId, parsed.data.rating, parsed.data.comment);
    return res.status(201).json(done);
  } catch (e) {
    const msg = (e as Error).message;
    if (msg === 'assignment_not_found') return res.status(404).json({ error: msg });
    if (msg === 'already_completed') return res.status(400).json({ error: msg });
    console.error('[submit_evaluation_error]', msg);
    return res.status(500).json({ error: ERROR_CODES.INTERNAL_ERROR });
  }
});

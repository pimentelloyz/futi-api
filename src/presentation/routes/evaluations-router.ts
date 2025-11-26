import { Router } from 'express';
import { z } from 'zod';

import { jwtAuth } from '../middlewares/jwt-auth.js';
import { makeGetPendingEvaluationsController } from '../../main/factories/make-get-pending-evaluations-controller.js';
import { PrismaMatchPlayerEvaluationRepository } from '../../infra/repositories/prisma-match-player-evaluation-repository.js';
import { prisma } from '../../infra/prisma/client.js';
import { ERROR_CODES } from '../../domain/constants.js';

export const evaluationsRouter = Router();

evaluationsRouter.use(jwtAuth);

// List pending assignments for current player
// GET /api/evaluations/pending
// Response: { items: [{ id, matchId, targetPlayerId, targetName? }] }
evaluationsRouter.get('/pending', makeGetPendingEvaluationsController().handleExpress);

// Get active form and criteria for an assignment (to list questions)
// GET /api/evaluations/:assignmentId/form
evaluationsRouter.get('/:assignmentId/form', async (req, res) => {
  const assignmentId = req.params.assignmentId;
  if (!assignmentId) return res.status(400).json({ error: ERROR_CODES.INVALID_ASSIGNMENT_ID });
  try {
    const meUser = req.user as { id: string } | undefined;
    if (!meUser) return res.status(401).json({ error: ERROR_CODES.UNAUTHORIZED });
    const mePlayer = await prisma.player.findUnique({
      where: { userId: meUser.id },
      select: { id: true },
    });
    if (!mePlayer) return res.status(404).json({ error: ERROR_CODES.PLAYER_NOT_FOUND });
    const assignment = await prisma.matchPlayerEvaluationAssignment.findUnique({
      where: { id: assignmentId },
      select: { evaluatorPlayerId: true, targetPlayerId: true },
    });
    if (!assignment) return res.status(404).json({ error: ERROR_CODES.ASSIGNMENT_NOT_FOUND });
    if (assignment.evaluatorPlayerId !== mePlayer.id)
      return res.status(403).json({ error: ERROR_CODES.FORBIDDEN });

    const target = await prisma.player.findUnique({
      where: { id: assignment.targetPlayerId },
      select: { positionSlug: true },
    });
    const positionType = target?.positionSlug === 'GK' ? 'GOALKEEPER' : 'LINE';
    const form = await prisma.evaluationForm.findFirst({
      where: { positionType, isActive: true },
      orderBy: { version: 'desc' },
      select: { id: true, name: true, positionType: true, version: true },
    });
    if (!form) return res.status(404).json({ error: 'no_active_form' });
    const criteria = await prisma.evaluationCriteria.findMany({
      where: { formId: form.id },
      select: { id: true, key: true, name: true, weight: true, minValue: true, maxValue: true },
      orderBy: { key: 'asc' },
    });
    return res.json({
      assignmentId,
      form: {
        id: form.id,
        name: form.name,
        positionType: form.positionType,
        version: form.version,
        criteria: criteria.map((c) => ({
          id: c.id,
          key: c.key,
          name: c.name,
          weight: c.weight,
          min: c.minValue,
          max: c.maxValue,
        })),
      },
    });
  } catch (e) {
    console.error('[get_assignment_form_error]', (e as Error).message);
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
  if (!assignmentId) return res.status(400).json({ error: ERROR_CODES.INVALID_ASSIGNMENT_ID });
  const parsed = evalSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: ERROR_CODES.INVALID_REQUEST });
  try {
    const meUser = req.user as { id: string } | undefined;
    if (!meUser) return res.status(401).json({ error: ERROR_CODES.UNAUTHORIZED });
    // ensure assignment belongs to this player's evaluator id
    const player = await prisma.player.findUnique({
      where: { userId: meUser.id },
      select: { id: true },
    });
    if (!player) return res.status(404).json({ error: ERROR_CODES.PLAYER_NOT_FOUND });
    const assignment = await prisma.matchPlayerEvaluationAssignment.findUnique({
      where: { id: assignmentId },
      select: { evaluatorPlayerId: true },
    });
    if (!assignment) return res.status(404).json({ error: ERROR_CODES.ASSIGNMENT_NOT_FOUND });
    if (assignment.evaluatorPlayerId !== player.id)
      return res.status(403).json({ error: ERROR_CODES.FORBIDDEN });
    const repo = new PrismaMatchPlayerEvaluationRepository();
    const done = await repo.submitEvaluation(assignmentId, parsed.data.rating, parsed.data.comment);
    return res.status(201).json(done);
  } catch (e) {
    const msg = (e as Error).message;
    if (msg === 'assignment_not_found')
      return res.status(404).json({ error: ERROR_CODES.ASSIGNMENT_NOT_FOUND });
    if (msg === 'already_completed')
      return res.status(400).json({ error: ERROR_CODES.ALREADY_COMPLETED });
    console.error('[submit_evaluation_error]', msg);
    return res.status(500).json({ error: ERROR_CODES.INTERNAL_ERROR });
  }
});

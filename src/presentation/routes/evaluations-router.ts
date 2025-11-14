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
    if (!meUser) return res.status(401).json({ error: ERROR_CODES.UNAUTHORIZED });
    // Find player by user id
    const player = await prisma.player.findUnique({
      where: { userId: meUser.id },
      select: { id: true },
    });
    if (!player) return res.status(404).json({ error: ERROR_CODES.PLAYER_NOT_FOUND });
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

// V2: avaliação por critérios ponderados
// POST /api/evaluations/:assignmentId/v2
// Body: { items: [{ key, value }], comment? }
const evalV2Schema = z.object({
  items: z
    .array(
      z.object({
        key: z.string().min(1),
        value: z.number().int().min(0).max(100),
      }),
    )
    .min(1),
  comment: z.string().max(500).optional(),
});

evaluationsRouter.post('/:assignmentId/v2', async (req, res) => {
  const assignmentId = req.params.assignmentId;
  if (!assignmentId) return res.status(400).json({ error: ERROR_CODES.INVALID_ASSIGNMENT_ID });
  const parsed = evalV2Schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: ERROR_CODES.INVALID_REQUEST });
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
      select: {
        id: true,
        evaluatorPlayerId: true,
        targetPlayerId: true,
        matchId: true,
        completedAt: true,
      },
    });
    if (!assignment) return res.status(404).json({ error: ERROR_CODES.ASSIGNMENT_NOT_FOUND });
    if (assignment.evaluatorPlayerId !== mePlayer.id)
      return res.status(403).json({ error: ERROR_CODES.FORBIDDEN });
    if (assignment.completedAt)
      return res.status(400).json({ error: ERROR_CODES.ALREADY_COMPLETED });

    // Determinar o formulário ativo pelo tipo de posição do alvo (simplificado)
    const pAny = prisma as unknown as {
      player: {
        findUnique: (args: {
          where: { id: string };
          select: { positionSlug?: true; position?: true };
        }) => Promise<{ positionSlug?: string; position?: string } | null>;
      };
    };
    const target = await pAny.player.findUnique({
      where: { id: assignment.targetPlayerId },
      select: { positionSlug: true, position: true },
    });
    const slug: string | undefined = target?.positionSlug ?? target?.position ?? undefined;
    const positionType = slug === 'GK' ? 'GOALKEEPER' : 'LINE';

    // Pegar o form ativo mais recente para o tipo
    const prismaAny = prisma as unknown as {
      evaluationForm: {
        findFirst: (args: {
          where: { positionType: string; isActive: boolean };
          orderBy: { version: 'desc' };
          select: { id: true };
        }) => Promise<{ id: string } | null>;
      };
      evaluationCriteria: {
        findMany: (args: {
          where: { formId: string };
          select: { id: true; key: true; weight: true; minValue: true; maxValue: true };
        }) => Promise<
          Array<{ id: string; key: string; weight: unknown; minValue: number; maxValue: number }>
        >;
      };
      playerEvaluation: {
        create: (args: {
          data: {
            assignmentId: string;
            comment?: string | null;
            formId: string;
            overallScore: unknown;
            formSnapshot?: unknown;
          };
          select: { id: true };
        }) => Promise<{ id: string }>;
      };
      playerEvaluationItem: {
        createMany: (args: {
          data: Array<{ evaluationId: string; criteriaId: string; value: number }>;
          skipDuplicates?: boolean;
        }) => Promise<unknown>;
      };
      playerEvaluationAggregate: {
        upsert: (args: {
          where: { playerId_formId: { playerId: string; formId: string } };
          create: {
            playerId: string;
            formId: string;
            count: number;
            weightedSum: unknown;
            average: unknown;
          };
          update: {
            count: { increment: number };
            weightedSum: { increment: unknown };
            average: unknown;
          };
          select: { playerId: true };
        }) => Promise<{ playerId: string }>;
      };
      matchPlayerEvaluationAssignment: {
        update: (args: { where: { id: string }; data: { completedAt: Date } }) => Promise<unknown>;
      };
    };

    const form = await prismaAny.evaluationForm.findFirst({
      where: { positionType, isActive: true },
      orderBy: { version: 'desc' },
      select: { id: true },
    });
    if (!form) return res.status(400).json({ error: 'no_active_form' });

    const criteria = await prismaAny.evaluationCriteria.findMany({
      where: { formId: form.id },
      select: { id: true, key: true, weight: true, minValue: true, maxValue: true },
    });
    const byKey = new Map(criteria.map((c) => [c.key, c]));
    let sumWeight = 0;
    let sumWeighted = 0;
    const itemsData: Array<{ evaluationId: string; criteriaId: string; value: number }> = [];

    // Validação e cálculo
    for (const it of parsed.data.items) {
      const c = byKey.get(it.key);
      if (!c) return res.status(400).json({ error: 'invalid_criteria_key', key: it.key });
      if (it.value < c.minValue || it.value > c.maxValue)
        return res.status(400).json({ error: 'invalid_value_range', key: it.key });
      const w = Number(c.weight as unknown as string);
      sumWeight += w;
      sumWeighted += w * it.value;
    }
    if (sumWeight <= 0) return res.status(400).json({ error: 'invalid_form_weights' });
    const overall = sumWeighted / sumWeight;

    // Persistir avaliação + itens
    const evalRec = await prismaAny.playerEvaluation.create({
      data: {
        assignmentId,
        comment: parsed.data.comment ?? null,
        formId: form.id,
        overallScore: Number(overall),
        formSnapshot: {
          criteria: criteria.map((c) => ({
            key: c.key,
            weight: c.weight,
            min: c.minValue,
            max: c.maxValue,
          })),
        },
      },
      select: { id: true },
    });
    for (const it of parsed.data.items) {
      const c = byKey.get(it.key)!;
      itemsData.push({ evaluationId: evalRec.id, criteriaId: c.id, value: it.value });
    }
    await prismaAny.playerEvaluationItem.createMany({ data: itemsData, skipDuplicates: true });

    // Atualizar agregado
    await prismaAny.playerEvaluationAggregate.upsert({
      where: { playerId_formId: { playerId: assignment.targetPlayerId, formId: form.id } },
      create: {
        playerId: assignment.targetPlayerId,
        formId: form.id,
        count: 1,
        weightedSum: Number(overall),
        average: Number(overall),
      },
      update: {
        count: { increment: 1 },
        weightedSum: { increment: Number(overall) },
        average: Number(overall),
      },
      select: { playerId: true },
    });

    await prismaAny.matchPlayerEvaluationAssignment.update({
      where: { id: assignmentId },
      data: { completedAt: new Date() },
    });

    return res.status(201).json({ id: evalRec.id, overallScore: overall });
  } catch (e) {
    console.error('[submit_evaluation_v2_error]', (e as Error).message);
    return res.status(500).json({ error: ERROR_CODES.INTERNAL_ERROR });
  }
});

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

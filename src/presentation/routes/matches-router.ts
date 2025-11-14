import { Router } from 'express';

import { makeAddMatchController } from '../../main/factories/make-add-match-controller.js';
import { makeListMatchesController } from '../../main/factories/make-list-matches-controller.js';
import { makeUpdateMatchScoreController } from '../../main/factories/make-update-match-score-controller.js';
import { makeUpdateMatchStatusController } from '../../main/factories/make-update-match-status-controller.js';
import { jwtAuth } from '../middlewares/jwt-auth.js';
import { PrismaMatchPlayerEvaluationRepository } from '../../infra/repositories/prisma-match-player-evaluation-repository.js';
import { prisma } from '../../infra/prisma/client.js';
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
  const matchId = req.params.id;
  try {
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      select: { homeTeamId: true, awayTeamId: true },
    });
    if (!match) return;
    // Tenta usar lineup
    const lineup = await prisma.matchLineupEntry.findMany({
      where: { matchId },
      select: { playerId: true, teamId: true },
    });
    const byTeam = new Map<string, string[]>();
    for (const entry of lineup) {
      const arr = byTeam.get(entry.teamId) ?? [];
      arr.push(entry.playerId);
      byTeam.set(entry.teamId, arr);
    }
    if (byTeam.size === 0) {
      // fallback: todos os players dos times
      for (const tid of [match.homeTeamId, match.awayTeamId]) {
        const pAny = prisma as unknown as {
          playersOnTeams: {
            findMany: (args: {
              where: { teamId: string };
              select: { playerId: true };
            }) => Promise<Array<{ playerId: string }>>;
          };
        };
        const links = await pAny.playersOnTeams.findMany({
          where: { teamId: tid },
          select: { playerId: true },
        });
        const ids = links.map((l) => l.playerId);
        byTeam.set(tid, ids);
      }
    }
    const evalRepo = new PrismaMatchPlayerEvaluationRepository();
    const createdAll: Array<{ evaluatorPlayerId: string; targetPlayerId: string }> = [];
    for (const [, playerIds] of byTeam.entries()) {
      if (playerIds.length < 2) continue;
      const created = await evalRepo.generateAssignments({
        matchId,
        teamPlayerIds: playerIds,
        perPlayerTargets: 3,
      });
      createdAll.push(...created);
    }
    if (!createdAll.length) return;
    const { sendNotification } = await import('../../infra/firebase/admin.js');
    const notified = new Set<string>();
    for (const a of createdAll) {
      if (notified.has(a.evaluatorPlayerId)) continue;
      notified.add(a.evaluatorPlayerId);
      sendNotification?.(
        a.evaluatorPlayerId,
        'Avaliações disponíveis',
        'Avalie seus colegas desta partida.',
      );
    }
  } catch (e) {
    console.error('[post_match_eval_generation_error]', (e as Error).message);
  }
});

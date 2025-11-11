import { Router } from 'express';
import { z } from 'zod';

import { makeAddMatchController } from '../../main/factories/make-add-match-controller.js';
import { makeListMatchesController } from '../../main/factories/make-list-matches-controller.js';
import { makeUpdateMatchScoreController } from '../../main/factories/make-update-match-score-controller.js';
import { makeUpdateMatchStatusController } from '../../main/factories/make-update-match-status-controller.js';
import { jwtAuth } from '../middlewares/jwt-auth.js';
import { PrismaMatchEventRepository } from '../../infra/repositories/prisma-match-event-repository.js';
import { PrismaMatchPlayerEvaluationRepository } from '../../infra/repositories/prisma-match-player-evaluation-repository.js';
import { prisma } from '../../infra/prisma/client.js';

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

// Lineup endpoints
// Define toda a escalação de uma vez: { home: string[], away: string[] }
const lineupSchema = z.object({
  home: z.array(z.string()).default([]),
  away: z.array(z.string()).default([]),
});
matchesRouter.post('/:id/lineup', async (req, res) => {
  const matchId = req.params.id;
  const parsed = lineupSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'invalid_request' });
  try {
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      select: { homeTeamId: true, awayTeamId: true },
    });
    if (!match) return res.status(404).json({ error: 'match_not_found' });
    // remove lineup atual
    await prisma.matchLineupEntry.deleteMany({ where: { matchId } });
    // cria nova
    const data: Array<{ matchId: string; teamId: string; playerId: string }> = [];
    for (const pid of parsed.data.home)
      data.push({ matchId, teamId: match.homeTeamId, playerId: pid });
    for (const pid of parsed.data.away)
      data.push({ matchId, teamId: match.awayTeamId, playerId: pid });
    if (data.length) await prisma.matchLineupEntry.createMany({ data });
    return res.status(204).send();
  } catch (e) {
    console.error('[set_lineup_error]', (e as Error).message);
    return res.status(500).json({ error: 'internal_error' });
  }
});

matchesRouter.get('/:id/lineup', async (req, res) => {
  const matchId = req.params.id;
  try {
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      select: { homeTeamId: true, awayTeamId: true },
    });
    if (!match) return res.status(404).json({ error: 'match_not_found' });
    const entries = await prisma.matchLineupEntry.findMany({
      where: { matchId },
      select: { playerId: true, teamId: true },
    });
    const home = entries.filter((e) => e.teamId === match.homeTeamId).map((e) => e.playerId);
    const away = entries.filter((e) => e.teamId === match.awayTeamId).map((e) => e.playerId);
    res.json({ home, away });
  } catch (e) {
    console.error('[get_lineup_error]', (e as Error).message);
    return res.status(500).json({ error: 'internal_error' });
  }
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
  try {
    const bodyTyped = response.body as { id?: string; status?: string } | undefined;
    if (response.statusCode === 200 && bodyTyped?.status === 'FINISHED') {
      const matchId = req.params.id;
      const match = await prisma.match.findUnique({
        where: { id: matchId },
        select: { homeTeamId: true, awayTeamId: true, scheduledAt: true },
      });
      if (match) {
        // Preferir lineup se existir; caso contrário, cai no fallback com todos os jogadores vinculados ao time
        const entries = await prisma.matchLineupEntry.findMany({
          where: { matchId },
          select: { playerId: true, teamId: true },
        });
        const byTeam = new Map<string, string[]>();
        for (const entry of entries) {
          const arr = byTeam.get(entry.teamId) ?? [];
          arr.push(entry.playerId);
          byTeam.set(entry.teamId, arr);
        }
        if (byTeam.size === 0) {
          for (const teamId of [match.homeTeamId, match.awayTeamId]) {
            const t = await prisma.team.findUnique({
              where: { id: teamId },
              select: { players: { select: { id: true } } },
            });
            const ids = (t?.players ?? []).map((p: { id: string }) => p.id);
            byTeam.set(teamId, ids);
          }
        }
        const evalRepo = new PrismaMatchPlayerEvaluationRepository();
        let createdAll: Array<{ evaluatorPlayerId: string; targetPlayerId: string }> = [];
        for (const [, playerIds] of byTeam.entries()) {
          if (playerIds.length < 2) continue; // precisa de pelo menos 2 para avaliar alguém
          const created = await evalRepo.generateAssignments({
            matchId,
            teamPlayerIds: playerIds,
            perPlayerTargets: 3,
          });
          createdAll = createdAll.concat(created);
        }
        // Notificações (stub) para cada avaliador
        if (createdAll.length) {
          const { sendNotification } = await import('../../infra/firebase/admin.js');
          const notified = new Set<string>();
          for (const a of createdAll) {
            if (!notified.has(a.evaluatorPlayerId)) {
              notified.add(a.evaluatorPlayerId);
              sendNotification?.(
                a.evaluatorPlayerId,
                'Avaliações disponíveis',
                'Avalie seus colegas desta partida.',
              );
            }
          }
        }
      }
    }
  } catch (e) {
    console.error('[post_match_eval_generation_error]', (e as Error).message);
  }
});

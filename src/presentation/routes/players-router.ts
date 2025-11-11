import { Router } from 'express';
import { z } from 'zod';

import { makeAddPlayerController } from '../../main/factories/make-add-player-controller.js';
import { GetMyPlayerController } from '../controllers/get-my-player-controller.js';
import { CreateMyPlayerController } from '../controllers/create-my-player-controller.js';
import { HttpRequest } from '../protocols/http.js';
import { jwtAuth } from '../middlewares/jwt-auth.js';
import { PrismaPlayerSkillRepository } from '../../infra/repositories/prisma-player-skill-repository.js';
import { prisma } from '../../infra/prisma/client.js';

export const playersRouter = Router();

// Protege todas as rotas de players
playersRouter.use(jwtAuth);

playersRouter.post('/', async (req, res) => {
  const controller = makeAddPlayerController();
  const response = await controller.handle({ body: req.body });
  res.status(response.statusCode).json(response.body);
});

playersRouter.get('/me', async (req, res) => {
  const controller = new GetMyPlayerController();
  const request: HttpRequest & { user?: { id: string } } = {};
  request.user = req.user as { id: string } | undefined; // rely on express augmented type
  const response = await controller.handle(request);
  res.status(response.statusCode).json(response.body);
});

playersRouter.post('/me', async (req, res) => {
  const controller = new CreateMyPlayerController();
  const request: HttpRequest & { user?: { id: string } } = { body: req.body };
  request.user = req.user as { id: string } | undefined;
  const response = await controller.handle(request);
  res.status(response.statusCode).json(response.body);
});

// Upsert my skills (metrics for graph)
const skillSchema = z.object({
  preferredFoot: z.enum(['LEFT', 'RIGHT', 'BOTH']),
  attack: z.number().int().min(0).max(100),
  defense: z.number().int().min(0).max(100),
  shooting: z.number().int().min(0).max(100),
  ballControl: z.number().int().min(0).max(100),
  pace: z.number().int().min(0).max(100),
  passing: z.number().int().min(0).max(100).optional(),
  dribbling: z.number().int().min(0).max(100).optional(),
  physical: z.number().int().min(0).max(100).optional(),
});

playersRouter.post('/me/skills', async (req, res) => {
  try {
    const parsed = skillSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'invalid_request' });
    // find my player
    const meUser = req.user as { id: string } | undefined;
    if (!meUser) return res.status(401).json({ error: 'unauthorized' });
    const player = await prisma.player.findUnique({ where: { userId: meUser.id } });
    if (!player) return res.status(404).json({ error: 'player_not_found' });
    const repo = new PrismaPlayerSkillRepository();
    const rec = await repo.upsert({
      playerId: player.id,
      ...parsed.data,
    });
    res.status(201).json({ id: rec.id });
  } catch (e) {
    // Log para facilitar diagnóstico em ambiente de testes
    console.error('[player_skill_upsert_error]', (e as Error).message);
    return res.status(500).json({ error: 'internal_error', message: (e as Error).message });
  }
});

playersRouter.get('/me/graph', async (req, res) => {
  const meUser = req.user as { id: string } | undefined;
  if (!meUser) return res.status(401).json({ error: 'unauthorized' });
  const player = await prisma.player.findUnique({ where: { userId: meUser.id } });
  if (!player) return res.status(404).json({ error: 'player_not_found' });
  const repo = new PrismaPlayerSkillRepository();
  const skill = await repo.findByPlayerId(player.id);
  if (!skill) return res.status(404).json({ error: 'skills_not_found' });
  res.json({
    preferredFoot: skill.preferredFoot,
    attack: skill.attack,
    defense: skill.defense,
    shooting: skill.shooting,
    ballControl: skill.ballControl,
    pace: skill.pace,
    passing: skill.passing,
    dribbling: skill.dribbling,
    physical: skill.physical,
    updatedAt: skill.updatedAt,
  });
});

playersRouter.get('/me/team/overview', async (req, res) => {
  const meUser = req.user as { id: string } | undefined;
  if (!meUser) return res.status(401).json({ error: 'unauthorized' });
  const { teamId } = req.query as { teamId?: string };
  // Get my player and teams
  const playerTeams = await prisma.player.findUnique({
    where: { userId: meUser.id },
    select: { id: true, teams: { select: { id: true, name: true } } },
  });
  if (!playerTeams) return res.status(404).json({ error: 'player_not_found' });
  const teams = playerTeams.teams as Array<{ id: string; name: string }>;
  if (teams.length === 0) return res.status(404).json({ error: 'no_team' });
  const selectedTeamId = teamId || teams[0].id;
  const team = teams.find((t: { id: string; name: string }) => t.id === selectedTeamId) || teams[0];
  // recent matches and next game
  const recent = await prisma.match.findMany({
    where: { OR: [{ homeTeamId: team.id }, { awayTeamId: team.id }] },
    orderBy: { scheduledAt: 'desc' },
    take: 5,
    select: {
      id: true,
      scheduledAt: true,
      status: true,
      venue: true,
      homeTeamId: true,
      awayTeamId: true,
      homeScore: true,
      awayScore: true,
    },
  });
  const now = new Date();
  const next = await prisma.match.findFirst({
    where: {
      status: 'SCHEDULED',
      scheduledAt: { gte: now },
      OR: [{ homeTeamId: team.id }, { awayTeamId: team.id }],
    },
    orderBy: { scheduledAt: 'asc' },
    select: { id: true, scheduledAt: true, venue: true, homeTeamId: true, awayTeamId: true },
  });
  res.json({
    team: { id: team.id, name: team.name },
    recentMatches: recent,
    next_game: next || null,
  });
});

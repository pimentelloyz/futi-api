import { Router } from 'express';
import multer from 'multer';
import { z } from 'zod';

import { makeAddPlayerController } from '../../main/factories/make-add-player-controller.js';
import { makeCheckPlayerExistsController } from '../../main/factories/make-check-player-exists-controller.js';
import { makeUpdateMyPlayerController } from '../../main/factories/make-update-my-player-controller.js';
import { makeUploadPlayerPhotoController } from '../../main/factories/make-upload-player-photo-controller.js';
import { makeGetMyTeamOverviewController } from '../../main/factories/make-get-my-team-overview-controller.js';
import { GetMyPlayerController } from '../controllers/get-my-player-controller.js';
import { CreateMyPlayerController } from '../controllers/create-my-player-controller.js';
import { makeCreateMyPlayerController } from '../../main/factories/make-create-my-player-controller.js';
import { HttpRequest } from '../protocols/http.js';
import { jwtAuth } from '../middlewares/jwt-auth.js';
import { PrismaPlayerSkillRepository } from '../../infra/repositories/prisma-player-skill-repository.js';
import { prisma } from '../../infra/prisma/client.js';
import { EvaluationBannerController } from '../controllers/evaluation-banner-controller.js';
import { PendingEvaluationsController } from '../controllers/pending-evaluations-controller.js';
import { processOptionalPlayerPhoto } from '../middlewares/process-player-photo-upload.js';
import { ERROR_CODES } from '../../domain/constants.js';

export const playersRouter = Router();

// Protege todas as rotas de players
playersRouter.use(jwtAuth);

// Multer para uploads em memória (até 2MB por arquivo)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 },
});

playersRouter.post(
  '/',
  upload.single('file'),
  processOptionalPlayerPhoto,
  async (req, res) => {
    const controller = makeAddPlayerController();
    const request: HttpRequest & { user?: { id: string } } = { body: req.body };
    request.user = req.user as { id: string } | undefined;
    const response = await controller.handle(request);
    res.status(response.statusCode).json(response.body);
  },
);

playersRouter.get('/me', async (req, res) => {
  const controller = new GetMyPlayerController();
  const request: HttpRequest & { user?: { id: string } } = {};
  request.user = req.user as { id: string } | undefined; // rely on express augmented type
  const response = await controller.handle(request);
  res.status(response.statusCode).json(response.body);
});

// Retorna 200 se o usuário autenticado possuir Player vinculado; caso contrário, 404
playersRouter.get('/me/exists', makeCheckPlayerExistsController().handleExpress);

// Atualiza meu perfil de jogador
playersRouter.patch('/me', makeUpdateMyPlayerController().handleExpress);

// Criação do player para o usuário autenticado (suporta upload de foto via multipart)
playersRouter.post('/me', upload.single('file'), makeCreateMyPlayerController().handleExpress);

// Upload de foto de perfil do jogador existente
playersRouter.post('/:id/photo', upload.single('file'), async (req, res) => {
  const controller = makeUploadPlayerPhotoController();
  const response = await controller.handle({
    params: { id: req.params.id },
    file: req.file,
  });
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
    if (!parsed.success) return res.status(400).json({ error: ERROR_CODES.INVALID_REQUEST });
    // find my player
    const meUser = req.user as { id: string } | undefined;
    if (!meUser) return res.status(401).json({ error: ERROR_CODES.UNAUTHORIZED });
    const player = await prisma.player.findUnique({ where: { userId: meUser.id } });
    if (!player) return res.status(404).json({ error: ERROR_CODES.PLAYER_NOT_FOUND });
    const repo = new PrismaPlayerSkillRepository();
    const rec = await repo.upsert({
      playerId: player.id,
      ...parsed.data,
    });
    res.status(201).json({ id: rec.id });
  } catch (e) {
    // Log para facilitar diagnóstico em ambiente de testes
    console.error('[player_skill_upsert_error]', (e as Error).message);
    return res
      .status(500)
      .json({ error: ERROR_CODES.INTERNAL_ERROR, message: (e as Error).message });
  }
});

playersRouter.get('/me/graph', async (req, res) => {
  const meUser = req.user as { id: string } | undefined;
  if (!meUser) return res.status(401).json({ error: ERROR_CODES.UNAUTHORIZED });
  const player = await prisma.player.findUnique({ where: { userId: meUser.id } });
  if (!player) return res.status(404).json({ error: ERROR_CODES.PLAYER_NOT_FOUND });
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
  const controller = makeGetMyTeamOverviewController();
  const response = await controller.handle({
    user: req.user as { id: string } | undefined,
    query: req.query as { teamId?: string },
  });
  res.status(response.statusCode).json(response.body);
});

playersRouter.get('/me/evaluations/pending', async (req, res) => {
  const controller = new PendingEvaluationsController();
  const meUser = req.user as { id: string } | undefined;
  const response = await controller.handle({ userId: meUser?.id });
  return res.status(response.statusCode).json(response.body);
});

playersRouter.get('/me/evaluation/banner', async (req, res) => {
  const controller = new EvaluationBannerController();
  const meUser = req.user as { id: string } | undefined;
  const { teamId, includePlayers } = req.query as { teamId?: string; includePlayers?: string };
  const response = await controller.handle({
    userId: meUser?.id,
    teamId,
    includePlayers: includePlayers === 'true',
  });
  return res.status(response.statusCode).json(response.body);
});

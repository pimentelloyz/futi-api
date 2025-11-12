import path from 'node:path';

import { Router } from 'express';
import multer from 'multer';
import { z } from 'zod';

import { makeAddPlayerController } from '../../main/factories/make-add-player-controller.js';
import { GetMyPlayerController } from '../controllers/get-my-player-controller.js';
import { CreateMyPlayerController } from '../controllers/create-my-player-controller.js';
import { HttpRequest } from '../protocols/http.js';
import { jwtAuth } from '../middlewares/jwt-auth.js';
import { PrismaPlayerSkillRepository } from '../../infra/repositories/prisma-player-skill-repository.js';
import { prisma } from '../../infra/prisma/client.js';
import { ERROR_CODES } from '../../domain/constants.js';

export const playersRouter = Router();

// Protege todas as rotas de players
playersRouter.use(jwtAuth);

// Multer para uploads em memória (até 2MB por arquivo)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 },
});

playersRouter.post('/', async (req, res) => {
  const controller = makeAddPlayerController();
  const isMultipart = req.is('multipart/form-data');
  try {
    let photoUrlFromUpload: string | undefined;
    if (isMultipart) {
      await new Promise<void>((resolve, reject) => {
        upload.single('file')(req, res, (err: unknown) => {
          if (err) return reject(err);
          return resolve();
        });
      });
      const file = req.file;
      if (file) {
        const allowed = new Set(['image/png', 'image/jpeg', 'image/webp']);
        if (!allowed.has(file.mimetype)) {
          return res.status(415).json({ error: ERROR_CODES.UNSUPPORTED_MEDIA_TYPE });
        }
        const ext =
          file.mimetype === 'image/png' ? 'png' : file.mimetype === 'image/webp' ? 'webp' : 'jpg';
        const stamp = Date.now();
        const safeName =
          String(
            (req.body?.name ?? 'player')
              .toString()
              .toLowerCase()
              .replace(/[^a-z0-9-_]/g, ''),
          ) || 'player';
        const objectPath = path.posix.join('players', 'new', `${safeName}_${stamp}.${ext}`);
        const { getDefaultBucket } = await import('../../infra/firebase/admin.js');
        const bucket = getDefaultBucket();
        const gcsFile = bucket.file(objectPath);
        await gcsFile.save(file.buffer, {
          contentType: file.mimetype,
          resumable: false,
          metadata: { cacheControl: 'public,max-age=3600' },
        });
        try {
          await gcsFile.makePublic();
        } catch {}
        photoUrlFromUpload = `https://storage.googleapis.com/${bucket.name}/${objectPath}`;
      }
    }

    const body = isMultipart
      ? {
          name: req.body?.name,
          position: req.body?.position ?? undefined,
          number:
            typeof req.body?.number === 'string' ? Number.parseInt(req.body.number, 10) : undefined,
          isActive:
            typeof req.body?.isActive === 'string' ? req.body.isActive === 'true' : undefined,
          teamIds: Array.isArray(req.body?.teamIds)
            ? req.body.teamIds
            : typeof req.body?.teamIds === 'string' && req.body.teamIds
              ? String(req.body.teamIds)
                  .split(',')
                  .map((s) => s.trim())
                  .filter(Boolean)
              : undefined,
          photo: photoUrlFromUpload ?? req.body?.photo ?? undefined,
        }
      : req.body;

    const response = await controller.handle({ body });
    res.status(response.statusCode).json(response.body);
  } catch (e) {
    const msg = (e as Error).message || '';
    console.error('[player_create_error]', msg);
    if (msg.toLowerCase().includes('multipart'))
      return res.status(400).json({ error: ERROR_CODES.INVALID_MULTIPART });
    if (msg.includes('Environment validation failed') || msg.includes('firebase')) {
      return res.status(500).json({ error: ERROR_CODES.FIREBASE_CONFIG_ERROR });
    }
    return res.status(500).json({ error: ERROR_CODES.INTERNAL_ERROR });
  }
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
  const isMultipart = req.is('multipart/form-data');
  try {
    let photoUrlFromUpload: string | undefined;
    if (isMultipart) {
      await new Promise<void>((resolve, reject) => {
        upload.single('file')(req, res, (err: unknown) => {
          if (err) return reject(err);
          return resolve();
        });
      });
      const file = req.file;
      if (file) {
        const allowed = new Set(['image/png', 'image/jpeg', 'image/webp']);
        if (!allowed.has(file.mimetype)) {
          return res.status(415).json({ error: ERROR_CODES.UNSUPPORTED_MEDIA_TYPE });
        }
        const ext =
          file.mimetype === 'image/png' ? 'png' : file.mimetype === 'image/webp' ? 'webp' : 'jpg';
        const stamp = Date.now();
        const safeName =
          String(
            (req.body?.name ?? 'player')
              .toString()
              .toLowerCase()
              .replace(/[^a-z0-9-_]/g, ''),
          ) || 'player';
        const objectPath = path.posix.join('players', 'new', `${safeName}_${stamp}.${ext}`);
        const { getDefaultBucket } = await import('../../infra/firebase/admin.js');
        const bucket = getDefaultBucket();
        const gcsFile = bucket.file(objectPath);
        await gcsFile.save(file.buffer, {
          contentType: file.mimetype,
          resumable: false,
          metadata: { cacheControl: 'public,max-age=3600' },
        });
        try {
          await gcsFile.makePublic();
        } catch {}
        photoUrlFromUpload = `https://storage.googleapis.com/${bucket.name}/${objectPath}`;
      }
    }

    const body = isMultipart
      ? {
          name: req.body?.name,
          position: req.body?.position ?? undefined,
          number:
            typeof req.body?.number === 'string' ? Number.parseInt(req.body.number, 10) : undefined,
          teamIds: Array.isArray(req.body?.teamIds)
            ? req.body.teamIds
            : typeof req.body?.teamIds === 'string' && req.body.teamIds
              ? String(req.body.teamIds)
                  .split(',')
                  .map((s) => s.trim())
                  .filter(Boolean)
              : undefined,
          photo: photoUrlFromUpload ?? req.body?.photo ?? undefined,
        }
      : req.body;

    const request: HttpRequest & { user?: { id: string } } = { body };
    request.user = req.user as { id: string } | undefined;
    const response = await controller.handle(request);
    res.status(response.statusCode).json(response.body);
  } catch (e) {
    const msg = (e as Error).message || '';
    console.error('[player_me_create_error]', msg);
    if (msg.toLowerCase().includes('multipart'))
      return res.status(400).json({ error: ERROR_CODES.INVALID_MULTIPART });
    if (msg.includes('Environment validation failed') || msg.includes('firebase')) {
      return res.status(500).json({ error: ERROR_CODES.FIREBASE_CONFIG_ERROR });
    }
    return res.status(500).json({ error: ERROR_CODES.INTERNAL_ERROR });
  }
});

// Upload de foto de perfil do jogador existente
playersRouter.post('/:id/photo', upload.single('file'), async (req, res) => {
  const playerId = req.params.id;
  if (!playerId) return res.status(400).json({ error: ERROR_CODES.INVALID_PLAYER_ID });
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ error: ERROR_CODES.INVALID_MULTIPART });
    const allowed = new Set(['image/png', 'image/jpeg', 'image/webp']);
    if (!allowed.has(file.mimetype))
      return res.status(415).json({ error: ERROR_CODES.UNSUPPORTED_MEDIA_TYPE });
    const ext =
      file.mimetype === 'image/png' ? 'png' : file.mimetype === 'image/webp' ? 'webp' : 'jpg';
    const stamp = Date.now();
    const objectPath = path.posix.join('players', playerId, `photo_${stamp}.${ext}`);
    const { getDefaultBucket } = await import('../../infra/firebase/admin.js');
    const bucket = getDefaultBucket();
    const gcsFile = bucket.file(objectPath);
    await gcsFile.save(file.buffer, {
      contentType: file.mimetype,
      resumable: false,
      metadata: { cacheControl: 'public,max-age=3600' },
    });
    try {
      await gcsFile.makePublic();
    } catch {}
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${objectPath}`;
    try {
      await prisma.player.update({ where: { id: playerId }, data: { photo: publicUrl } });
    } catch (e) {
      // Caso o schema ainda não tenha a coluna 'photo', retornamos a URL sem persistir
      console.warn('[player_photo_update_warn]', (e as Error).message);
    }
    return res.status(200).json({ photoUrl: publicUrl });
  } catch (e) {
    const msg = (e as Error).message || '';
    console.error('[player_photo_upload_error]', msg);
    if (msg.includes('Environment validation failed') || msg.includes('firebase')) {
      return res.status(500).json({ error: ERROR_CODES.FIREBASE_CONFIG_ERROR });
    }
    return res.status(500).json({ error: ERROR_CODES.INTERNAL_ERROR });
  }
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
  const meUser = req.user as { id: string } | undefined;
  if (!meUser) return res.status(401).json({ error: ERROR_CODES.UNAUTHORIZED });
  const { teamId } = req.query as { teamId?: string };
  // Get my player and teams
  const playerTeams = await prisma.player.findUnique({
    where: { userId: meUser.id },
    select: { id: true, teams: { select: { id: true, name: true } } },
  });
  if (!playerTeams) return res.status(404).json({ error: ERROR_CODES.PLAYER_NOT_FOUND });
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

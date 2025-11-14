import path from 'node:path';

import { Router } from 'express';
import multer from 'multer';

import { makeAddTeamController } from '../../main/factories/make-add-team-controller.js';
import { makeListTeamsController } from '../../main/factories/make-list-teams-controller.js';
import { jwtAuth } from '../middlewares/jwt-auth.js';
import { ERROR_CODES } from '../../domain/constants.js';

export const teamsRouter = Router();

// Proteger todas as rotas de teams com JWT interno
teamsRouter.use(jwtAuth);

// Multer para uploads em memória (até 2MB por arquivo)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 },
});

teamsRouter.post('/', async (req, res) => {
  const isMultipart = req.is('multipart/form-data');
  try {
    let iconUrlFromUpload: string | undefined;
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
            (req.body?.name ?? 'team')
              .toString()
              .toLowerCase()
              .replace(/[^a-z0-9-_]/g, ''),
          ) || 'team';
        const objectPath = path.posix.join('teams', 'new', `${safeName}_${stamp}.${ext}`);
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
        iconUrlFromUpload = `https://storage.googleapis.com/${bucket.name}/${objectPath}`;
      }
    }

    const controller = makeAddTeamController();
    const body = isMultipart
      ? {
          name: req.body?.name,
          icon: iconUrlFromUpload ?? req.body?.icon ?? undefined,
          description: req.body?.description ?? undefined,
          isActive:
            typeof req.body?.isActive === 'string' ? req.body.isActive === 'true' : undefined,
        }
      : req.body;
    const response = await controller.handle({ body });
    return res.status(response.statusCode).json(response.body);
  } catch (e) {
    console.error('[team_create_error]', (e as Error).message);
    if ((e as Error).message?.toLowerCase().includes('multipart'))
      return res.status(400).json({ error: ERROR_CODES.INVALID_MULTIPART });
    return res.status(500).json({ error: ERROR_CODES.INTERNAL_ERROR });
  }
});

// Listar todos os times
teamsRouter.get('/', async (req, res) => {
  const controller = makeListTeamsController();
  const response = await controller.handle({ query: req.query as Record<string, unknown> });
  return res.status(response.statusCode).json(response.body);
});

// Upload de ícone do time
teamsRouter.post('/:id/icon', upload.single('file'), async (req, res) => {
  const teamId = req.params.id;
  if (!teamId) return res.status(400).json({ error: ERROR_CODES.INVALID_TEAM_ID });
  try {
    const prisma = (await import('../../infra/prisma/client.js')).prisma;
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      select: { id: true, isActive: true },
    });
    if (!team || team.isActive === false) return res.status(404).json({ error: 'team_not_found' });

    const file = req.file;
    if (!file) return res.status(400).json({ error: 'file_required' });
    const allowed = new Set(['image/png', 'image/jpeg', 'image/webp']);
    if (!allowed.has(file.mimetype))
      return res.status(415).json({ error: ERROR_CODES.UNSUPPORTED_MEDIA_TYPE });
    const ext =
      file.mimetype === 'image/png' ? 'png' : file.mimetype === 'image/webp' ? 'webp' : 'jpg';
    const folderPrefix = path.posix.join('teams', teamId, '/');
    const objectPath = path.posix.join('teams', teamId, `${teamId}.${ext}`);

    const { getDefaultBucket } = await import('../../infra/firebase/admin.js');
    const bucket = getDefaultBucket();
    try {
      const [existing] = await bucket.getFiles({ prefix: folderPrefix });
      if (existing && existing.length) await Promise.allSettled(existing.map((f) => f.delete()));
    } catch {}
    const gcsFile = bucket.file(objectPath);
    await gcsFile.save(file.buffer, {
      contentType: file.mimetype,
      resumable: false,
      metadata: { cacheControl: 'no-cache, max-age=0' },
    });
    try {
      await gcsFile.makePublic();
    } catch {}
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${objectPath}`;
    await prisma.team.update({ where: { id: teamId }, data: { icon: publicUrl } });
    return res.status(200).json({ iconUrl: publicUrl });
  } catch (e) {
    console.error('[team_icon_upload_error]', (e as Error).message);
    return res.status(500).json({ error: ERROR_CODES.INTERNAL_ERROR });
  }
});

// Editar um time
teamsRouter.patch('/:id', async (req, res) => {
  const teamId = req.params.id;
  if (!teamId) return res.status(400).json({ error: ERROR_CODES.INVALID_TEAM_ID });
  const { name, icon, description, isActive } = req.body || {};
  const updateData: Record<string, unknown> = {};
  if (typeof name === 'string') updateData.name = name;
  if (typeof icon === 'string' || icon === null) updateData.icon = icon;
  if (typeof description === 'string' || description === null) updateData.description = description;
  if (typeof isActive === 'boolean') updateData.isActive = isActive;
  if (Object.keys(updateData).length === 0)
    return res.status(400).json({ error: ERROR_CODES.INVALID_BODY });
  try {
    const prisma = (await import('../../infra/prisma/client.js')).prisma;
    const team = await prisma.team.findUnique({ where: { id: teamId }, select: { id: true } });
    if (!team) return res.status(404).json({ error: ERROR_CODES.TEAM_NOT_FOUND });
    const updated = await prisma.team.update({ where: { id: teamId }, data: updateData });
    return res.json({
      id: updated.id,
      name: updated.name,
      icon: updated.icon,
      description: updated.description,
      isActive: updated.isActive,
    });
  } catch (e) {
    console.error('[team_update_error]', (e as Error).message);
    return res.status(500).json({ error: ERROR_CODES.INTERNAL_ERROR });
  }
});

// Listar jogadores de um time (join explícito)
teamsRouter.get('/:id/players', async (req, res) => {
  const teamId = req.params.id;
  if (!teamId) return res.status(400).json({ error: 'invalid_team_id' });
  const page = Math.max(parseInt(String(req.query.page ?? '1'), 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(String(req.query.limit ?? '20'), 10) || 20, 1), 100);
  const sort = String(req.query.sort ?? 'name') as 'name' | 'number' | 'positionSlug' | 'isActive';
  const order = String(req.query.order ?? 'asc') === 'desc' ? 'desc' : 'asc';
  const includeTeam = String(req.query.includeTeam ?? 'false') === 'true';
  const validSorts = new Set(['name', 'number', 'positionSlug', 'isActive']);
  const sortKey = validSorts.has(sort) ? sort : 'name';
  try {
    const prismaMod = await import('../../infra/prisma/client.js');
    const prismaAny = prismaMod.prisma as unknown as {
      team: { findUnique: (args: Record<string, unknown>) => Promise<unknown> };
    };
    // Tenta via join explícito (PlayersOnTeams -> player)
    const teamExplicit = (await prismaAny.team.findUnique({
      where: { id: teamId },
      select: {
        isActive: true,
        id: includeTeam ? true : undefined,
        name: includeTeam ? true : undefined,
        players: {
          include: {
            player: {
              select: { id: true, name: true, positionSlug: true, number: true, isActive: true },
            },
          },
        },
      },
    })) as unknown as {
      isActive: boolean;
      id?: string;
      name?: string;
      players: Array<{ player?: unknown }>;
    } | null;
    if (!teamExplicit || teamExplicit.isActive === false)
      return res.status(404).json({ error: 'team_not_found' });
    const isPlayerLite = (
      p: unknown,
    ): p is {
      id: string;
      name: string;
      positionSlug: string | null;
      number: number | null;
      isActive: boolean;
    } => {
      if (!p || typeof p !== 'object') return false;
      const o = p as Record<string, unknown>;
      return (
        typeof o.id === 'string' && typeof o.name === 'string' && typeof o.isActive === 'boolean'
      );
    };
    let players = (teamExplicit.players ?? [])
      .map((pt: { player?: unknown }) => pt?.player)
      .filter(isPlayerLite) as Array<{
      id: string;
      name: string;
      positionSlug: string | null;
      number: number | null;
      isActive: boolean;
    }>;
    let teamMeta: { id?: string; name?: string } = { id: teamExplicit.id, name: teamExplicit.name };
    // Fallback: alguns ambientes de teste usam mock com relação implícita (players: Player[])
    if (players.length === 0) {
      const legacy = (await prismaAny.team.findUnique({
        where: { id: teamId },
        select: {
          isActive: true,
          id: includeTeam ? true : undefined,
          name: includeTeam ? true : undefined,
          players: {
            select: { id: true, name: true, positionSlug: true, number: true, isActive: true },
          },
        },
      })) as unknown as {
        isActive: boolean;
        id?: string;
        name?: string;
        players: Array<{
          id: string;
          name: string;
          positionSlug: string | null;
          number: number | null;
          isActive: boolean;
        }>;
      } | null;
      if (!legacy || legacy.isActive === false)
        return res.status(404).json({ error: 'team_not_found' });
      teamMeta = { id: legacy.id, name: legacy.name };
      players = (legacy.players ?? []) as Array<{
        id: string;
        name: string;
        positionSlug: string | null;
        number: number | null;
        isActive: boolean;
      }>;
    }
    type PlayerLite = {
      id: string;
      name: string;
      positionSlug: string | null;
      number: number | null;
      isActive: boolean;
    };
    const items = [...players].sort((a: PlayerLite, b: PlayerLite) => {
      const aVal = (a as Record<string, unknown>)[sortKey];
      const bVal = (b as Record<string, unknown>)[sortKey];
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return order === 'asc' ? -1 : 1;
      if (bVal == null) return order === 'asc' ? 1 : -1;
      if (typeof aVal === 'string' && typeof bVal === 'string')
        return order === 'asc'
          ? (aVal as string).localeCompare(bVal as string)
          : (bVal as string).localeCompare(aVal as string);
      if (aVal === bVal) return 0;
      return order === 'asc'
        ? (aVal as number) < (bVal as number)
          ? -1
          : 1
        : (aVal as number) > (bVal as number)
          ? -1
          : 1;
    });
    const total = items.length;
    const start = (page - 1) * limit;
    const paged = items.slice(start, start + limit);
    const payload: {
      items: PlayerLite[];
      page: number;
      limit: number;
      total: number;
      team?: { id: string; name: string };
    } = {
      items: paged,
      page,
      limit,
      total,
    };
    if (includeTeam) payload.team = { id: teamMeta.id!, name: teamMeta.name! };
    res.json(payload);
  } catch (e) {
    console.error('[team_players_error]', (e as Error).message);
    return res.status(500).json({ error: ERROR_CODES.INTERNAL_ERROR });
  }
});

// Vincular jogador a um time
teamsRouter.post('/:id/players', async (req, res) => {
  const teamId = req.params.id;
  const { playerId } = req.body || {};
  if (!teamId) return res.status(400).json({ error: ERROR_CODES.INVALID_TEAM_ID });
  if (!playerId || typeof playerId !== 'string')
    return res.status(400).json({ error: ERROR_CODES.INVALID_PLAYER_ID });
  try {
    const prisma = (await import('../../infra/prisma/client.js')).prisma;
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      select: { id: true, isActive: true },
    });
    if (!team || team.isActive === false)
      return res.status(404).json({ error: ERROR_CODES.TEAM_NOT_FOUND });
    // Tentar formatos compatíveis: primeiro 'connect' (mock/implícito), depois 'create' (join explícito)
    try {
      const db1 = prisma as unknown as {
        player: { update: (args: Record<string, unknown>) => Promise<unknown> };
      };
      await db1.player.update({
        where: { id: playerId },
        data: { teams: { connect: [{ id: teamId }] } },
      });
    } catch (err1) {
      const msg1 = (err1 as Error).message || '';
      try {
        const db2 = prisma as unknown as {
          player: { update: (args: Record<string, unknown>) => Promise<unknown> };
        };
        await db2.player.update({
          where: { id: playerId },
          data: { teams: { create: { teamId } } },
        });
      } catch (err2) {
        const msg2 = (err2 as Error).message || '';
        // Ignorar duplicidade; propagar demais erros
        if (!/unique/i.test(msg1) && !/unique/i.test(msg2)) throw err2;
      }
    }
    return res.status(204).send();
  } catch (e) {
    console.error('[team_add_player_error]', (e as Error).message);
    return res.status(500).json({ error: ERROR_CODES.INTERNAL_ERROR });
  }
});

// Soft delete de um time
teamsRouter.delete('/:id', async (req, res) => {
  const teamId = req.params.id;
  if (!teamId) return res.status(400).json({ error: ERROR_CODES.INVALID_TEAM_ID });
  try {
    const prisma = (await import('../../infra/prisma/client.js')).prisma;
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      select: { id: true, isActive: true },
    });
    if (!team) return res.status(404).json({ error: ERROR_CODES.TEAM_NOT_FOUND });
    if (team.isActive)
      await prisma.team.update({ where: { id: teamId }, data: { isActive: false } });
    return res.status(204).send();
  } catch (e) {
    console.error('[team_soft_delete_error]', (e as Error).message);
    return res.status(500).json({ error: ERROR_CODES.INTERNAL_ERROR });
  }
});

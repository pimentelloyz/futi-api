import path from 'node:path';

import { Router } from 'express';
import multer from 'multer';

import { makeAddTeamController } from '../../main/factories/make-add-team-controller.js';
import { makeListTeamsController } from '../../main/factories/make-list-teams-controller.js';
import { jwtAuth } from '../middlewares/jwt-auth.js';
import { requireRole } from '../middlewares/rbac.middleware.js';
import { AccessRole } from '../../domain/constants/access-roles.js';
import { ERROR_CODES } from '../../domain/constants.js';
import { TeamIconUploadController } from '../controllers/team-icon-upload-controller.js';
import { TeamUpdateController } from '../controllers/team-update-controller.js';
import { makeTeamPlayersController } from '../../main/factories/make-team-players-controller.js';
import { TeamAddPlayerController } from '../controllers/team-add-player-controller.js';
import { TeamSoftDeleteController } from '../controllers/team-soft-delete-controller.js';

export const teamsRouter = Router();

// Proteger todas as rotas de teams com JWT interno
teamsRouter.use(jwtAuth);

// Multer para uploads em memória (até 2MB por arquivo)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 },
});

// Criar time - PLAYER, FAN, MANAGER e ADMIN podem criar times
teamsRouter.post(
  '/',
  requireRole([AccessRole.PLAYER, AccessRole.FAN, AccessRole.MANAGER, AccessRole.ADMIN]),
  async (req, res) => {
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
  },
);

// Listar todos os times
teamsRouter.get('/', async (req, res) => {
  const controller = makeListTeamsController();
  const response = await controller.handle({ query: req.query as Record<string, unknown> });
  return res.status(response.statusCode).json(response.body);
});

// Upload de ícone do time via controller - MANAGER e ADMIN
teamsRouter.post(
  '/:id/icon',
  requireRole([AccessRole.MANAGER, AccessRole.ADMIN]),
  upload.single('file'),
  async (req, res) => {
    const teamId = req.params.id;
    const controller = new TeamIconUploadController();
    const response = await controller.handle({ teamId, file: req.file });
    return res.status(response.statusCode).json(response.body);
  },
);

// Editar um time - MANAGER e ADMIN
teamsRouter.patch('/:id', requireRole([AccessRole.MANAGER, AccessRole.ADMIN]), async (req, res) => {
  const controller = new TeamUpdateController();
  const userId = (req.user as { id: string })?.id;
  const response = await controller.handle({
    teamId: req.params.id,
    data: req.body || {},
    userId,
  });
  return res.status(response.statusCode).json(response.body);
});

// Listar jogadores de um time (join explícito) - PLAYER, MANAGER, ASSISTANT, ADMIN
teamsRouter.get(
  '/:id/players',
  requireRole([AccessRole.PLAYER, AccessRole.MANAGER, AccessRole.ASSISTANT, AccessRole.ADMIN]),
  async (req, res) => {
    const controller = makeTeamPlayersController();
    const response = await controller.handle({
      teamId: req.params.id,
      page: Math.max(parseInt(String(req.query.page ?? '1'), 10) || 1, 1),
      limit: Math.min(Math.max(parseInt(String(req.query.limit ?? '20'), 10) || 20, 1), 100),
      sort: String(req.query.sort ?? 'name') as 'name' | 'number' | 'positionSlug' | 'isActive',
      order: String(req.query.order ?? 'asc') === 'desc' ? 'desc' : 'asc',
      includeTeam: String(req.query.includeTeam ?? 'false') === 'true',
    });
    return res.status(response.statusCode).json(response.body);
  },
);

// Vincular jogador a um time - MANAGER e ADMIN
teamsRouter.post(
  '/:id/players',
  requireRole([AccessRole.MANAGER, AccessRole.ADMIN]),
  async (req, res) => {
    const controller = new TeamAddPlayerController();
    const response = await controller.handle({
      teamId: req.params.id,
      playerId: req.body?.playerId,
    });
    if (response.statusCode === 204) return res.status(204).send();
    return res.status(response.statusCode).json(response.body);
  },
);

// Soft delete de um time - ADMIN apenas
teamsRouter.delete('/:id', requireRole([AccessRole.ADMIN]), async (req, res) => {
  const controller = new TeamSoftDeleteController();
  const response = await controller.handle({ teamId: req.params.id });
  if (response.statusCode === 204) return res.status(204).send();
  return res.status(response.statusCode).json(response.body);
});

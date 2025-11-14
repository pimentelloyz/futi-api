import path from 'node:path';

import { Router } from 'express';
import multer from 'multer';

import { ERROR_CODES } from '../../domain/constants.js';
import { jwtAuth } from '../middlewares/jwt-auth.js';
import {
  createLeague,
  listLeagues,
  listMyLeagues,
  getMyLeagueDetails,
  getLeague,
  updateLeague,
  deleteLeague,
  addTeamToLeague,
  createGroup,
  addTeamToGroup,
  generateFixturesForGroup,
} from '../controllers/league-controller.js';
import {
  LeagueBannerUploadController,
  LeagueIconUploadController,
} from '../controllers/league-icon-upload-controller.js';

export const leaguesRouter = Router();

leaguesRouter.use(jwtAuth);

// Multer para uploads em memória (até 2MB por arquivo)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 },
});

leaguesRouter.post('/', async (req, res) => {
  const isMultipart = req.is('multipart/form-data');
  try {
    let iconUrlFromUpload: string | undefined;
    let bannerUrlFromUpload: string | undefined;
    if (isMultipart) {
      await new Promise<void>((resolve, reject) => {
        const handler = upload.fields([
          { name: 'icon', maxCount: 1 },
          { name: 'banner', maxCount: 1 },
        ]);
        handler(req, res, (err: unknown) => (err ? reject(err) : resolve()));
      });
      const files = req.files as Record<string, Express.Multer.File[]> | undefined;
      const iconFile = files?.icon?.[0];
      const bannerFile = files?.banner?.[0];
      const allowed = new Set(['image/png', 'image/jpeg', 'image/webp']);
      const { getDefaultBucket } = await import('../../infra/firebase/admin.js');
      const bucket = getDefaultBucket();
      const stamp = Date.now();
      const safeSlug = String(
        (req.body?.slug ?? req.body?.name ?? 'league')
          .toString()
          .toLowerCase()
          .replace(/[^a-z0-9-_]/g, '') || 'league',
      );
      if (iconFile) {
        if (!allowed.has(iconFile.mimetype))
          return res.status(415).json({ error: ERROR_CODES.UNSUPPORTED_MEDIA_TYPE });
        const ext =
          iconFile.mimetype === 'image/png'
            ? 'png'
            : iconFile.mimetype === 'image/webp'
              ? 'webp'
              : 'jpg';
        const objectPath = path.posix.join('leagues', 'new', `${safeSlug}_${stamp}-icon.${ext}`);
        const gcsFile = bucket.file(objectPath);
        await gcsFile.save(iconFile.buffer, {
          contentType: iconFile.mimetype,
          resumable: false,
          metadata: { cacheControl: 'public,max-age=3600' },
        });
        try {
          await gcsFile.makePublic();
        } catch {}
        iconUrlFromUpload = `https://storage.googleapis.com/${bucket.name}/${objectPath}`;
      }
      if (bannerFile) {
        if (!allowed.has(bannerFile.mimetype))
          return res.status(415).json({ error: ERROR_CODES.UNSUPPORTED_MEDIA_TYPE });
        const ext =
          bannerFile.mimetype === 'image/png'
            ? 'png'
            : bannerFile.mimetype === 'image/webp'
              ? 'webp'
              : 'jpg';
        const objectPath = path.posix.join('leagues', 'new', `${safeSlug}_${stamp}-banner.${ext}`);
        const gcsFile = bucket.file(objectPath);
        await gcsFile.save(bannerFile.buffer, {
          contentType: bannerFile.mimetype,
          resumable: false,
          metadata: { cacheControl: 'public,max-age=3600' },
        });
        try {
          await gcsFile.makePublic();
        } catch {}
        bannerUrlFromUpload = `https://storage.googleapis.com/${bucket.name}/${objectPath}`;
      }
      // Anexar URLs no body para o controller persistir (sem usar any)
      const body = req.body as Record<string, unknown>;
      if (iconUrlFromUpload) body.icon = iconUrlFromUpload;
      if (bannerUrlFromUpload) body.banner = bannerUrlFromUpload;
    }
    return createLeague(req, res);
  } catch (e) {
    console.error('[league_create_error]', (e as Error).message);
    if ((e as Error).message?.toLowerCase().includes('multipart'))
      return res.status(400).json({ error: ERROR_CODES.INVALID_MULTIPART });
    return res.status(500).json({ error: ERROR_CODES.INTERNAL_ERROR });
  }
});

leaguesRouter.get('/', async (req, res) => {
  return listLeagues(req, res);
});

leaguesRouter.get('/me', async (req, res) => {
  return listMyLeagues(req, res);
});

leaguesRouter.get('/me/:id', async (req, res) => {
  return getMyLeagueDetails(req, res);
});

leaguesRouter.get('/:id', async (req, res) => {
  return getLeague(req, res);
});

leaguesRouter.patch('/:id', async (req, res) => {
  return updateLeague(req, res);
});

leaguesRouter.delete('/:id', async (req, res) => {
  return deleteLeague(req, res);
});

leaguesRouter.post('/:id/teams', async (req, res) => {
  return addTeamToLeague(req, res);
});

// Uploads de imagens da liga (ícone e banner)
leaguesRouter.post('/:id/icon', upload.single('file'), async (req, res) => {
  const leagueId = req.params.id;
  const controller = new LeagueIconUploadController();
  const response = await controller.handle({ leagueId, file: req.file });
  return res.status(response.statusCode).json(response.body);
});

leaguesRouter.post('/:id/banner', upload.single('file'), async (req, res) => {
  const leagueId = req.params.id;
  const controller = new LeagueBannerUploadController();
  const response = await controller.handle({ leagueId, file: req.file });
  return res.status(response.statusCode).json(response.body);
});

leaguesRouter.post('/:id/groups', async (req, res) => {
  return createGroup(req, res);
});

leaguesRouter.post('/:id/groups/:groupId/teams', async (req, res) => {
  return addTeamToGroup(req, res);
});

leaguesRouter.post('/:id/groups/:groupId/fixtures', async (req, res) => {
  return generateFixturesForGroup(req, res);
});

import path from 'node:path';

import { prisma } from '../../infra/prisma/client.js';
import { ERROR_CODES } from '../../domain/constants.js';

interface LeagueImageUploadParams {
  leagueId: string;
  file?: { buffer: Buffer; mimetype: string } | null;
}

export class LeagueIconUploadController {
  async handle(params: LeagueImageUploadParams): Promise<{ statusCode: number; body: unknown }> {
    const { leagueId, file } = params;
    if (!leagueId) return { statusCode: 400, body: { error: 'invalid_league_id' } };
    try {
      const league = await prisma.league.findUnique({
        where: { id: leagueId },
        select: { id: true, isActive: true },
      });
      if (!league || league.isActive === false)
        return { statusCode: 404, body: { error: 'league_not_found' } };
      if (!file) return { statusCode: 400, body: { error: 'file_required' } };
      const allowed = new Set(['image/png', 'image/jpeg', 'image/webp']);
      if (!allowed.has(file.mimetype))
        return { statusCode: 415, body: { error: ERROR_CODES.UNSUPPORTED_MEDIA_TYPE } };
      const ext =
        file.mimetype === 'image/png' ? 'png' : file.mimetype === 'image/webp' ? 'webp' : 'jpg';
      const folderPrefix = path.posix.join('leagues', leagueId, '/');
      const objectPath = path.posix.join('leagues', leagueId, `${leagueId}-icon.${ext}`);
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
      await prisma.league.update({ where: { id: leagueId }, data: { icon: publicUrl } });
      return { statusCode: 200, body: { iconUrl: publicUrl } };
    } catch (e) {
      console.error('[league_icon_upload_ctrl_error]', (e as Error).message);
      return { statusCode: 500, body: { error: ERROR_CODES.INTERNAL_ERROR } };
    }
  }
}

export class LeagueBannerUploadController {
  async handle(params: LeagueImageUploadParams): Promise<{ statusCode: number; body: unknown }> {
    const { leagueId, file } = params;
    if (!leagueId) return { statusCode: 400, body: { error: 'invalid_league_id' } };
    try {
      const league = await prisma.league.findUnique({
        where: { id: leagueId },
        select: { id: true, isActive: true },
      });
      if (!league || league.isActive === false)
        return { statusCode: 404, body: { error: 'league_not_found' } };
      if (!file) return { statusCode: 400, body: { error: 'file_required' } };
      const allowed = new Set(['image/png', 'image/jpeg', 'image/webp']);
      if (!allowed.has(file.mimetype))
        return { statusCode: 415, body: { error: ERROR_CODES.UNSUPPORTED_MEDIA_TYPE } };
      const ext =
        file.mimetype === 'image/png' ? 'png' : file.mimetype === 'image/webp' ? 'webp' : 'jpg';
      const folderPrefix = path.posix.join('leagues', leagueId, '/');
      const objectPath = path.posix.join('leagues', leagueId, `${leagueId}-banner.${ext}`);
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
      await prisma.league.update({ where: { id: leagueId }, data: { banner: publicUrl } });
      return { statusCode: 200, body: { bannerUrl: publicUrl } };
    } catch (e) {
      console.error('[league_banner_upload_ctrl_error]', (e as Error).message);
      return { statusCode: 500, body: { error: ERROR_CODES.INTERNAL_ERROR } };
    }
  }
}

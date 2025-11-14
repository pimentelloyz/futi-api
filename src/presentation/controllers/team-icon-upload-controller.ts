import path from 'node:path';

import { prisma } from '../../infra/prisma/client.js';
import { ERROR_CODES } from '../../domain/constants.js';

interface TeamIconUploadParams {
  teamId: string;
  file?: { buffer: Buffer; mimetype: string } | null;
}

export class TeamIconUploadController {
  async handle(params: TeamIconUploadParams): Promise<{ statusCode: number; body: unknown }> {
    const { teamId, file } = params;
    if (!teamId) return { statusCode: 400, body: { error: ERROR_CODES.INVALID_TEAM_ID } };
    try {
      const team = await prisma.team.findUnique({
        where: { id: teamId },
        select: { id: true, isActive: true },
      });
      if (!team || team.isActive === false)
        return { statusCode: 404, body: { error: ERROR_CODES.TEAM_NOT_FOUND } };
      if (!file) return { statusCode: 400, body: { error: 'file_required' } };
      const allowed = new Set(['image/png', 'image/jpeg', 'image/webp']);
      if (!allowed.has(file.mimetype))
        return { statusCode: 415, body: { error: ERROR_CODES.UNSUPPORTED_MEDIA_TYPE } };
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
      return { statusCode: 200, body: { iconUrl: publicUrl } };
    } catch (e) {
      console.error('[team_icon_upload_ctrl_error]', (e as Error).message);
      return { statusCode: 500, body: { error: ERROR_CODES.INTERNAL_ERROR } };
    }
  }
}

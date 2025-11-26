import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { FirebasePlayerPhotoService } from '../../infra/storage/firebase-player-photo-service.js';
import { ERROR_CODES } from '../../domain/constants.js';

const photoService = new FirebasePlayerPhotoService();

/**
 * Middleware para processar upload opcional de foto de player via multipart/form-data
 * Se houver arquivo, faz upload para Firebase e adiciona URL ao req.body.photo
 */
export async function processOptionalPlayerPhoto(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const isMultipart = req.is('multipart/form-data');

  if (!isMultipart) {
    return next();
  }

  try {
    const file = req.file;
    if (!file) {
      return next();
    }

    const validation = photoService.validateFile({
      buffer: file.buffer,
      mimetype: file.mimetype,
    });

    if (!validation.valid) {
      res.status(415).json({ error: ERROR_CODES.UNSUPPORTED_MEDIA_TYPE });
      return;
    }

    const uploadResult = await photoService.uploadPlayerPhoto({
      file: { buffer: file.buffer, mimetype: file.mimetype },
      playerName: req.body?.name,
    });

    // Normalizar body de multipart para formato esperado pelo controller
    req.body = {
      name: req.body?.name,
      positionSlug: req.body?.positionSlug ?? undefined,
      number:
        typeof req.body?.number === 'string' ? Number.parseInt(req.body.number, 10) : undefined,
      isActive:
        typeof req.body?.isActive === 'string' ? req.body.isActive === 'true' : undefined,
      teamId:
        typeof req.body?.teamId === 'string' && req.body.teamId
          ? String(req.body.teamId).trim()
          : undefined,
      teamIds: Array.isArray(req.body?.teamIds)
        ? req.body.teamIds
        : typeof req.body?.teamIds === 'string' && req.body.teamIds
          ? String(req.body.teamIds)
              .split(',')
              .map((s: string) => s.trim())
              .filter(Boolean)
          : undefined,
      photo: uploadResult.url,
    };

    next();
  } catch (err) {
    const msg = (err as Error).message || '';
    console.error('[player_photo_upload_error]', msg);

    if (msg.includes('Environment validation failed') || msg.includes('firebase')) {
      res.status(500).json({ error: ERROR_CODES.FIREBASE_CONFIG_ERROR });
      return;
    }

    res.status(500).json({ error: ERROR_CODES.INTERNAL_ERROR });
  }
}

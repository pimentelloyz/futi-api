import type { Request, Response } from 'express';
import { z } from 'zod';

import { DbEnsurePlayerForUser } from '../../data/usecases/db-ensure-player-for-user.js';
import { PrismaPlayerRepository } from '../../infra/repositories/prisma-player-repository.js';
import { FirebasePlayerPhotoService } from '../../infra/storage/firebase-player-photo-service.js';
import { ERROR_CODES } from '../../domain/constants.js';

const schema = z.object({
  name: z.string().min(1),
  positionSlug: z.string().max(20).optional().nullable(),
  number: z
    .union([z.string().transform((v) => Number.parseInt(v, 10)), z.number()])
    .pipe(z.number().int().min(0).max(999))
    .optional(),
  teamId: z.string().min(1).optional(),
  teamIds: z
    .union([
      z.array(z.string().min(1)),
      z
        .string()
        .min(1)
        .transform((v) => v.split(',').map((s) => s.trim()).filter(Boolean)),
    ])
    .optional(),
  photo: z.string().url().optional().nullable(),
});

export class CreateMyPlayerUploadController {
  constructor(
    private readonly repo: PrismaPlayerRepository = new PrismaPlayerRepository(),
    private readonly photoService: FirebasePlayerPhotoService = new FirebasePlayerPhotoService(),
  ) {}

  handleExpress = async (req: Request, res: Response): Promise<void> => {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: ERROR_CODES.UNAUTHORIZED });
      return;
    }

    try {
      // Extrair corpo bruto (multipart já parseado por multer se existir)
      const rawBody: Record<string, unknown> = typeof req.body === 'object' && req.body !== null ? req.body : {};

      // Montar objeto preliminar para schema
      const candidate = {
        name: rawBody.name,
        positionSlug: rawBody.positionSlug ?? undefined,
        number: rawBody.number,
        teamId: rawBody.teamId,
        teamIds: rawBody.teamIds,
        photo: rawBody.photo,
      } as Record<string, unknown>;

      const parsed = schema.safeParse(candidate);
      if (!parsed.success) {
        return res.status(400).json({ error: ERROR_CODES.INVALID_BODY, details: parsed.error.flatten() });
      }

      const data = parsed.data as typeof parsed.data & { teamIds?: string[] };
      const teamIdsFinal = data.teamIds ?? (data.teamId ? [data.teamId] : undefined);

      let photoUrl: string | undefined = data.photo ?? undefined;

      // Upload de arquivo se presente (não obrigatório)
      if (req.file) {
        const validation = this.photoService.validateFile({ buffer: req.file.buffer, mimetype: req.file.mimetype });
        if (!validation.valid) {
          res.status(415).json({ error: ERROR_CODES.UNSUPPORTED_MEDIA_TYPE });
          return;
        }
        try {
          const uploadResult = await this.photoService.uploadPlayerPhoto({
            file: { buffer: req.file.buffer, mimetype: req.file.mimetype },
            playerName: String(data.name),
          });
          photoUrl = uploadResult.url;
        } catch (err: any) {
          const msg = String(err?.message || '');
            if (msg.includes('Environment validation failed') || msg.toLowerCase().includes('firebase')) {
              res.status(500).json({ error: ERROR_CODES.FIREBASE_CONFIG_ERROR });
              return;
            }
            if (msg.includes('unsupported_media_type')) {
              res.status(415).json({ error: ERROR_CODES.UNSUPPORTED_MEDIA_TYPE });
              return;
            }
            res.status(500).json({ error: ERROR_CODES.INTERNAL_ERROR });
            return;
        }
      }

      const usecase = new DbEnsurePlayerForUser(this.repo);
      const result = await usecase.ensure({
        userId,
        name: data.name,
        positionSlug: data.positionSlug ?? undefined,
        number: data.number ?? undefined,
        teamIds: teamIdsFinal,
        photo: photoUrl,
      });

      res.status(201).json(result);
    } catch (e: any) {
      const msg = String(e?.message || '');
      if (msg.includes('P2025')) {
        res.status(400).json({ error: 'team_not_found' });
        return;
      }
      if (msg.includes('P2003') && msg.includes('positionSlug')) {
        res.status(400).json({ error: 'position_not_found' });
        return;
      }
      if (msg.toLowerCase().includes('multipart')) {
        res.status(400).json({ error: ERROR_CODES.INVALID_MULTIPART });
        return;
      }
      res.status(500).json({ error: ERROR_CODES.INTERNAL_ERROR });
    }
  };
}

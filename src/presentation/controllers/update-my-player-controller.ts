import { Request, Response } from 'express';
import { z } from 'zod';
import {
  UpdateMyPlayerUseCase,
  PlayerNotFoundError,
  InvalidPositionError,
} from '../../domain/usecases/update-my-player/update-my-player.usecase.js';
import { ERROR_CODES } from '../../domain/constants.js';

// Schema de validação
const updateMeSchema = z
  .object({
    name: z.string().min(1).max(100).optional(),
    positionSlug: z.string().min(1).max(20).nullable().optional(),
    number: z.number().int().min(0).max(99).nullable().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'at least one field must be provided',
    path: [],
  });

export class UpdateMyPlayerController {
  constructor(private readonly useCase: UpdateMyPlayerUseCase) {}

  handleExpress = async (req: Request, res: Response): Promise<Response> => {
    try {
      // Extrair e normalizar dados do body
      const raw = req.body as {
        name?: unknown;
        positionSlug?: unknown;
        number?: unknown;
        numero?: unknown;
      };

      const incoming = {
        name: typeof raw?.name === 'string' ? raw.name : undefined,
        positionSlug:
          raw?.positionSlug === null
            ? null
            : typeof raw?.positionSlug === 'string'
              ? raw.positionSlug
              : undefined,
        number:
          raw?.number === null || raw?.numero === null
            ? null
            : typeof raw?.number === 'number'
              ? raw.number
              : typeof raw?.numero === 'number'
                ? raw.numero
                : typeof raw?.number === 'string' && raw.number.trim() !== ''
                  ? Number.parseInt(raw.number, 10)
                  : typeof raw?.numero === 'string' && raw.numero.trim() !== ''
                    ? Number.parseInt(raw.numero, 10)
                    : undefined,
      } as { name?: string; positionSlug?: string | null; number?: number | null };

      // Validar com Zod
      const parsed = updateMeSchema.safeParse(incoming);
      if (!parsed.success) {
        return res.status(400).json({ error: ERROR_CODES.INVALID_REQUEST });
      }

      // Verificar autenticação
      const meUser = req.user as { id: string } | undefined;
      if (!meUser) {
        return res.status(401).json({ error: ERROR_CODES.UNAUTHORIZED });
      }

      // Executar use case
      const result = await this.useCase.execute({
        userId: meUser.id,
        name: parsed.data.name,
        positionSlug: parsed.data.positionSlug,
        number: parsed.data.number,
      });

      return res.status(200).json(result);
    } catch (error) {
      if (error instanceof PlayerNotFoundError) {
        return res.status(404).json({ error: ERROR_CODES.PLAYER_NOT_FOUND });
      }

      if (error instanceof InvalidPositionError) {
        return res
          .status(400)
          .json({ error: ERROR_CODES.INVALID_REQUEST, message: 'invalid positionSlug' });
      }

      console.error('[UpdateMyPlayerController]', (error as Error).message);
      return res.status(500).json({ error: ERROR_CODES.INTERNAL_ERROR });
    }
  };
}

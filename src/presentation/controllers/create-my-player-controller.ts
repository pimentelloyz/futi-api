import { z } from 'zod';

import { Controller, HttpRequest, HttpResponse } from '../protocols/http.js';
import { BadRequestError, UnauthorizedError } from '../errors/http-errors.js';
import { PrismaPlayerRepository } from '../../infra/repositories/prisma-player-repository.js';
import { DbEnsurePlayerForUser } from '../../data/usecases/db-ensure-player-for-user.js';
import { ERROR_CODES } from '../../domain/constants.js';

const schema = z.object({
  name: z.string().min(1),
  positionSlug: z.string().max(20).optional().nullable(),
  number: z.number().int().min(0).max(999).optional(),
  // Preferir teamId único; manter teamIds para compat (deprecated)
  teamId: z.string().min(1).optional(),
  teamIds: z.array(z.string().min(1)).optional(),
  photo: z.string().url().optional().nullable(),
});

export class CreateMyPlayerController implements Controller {
  async handle(request: HttpRequest): Promise<HttpResponse> {
    const userId = (request as HttpRequest & { user?: { id: string } }).user?.id;
    if (!userId) throw new UnauthorizedError();
    const parsed = schema.safeParse(request.body);
    if (!parsed.success) {
      const flat = parsed.error.flatten();
      throw new BadRequestError(ERROR_CODES.INVALID_BODY, 'invalid request body', {
        formErrors: flat.formErrors,
        fieldErrors: flat.fieldErrors,
      });
    }
    try {
      const repo = new PrismaPlayerRepository();
      const usecase = new DbEnsurePlayerForUser(repo);
      const data = parsed.data as typeof parsed.data & { teamIds?: string[] };
      const teamIdsFinal = data.teamIds ?? (data.teamId ? [data.teamId] : undefined);
      const result = await usecase.ensure({
        userId,
        name: data.name,
        positionSlug: data.positionSlug ?? undefined,
        number: data.number ?? undefined,
        teamIds: teamIdsFinal,
        photo: data.photo ?? undefined,
      });
      return { statusCode: 201, body: result };
    } catch (err) {
      // Prisma error mapping to avoid leaking as 500 for common user mistakes
      type PrismaLikeError = { code?: string; message?: string };
      const pErr = (err ?? {}) as PrismaLikeError;
      const code = pErr.code;
      const message = pErr.message ?? '';
      // P2025: Record to connect not found (e.g., teamIds inválidos)
      if (code === 'P2025') {
        return { statusCode: 400, body: { error: 'team_not_found' } };
      }
      // P2003: Foreign key constraint failed (e.g., positionSlug inexistente)
      if (code === 'P2003' && message.includes('positionSlug')) {
        return { statusCode: 400, body: { error: 'position_not_found' } };
      }
      if (err instanceof BadRequestError || err instanceof UnauthorizedError) {
        return { statusCode: err.statusCode, body: { error: err.code, details: err.details } };
      }
      return { statusCode: 500, body: { error: ERROR_CODES.INTERNAL_ERROR } };
    }
  }
}

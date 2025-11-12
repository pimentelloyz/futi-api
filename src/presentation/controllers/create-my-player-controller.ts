import { z } from 'zod';

import { Controller, HttpRequest, HttpResponse } from '../protocols/http.js';
import { BadRequestError, UnauthorizedError } from '../errors/http-errors.js';
import { PrismaPlayerRepository } from '../../infra/repositories/prisma-player-repository.js';
import { DbEnsurePlayerForUser } from '../../data/usecases/db-ensure-player-for-user.js';
import { ERROR_CODES } from '../../domain/constants.js';

const schema = z.object({
  name: z.string().min(1),
  position: z.string().max(50).optional().nullable(),
  number: z.number().int().min(0).max(999).optional(),
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
      const result = await usecase.ensure({ userId, ...parsed.data });
      return { statusCode: 201, body: result };
    } catch (err) {
      if (err instanceof BadRequestError || err instanceof UnauthorizedError) {
        return { statusCode: err.statusCode, body: { error: err.code, details: err.details } };
      }
      return { statusCode: 500, body: { error: ERROR_CODES.INTERNAL_ERROR } };
    }
  }
}

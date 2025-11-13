import { z } from 'zod';

import { AddPlayer, AddPlayerInput } from '../../domain/usecases/add-player.js';
import { Controller, HttpRequest, HttpResponse } from '../protocols/http.js';
import { BadRequestError } from '../errors/http-errors.js';
import { ERROR_CODES } from '../../domain/constants.js';

const schema = z.object({
  name: z.string().min(1),
  positionSlug: z.string().max(20).optional().nullable(),
  number: z.number().int().positive().max(999).optional(),
  isActive: z.boolean().optional(),
  // Preferir teamId único; manter teamIds para compat (deprecated)
  teamId: z.string().min(1).optional(),
  teamIds: z.array(z.string().min(1)).optional(),
  photo: z.string().url().optional().nullable(),
});

export class AddPlayerController implements Controller {
  constructor(private readonly addPlayer: AddPlayer) {}

  async handle(request: HttpRequest): Promise<HttpResponse> {
    try {
      const parsed = schema.safeParse(request.body);
      if (!parsed.success) {
        const flat = parsed.error.flatten();
        throw new BadRequestError(ERROR_CODES.INVALID_BODY, 'invalid request body', {
          formErrors: flat.formErrors,
          fieldErrors: flat.fieldErrors,
        });
      }
      const data = parsed.data as typeof parsed.data & { teamIds?: string[] };
      const teamIdsFinal = data.teamIds ?? (data.teamId ? [data.teamId] : undefined);
      const payload: AddPlayerInput = {
        name: data.name,
        positionSlug: data.positionSlug ?? undefined,
        number: data.number ?? undefined,
        isActive: data.isActive ?? undefined,
        photo: data.photo ?? undefined,
        teamIds: teamIdsFinal,
      };
      const result = await this.addPlayer.add(payload);
      return { statusCode: 201, body: result };
    } catch (err) {
      // Prisma error mapping to return 400 for common invalid references
      type PrismaLikeError = { code?: string; message?: string };
      const pErr = (err ?? {}) as PrismaLikeError;
      const code = pErr.code;
      const message = pErr.message ?? '';
      if (code === 'P2025') {
        return { statusCode: 400, body: { error: 'team_not_found' } };
      }
      if (code === 'P2003' && message.includes('positionSlug')) {
        return { statusCode: 400, body: { error: 'position_not_found' } };
      }
      if (err instanceof BadRequestError) {
        return { statusCode: err.statusCode, body: { error: err.code, details: err.details } };
      }
      return { statusCode: 500, body: { error: ERROR_CODES.INTERNAL_ERROR } };
    }
  }
}

import { z } from 'zod';

import { AddPlayer } from '../../domain/usecases/add-player.js';
import { Controller, HttpRequest, HttpResponse } from '../protocols/http.js';
import { BadRequestError } from '../errors/http-errors.js';
import { ERROR_CODES } from '../../domain/constants.js';

const schema = z.object({
  name: z.string().min(1),
  positionSlug: z.string().max(20).optional().nullable(),
  number: z.number().int().positive().max(999).optional(),
  isActive: z.boolean().optional(),
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
      const result = await this.addPlayer.add(parsed.data);
      return { statusCode: 201, body: result };
    } catch (err) {
      if (err instanceof BadRequestError) {
        return { statusCode: err.statusCode, body: { error: err.code, details: err.details } };
      }
      return { statusCode: 500, body: { error: ERROR_CODES.INTERNAL_ERROR } };
    }
  }
}

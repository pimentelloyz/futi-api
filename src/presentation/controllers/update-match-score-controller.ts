import { z } from 'zod';

import { UpdateMatchScore } from '../../domain/usecases/update-match-score.js';
import { Controller, HttpRequest, HttpResponse } from '../protocols/http.js';
import { BadRequestError } from '../errors/http-errors.js';
import { ERROR_CODES } from '../../domain/constants.js';

const bodySchema = z.object({
  homeScore: z.number().int().min(0),
  awayScore: z.number().int().min(0),
});

export class UpdateMatchScoreController implements Controller {
  constructor(private readonly update: UpdateMatchScore) {}

  async handle(request: HttpRequest): Promise<HttpResponse> {
    try {
      const id = request.params?.id;
      if (!id) throw new BadRequestError('missing_id');
      const parsed = bodySchema.safeParse(request.body);
      if (!parsed.success) {
        const flat = parsed.error.flatten();
        throw new BadRequestError(ERROR_CODES.INVALID_BODY, 'invalid request body', {
          formErrors: flat.formErrors,
          fieldErrors: flat.fieldErrors,
        });
      }
      const result = await this.update.updateScore({ id, ...parsed.data });
      return { statusCode: 200, body: result };
    } catch (err) {
      if (err instanceof BadRequestError)
        return { statusCode: err.statusCode, body: { error: err.code, details: err.details } };
      return { statusCode: 500, body: { error: ERROR_CODES.INTERNAL_ERROR } };
    }
  }
}

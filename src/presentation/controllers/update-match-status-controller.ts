import { z } from 'zod';

import { UpdateMatchStatus } from '../../domain/usecases/update-match-status.js';
import { Controller, HttpRequest, HttpResponse } from '../protocols/http.js';
import { BadRequestError, NotFoundError } from '../errors/http-errors.js';

const bodySchema = z.object({
  status: z.enum(['SCHEDULED', 'IN_PROGRESS', 'FINISHED', 'CANCELED']),
});

export class UpdateMatchStatusController implements Controller {
  constructor(private readonly update: UpdateMatchStatus) {}

  async handle(request: HttpRequest): Promise<HttpResponse> {
    try {
      const id = request.params?.id;
      if (!id) throw new BadRequestError('missing_id');
      const parsed = bodySchema.safeParse(request.body);
      if (!parsed.success) {
        const flat = parsed.error.flatten();
        const details = { formErrors: flat.formErrors, fieldErrors: flat.fieldErrors };
        throw new BadRequestError('invalid_body', 'invalid request body', details);
      }
      const result = await this.update.updateStatus({ id, ...parsed.data });
      return { statusCode: 200, body: result };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'internal_error';
      if (err instanceof BadRequestError || err instanceof NotFoundError) {
        return { statusCode: err.statusCode, body: { error: err.code, details: err.details } };
      }
      if (message === 'not_found') {
        const nf = new NotFoundError('match_not_found');
        return { statusCode: nf.statusCode, body: { error: nf.code } };
      }
      if (message === 'invalid_transition') {
        const bad = new BadRequestError('invalid_transition');
        return { statusCode: bad.statusCode, body: { error: bad.code } };
      }
      return { statusCode: 500, body: { error: 'internal_error' } };
    }
  }
}

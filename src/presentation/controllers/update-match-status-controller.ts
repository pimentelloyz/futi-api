import { z } from 'zod';

import { UpdateMatchStatus } from '../../domain/usecases/update-match-status.js';
import { Controller, HttpRequest, HttpResponse } from '../protocols/http.js';

const bodySchema = z.object({
  status: z.enum(['SCHEDULED', 'IN_PROGRESS', 'FINISHED', 'CANCELED']),
});

export class UpdateMatchStatusController implements Controller {
  constructor(private readonly update: UpdateMatchStatus) {}

  async handle(request: HttpRequest): Promise<HttpResponse> {
    try {
      const id = request.params?.id;
      if (!id) return { statusCode: 400, body: { error: 'missing_id' } };
      const parsed = bodySchema.safeParse(request.body);
      if (!parsed.success) {
        return { statusCode: 400, body: { error: parsed.error.flatten().formErrors.join('; ') } };
      }
      const result = await this.update.updateStatus({ id, ...parsed.data });
      return { statusCode: 200, body: result };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'internal_error';
      if (message === 'not_found') return { statusCode: 404, body: { error: 'not_found' } };
      if (message === 'invalid_transition')
        return { statusCode: 400, body: { error: 'invalid_transition' } };
      return { statusCode: 500, body: { error: 'internal_error' } };
    }
  }
}

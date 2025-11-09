import { z } from 'zod';

import { UpdateMatchScore } from '../../domain/usecases/update-match-score.js';
import { Controller, HttpRequest, HttpResponse } from '../protocols/http.js';

const bodySchema = z.object({
  homeScore: z.number().int().min(0),
  awayScore: z.number().int().min(0),
});

export class UpdateMatchScoreController implements Controller {
  constructor(private readonly update: UpdateMatchScore) {}

  async handle(request: HttpRequest): Promise<HttpResponse> {
    try {
      const id = request.params?.id;
      if (!id) return { statusCode: 400, body: { error: 'missing_id' } };
      const parsed = bodySchema.safeParse(request.body);
      if (!parsed.success) {
        return { statusCode: 400, body: { error: parsed.error.flatten().formErrors.join('; ') } };
      }
      const result = await this.update.updateScore({ id, ...parsed.data });
      return { statusCode: 200, body: result };
    } catch {
      return { statusCode: 500, body: { error: 'internal_error' } };
    }
  }
}

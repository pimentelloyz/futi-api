import { z } from 'zod';

import { ListMatches } from '../../domain/usecases/list-matches.js';
import { Controller, HttpRequest, HttpResponse } from '../protocols/http.js';

const querySchema = z.object({
  status: z.enum(['SCHEDULED', 'IN_PROGRESS', 'FINISHED', 'CANCELED']).optional(),
  teamId: z.string().min(1).optional(),
  from: z
    .string()
    .datetime()
    .optional()
    .transform((v) => (v ? new Date(v) : undefined)),
  to: z
    .string()
    .datetime()
    .optional()
    .transform((v) => (v ? new Date(v) : undefined)),
});

export class ListMatchesController implements Controller {
  constructor(private readonly listMatches: ListMatches) {}

  async handle(request: HttpRequest): Promise<HttpResponse> {
    try {
      const parsed = querySchema.safeParse(request.query ?? {});
      if (!parsed.success) {
        return { statusCode: 400, body: { error: parsed.error.flatten().formErrors.join('; ') } };
      }
      const result = await this.listMatches.list(parsed.data);
      return { statusCode: 200, body: result };
    } catch {
      return { statusCode: 500, body: { error: 'internal_error' } };
    }
  }
}

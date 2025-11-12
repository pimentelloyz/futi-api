import { z } from 'zod';

import { ListMatches } from '../../domain/usecases/list-matches.js';
import { Controller, HttpRequest, HttpResponse } from '../protocols/http.js';
import { BadRequestError } from '../errors/http-errors.js';

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
  page: z
    .string()
    .regex(/^\d+$/)
    .optional()
    .transform((v) => (v ? parseInt(v, 10) : undefined)),
  limit: z
    .string()
    .regex(/^\d+$/)
    .optional()
    .transform((v) => (v ? parseInt(v, 10) : undefined)),
});

export class ListMatchesController implements Controller {
  constructor(private readonly listMatches: ListMatches) {}

  async handle(request: HttpRequest): Promise<HttpResponse> {
    try {
      const parsed = querySchema.safeParse(request.query ?? {});
      if (!parsed.success) {
        const flat = parsed.error.flatten();
        throw new BadRequestError('invalid_query', 'invalid query params', {
          formErrors: flat.formErrors,
          fieldErrors: flat.fieldErrors,
        });
      }
      const result = await this.listMatches.list(parsed.data);
      return { statusCode: 200, body: result };
    } catch (err) {
      if (err instanceof BadRequestError)
        return { statusCode: err.statusCode, body: { error: err.code, details: err.details } };
      return { statusCode: 500, body: { error: 'internal_error' } };
    }
  }
}

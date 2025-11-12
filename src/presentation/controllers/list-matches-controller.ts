import { z } from 'zod';

import { ListMatches } from '../../domain/usecases/list-matches.js';
import { Controller, HttpRequest, HttpResponse } from '../protocols/http.js';
import { BadRequestError } from '../errors/http-errors.js';
import { ERROR_CODES, MATCH_STATUS } from '../../domain/constants.js';

const querySchema = z.object({
  status: z
    .enum([
      MATCH_STATUS.SCHEDULED,
      MATCH_STATUS.IN_PROGRESS,
      MATCH_STATUS.FINISHED,
      MATCH_STATUS.CANCELED,
    ])
    .optional(),
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
        throw new BadRequestError(ERROR_CODES.INVALID_QUERY, 'invalid query params', {
          formErrors: flat.formErrors,
          fieldErrors: flat.fieldErrors,
        });
      }
      const result = await this.listMatches.list(parsed.data);
      return { statusCode: 200, body: result };
    } catch (err) {
      if (err instanceof BadRequestError)
        return { statusCode: err.statusCode, body: { error: err.code, details: err.details } };
      return { statusCode: 500, body: { error: ERROR_CODES.INTERNAL_ERROR } };
    }
  }
}

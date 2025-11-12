import { z } from 'zod';

import { ListTeams } from '../../domain/usecases/list-teams.js';
import { Controller, HttpRequest, HttpResponse } from '../protocols/http.js';
import { BadRequestError } from '../errors/http-errors.js';
import { ERROR_CODES } from '../../domain/constants.js';

const querySchema = z.object({
  isActive: z
    .string()
    .transform((v) => (v === 'true' ? true : v === 'false' ? false : v))
    .optional()
    .refine((v) => v === undefined || typeof v === 'boolean', 'invalid boolean')
    .transform((v) => (typeof v === 'boolean' ? v : undefined)),
});

export class ListTeamsController implements Controller {
  constructor(private readonly listTeams: ListTeams) {}

  async handle(request: HttpRequest): Promise<HttpResponse> {
    try {
      let isActive: boolean | undefined;
      if (request.query && typeof request.query === 'object') {
        const parsed = querySchema.safeParse(request.query as Record<string, unknown>);
        if (!parsed.success) {
          const flat = parsed.error.flatten();
          throw new BadRequestError(ERROR_CODES.INVALID_QUERY, 'invalid query params', {
            formErrors: flat.formErrors,
            fieldErrors: flat.fieldErrors,
          });
        }
        isActive = parsed.data.isActive;
      }
      const items = await this.listTeams.list({ isActive });
      return { statusCode: 200, body: { items } };
    } catch (err) {
      if (err instanceof BadRequestError) {
        return { statusCode: err.statusCode, body: { error: err.code, details: err.details } };
      }
      return { statusCode: 500, body: { error: ERROR_CODES.INTERNAL_ERROR } };
    }
  }
}

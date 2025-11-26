import { z } from 'zod';

import { AddMatch } from '../../domain/usecases/add-match.js';
import { Controller, HttpRequest, HttpResponse } from '../protocols/http.js';
import { BadRequestError } from '../errors/http-errors.js';
import { ERROR_CODES, MATCH_STATUS } from '../../domain/constants.js';

const schema = z
  .object({
    homeTeamId: z.string().min(1),
    awayTeamId: z.string().min(1),
    scheduledAt: z
      .union([z.string().datetime(), z.date()])
      .transform((v) => (v instanceof Date ? v : new Date(v)))
      .default(() => new Date()),
    status: z
      .enum([
        MATCH_STATUS.SCHEDULED,
        MATCH_STATUS.IN_PROGRESS,
        MATCH_STATUS.FINISHED,
        MATCH_STATUS.CANCELED,
      ])
      .optional(),
    homeScore: z.number().int().min(0).optional(),
    awayScore: z.number().int().min(0).optional(),
  })
  .refine((data) => data.homeTeamId !== data.awayTeamId, {
    message: 'awayTeamId must be different from homeTeamId',
    path: ['awayTeamId'],
  });

export class AddMatchController implements Controller {
  constructor(private readonly addMatch: AddMatch) {}

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
      const result = await this.addMatch.add(parsed.data);
      return { statusCode: 201, body: result };
    } catch (err) {
      if (err instanceof BadRequestError) {
        return { statusCode: err.statusCode, body: { error: err.code, details: err.details } };
      }
      return { statusCode: 500, body: { error: ERROR_CODES.INTERNAL_ERROR } };
    }
  }
}

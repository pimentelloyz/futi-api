import { z } from 'zod';

import { AddMatch } from '../../domain/usecases/add-match.js';
import { Controller, HttpRequest, HttpResponse } from '../protocols/http.js';

const schema = z
  .object({
    homeTeamId: z.string().min(1),
    awayTeamId: z.string().min(1),
    scheduledAt: z
      .union([z.string().datetime(), z.date()])
      .transform((v) => (v instanceof Date ? v : new Date(v))),
    status: z.enum(['SCHEDULED', 'IN_PROGRESS', 'FINISHED', 'CANCELED']).optional(),
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
        return { statusCode: 400, body: { error: parsed.error.flatten().formErrors.join('; ') } };
      }
      const result = await this.addMatch.add(parsed.data);
      return { statusCode: 201, body: result };
    } catch {
      return { statusCode: 500, body: { error: 'internal_error' } };
    }
  }
}

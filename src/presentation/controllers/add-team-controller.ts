import { z } from 'zod';

import { AddTeam } from '../../domain/usecases/add-team.js';
import { Controller, HttpRequest, HttpResponse } from '../protocols/http.js';
import { BadRequestError } from '../errors/http-errors.js';

const schema = z.object({
  name: z.string().min(1),
  icon: z.string().url().optional().nullable(),
  description: z.string().max(255).optional().nullable(),
  isActive: z.boolean().optional(),
});

export class AddTeamController implements Controller {
  constructor(private readonly addTeam: AddTeam) {}

  async handle(request: HttpRequest): Promise<HttpResponse> {
    try {
      const parsed = schema.safeParse(request.body);
      if (!parsed.success) {
        const flat = parsed.error.flatten();
        throw new BadRequestError('invalid_body', 'invalid request body', {
          formErrors: flat.formErrors,
          fieldErrors: flat.fieldErrors,
        });
      }
      const result = await this.addTeam.add(parsed.data);
      return { statusCode: 201, body: result };
    } catch (err) {
      if (err instanceof BadRequestError) {
        return { statusCode: err.statusCode, body: { error: err.code, details: err.details } };
      }
      return { statusCode: 500, body: { error: 'internal_error' } };
    }
  }
}

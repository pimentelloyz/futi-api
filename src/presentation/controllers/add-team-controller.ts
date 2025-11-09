import { z } from 'zod';

import { AddTeam } from '../../domain/usecases/add-team.js';
import { Controller, HttpRequest, HttpResponse } from '../protocols/http.js';

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
        return { statusCode: 400, body: { error: parsed.error.flatten().formErrors.join('; ') } };
      }
      const result = await this.addTeam.add(parsed.data);
      return { statusCode: 201, body: result };
    } catch {
      return { statusCode: 500, body: { error: 'internal_error' } };
    }
  }
}

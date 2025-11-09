import { z } from 'zod';

import { AddPlayer } from '../../domain/usecases/add-player.js';
import { Controller, HttpRequest, HttpResponse } from '../protocols/http.js';

const schema = z.object({
  name: z.string().min(1),
  position: z.string().max(50).optional().nullable(),
  number: z.number().int().positive().max(999).optional(),
  isActive: z.boolean().optional(),
  teamIds: z.array(z.string().min(1)).optional(),
});

export class AddPlayerController implements Controller {
  constructor(private readonly addPlayer: AddPlayer) {}

  async handle(request: HttpRequest): Promise<HttpResponse> {
    try {
      const parsed = schema.safeParse(request.body);
      if (!parsed.success) {
        return {
          statusCode: 400,
          body: { error: parsed.error.flatten().formErrors.join('; ') },
        };
      }
      const result = await this.addPlayer.add(parsed.data);
      return { statusCode: 201, body: result };
    } catch {
      return { statusCode: 500, body: { error: 'internal_error' } };
    }
  }
}

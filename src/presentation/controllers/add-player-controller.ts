import { z } from 'zod';

import { AddPlayer } from '../../domain/usecases/add-player.js';
import { Controller, HttpRequest, HttpResponse } from '../protocols/http.js';
import { BadRequestError } from '../errors/http-errors.js';

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
        const flat = parsed.error.flatten();
        throw new BadRequestError('invalid_body', 'invalid request body', {
          formErrors: flat.formErrors,
          fieldErrors: flat.fieldErrors,
        });
      }
      const result = await this.addPlayer.add(parsed.data);
      return { statusCode: 201, body: result };
    } catch (err) {
      if (err instanceof BadRequestError) {
        return { statusCode: err.statusCode, body: { error: err.code, details: err.details } };
      }
      return { statusCode: 500, body: { error: 'internal_error' } };
    }
  }
}

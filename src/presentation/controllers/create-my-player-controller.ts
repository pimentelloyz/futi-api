import { z } from 'zod';

import { Controller, HttpRequest, HttpResponse } from '../protocols/http.js';
import { PrismaPlayerRepository } from '../../infra/repositories/prisma-player-repository.js';
import { DbEnsurePlayerForUser } from '../../data/usecases/db-ensure-player-for-user.js';

const schema = z.object({
  name: z.string().min(1),
  position: z.string().max(50).optional().nullable(),
  number: z.number().int().min(0).max(999).optional(),
  teamIds: z.array(z.string().min(1)).optional(),
});

export class CreateMyPlayerController implements Controller {
  async handle(request: HttpRequest): Promise<HttpResponse> {
    const userId = (request as HttpRequest & { user?: { id: string } }).user?.id;
    if (!userId) return { statusCode: 401, body: { error: 'unauthorized' } };
    const parsed = schema.safeParse(request.body);
    if (!parsed.success) {
      return { statusCode: 400, body: { error: 'invalid_request' } };
    }
    try {
      const repo = new PrismaPlayerRepository();
      const usecase = new DbEnsurePlayerForUser(repo);
      const result = await usecase.ensure({ userId, ...parsed.data });
      return { statusCode: 201, body: result };
    } catch {
      return { statusCode: 500, body: { error: 'internal_error' } };
    }
  }
}

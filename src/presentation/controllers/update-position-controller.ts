import { z } from 'zod';

import { Controller, HttpRequest, HttpResponse } from '../protocols/http.js';
import { PrismaPositionRepository } from '../../infra/repositories/prisma-position-repository.js';
import { UnauthorizedError, NotFoundError } from '../errors/http-errors.js';
import { ERROR_CODES } from '../../domain/constants.js';

const bodySchema = z.object({ name: z.string().optional(), description: z.string().optional() });

export class UpdatePositionController implements Controller {
  async handle(request: HttpRequest): Promise<HttpResponse> {
    const userId = (request as HttpRequest & { user?: { id: string } }).user?.id;
    if (!userId) throw new UnauthorizedError();
    const slug = (request as HttpRequest & { params?: { slug?: string } }).params?.slug;
    if (!slug) return { statusCode: 400, body: { error: ERROR_CODES.INVALID_BODY } };
    const parsed = bodySchema.safeParse((request as HttpRequest & { body?: unknown }).body ?? {});
    if (!parsed.success) return { statusCode: 400, body: { error: ERROR_CODES.INVALID_BODY } };
    try {
      const repo = new PrismaPositionRepository();
      const item = await repo.updateBySlug(slug, parsed.data);
      return { statusCode: 200, body: { item } };
    } catch (e) {
      const msg = (e as Error).message;
      if (msg.includes('Record to update not found'))
        return { statusCode: 404, body: { error: 'position_not_found' } };
      if (e instanceof UnauthorizedError || e instanceof NotFoundError)
        return { statusCode: e.statusCode, body: { error: e.code } };
      return { statusCode: 500, body: { error: ERROR_CODES.INTERNAL_ERROR } };
    }
  }
}

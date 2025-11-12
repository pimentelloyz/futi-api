import { Controller, HttpRequest, HttpResponse } from '../protocols/http.js';
import { PrismaPositionRepository } from '../../infra/repositories/prisma-position-repository.js';
import { UnauthorizedError } from '../errors/http-errors.js';
import { ERROR_CODES } from '../../domain/constants.js';

export class DeletePositionController implements Controller {
  async handle(request: HttpRequest): Promise<HttpResponse> {
    const userId = (request as HttpRequest & { user?: { id: string } }).user?.id;
    if (!userId) throw new UnauthorizedError();
    const slug = (request as HttpRequest & { params?: { slug?: string } }).params?.slug;
    if (!slug) return { statusCode: 400, body: { error: ERROR_CODES.INVALID_BODY } };
    try {
      const repo = new PrismaPositionRepository();
      await repo.deleteBySlug(slug);
      return { statusCode: 200, body: { ok: true } };
    } catch (e) {
      const msg = (e as Error).message;
      if (msg.includes('Record to delete does not exist'))
        return { statusCode: 404, body: { error: 'position_not_found' } };
      return { statusCode: 500, body: { error: ERROR_CODES.INTERNAL_ERROR } };
    }
  }
}

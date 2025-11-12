import { Controller, HttpRequest, HttpResponse } from '../protocols/http.js';
import { PrismaPositionRepository } from '../../infra/repositories/prisma-position-repository.js';
import { ERROR_CODES } from '../../domain/constants.js';

export class ListPositionsController implements Controller {
  async handle(request: HttpRequest): Promise<HttpResponse> {
    try {
      // mark request as used to satisfy lint if not otherwise needed
      void request;
      const repo = new PrismaPositionRepository();
      const items = await repo.listAll();
      return { statusCode: 200, body: { items } };
    } catch (e) {
      void e;
      return { statusCode: 500, body: { error: ERROR_CODES.INTERNAL_ERROR } };
    }
  }
}

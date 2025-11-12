import { Controller, HttpRequest, HttpResponse } from '../protocols/http.js';
import { UnauthorizedError } from '../errors/http-errors.js';
import { PrismaAccessMembershipRepository } from '../../infra/repositories/prisma-access-membership-repository.js';

export class ListMyAccessController implements Controller {
  async handle(request: HttpRequest): Promise<HttpResponse> {
    const authUserId = request.user?.id;
    if (!authUserId) throw new UnauthorizedError();
    try {
      const repo = new PrismaAccessMembershipRepository();
      const memberships = await repo.listByUser(authUserId);
      return { statusCode: 200, body: { memberships } };
    } catch (err) {
      if (err instanceof UnauthorizedError) {
        return { statusCode: err.statusCode, body: { error: err.code } };
      }
      return { statusCode: 500, body: { error: 'internal_error' } };
    }
  }
}

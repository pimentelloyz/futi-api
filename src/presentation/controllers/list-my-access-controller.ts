import { Controller, HttpRequest, HttpResponse } from '../protocols/http.js';
import { PrismaAccessMembershipRepository } from '../../infra/repositories/prisma-access-membership-repository.js';

export class ListMyAccessController implements Controller {
  async handle(request: HttpRequest): Promise<HttpResponse> {
    const authUserId = request.user?.id;
    if (!authUserId) return { statusCode: 401, body: { error: 'unauthorized' } };
    try {
      const repo = new PrismaAccessMembershipRepository();
      const memberships = await repo.listByUser(authUserId);
      return { statusCode: 200, body: { memberships } };
    } catch {
      return { statusCode: 500, body: { error: 'internal_error' } };
    }
  }
}

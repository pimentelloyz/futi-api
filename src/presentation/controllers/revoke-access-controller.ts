import { z } from 'zod';

import { Controller, HttpRequest, HttpResponse } from '../protocols/http.js';
import { PrismaAccessMembershipRepository } from '../../infra/repositories/prisma-access-membership-repository.js';
import { AccessControlService } from '../../data/usecases/access-control-service.js';

const schema = z.object({
  userId: z.string().min(1),
  role: z.enum(['ADMIN', 'MANAGER', 'ASSISTANT', 'PLAYER']),
  teamId: z.string().min(1).optional(),
});

export class RevokeAccessController implements Controller {
  async handle(request: HttpRequest): Promise<HttpResponse> {
    const authUserId = request.user?.id;
    if (!authUserId) return { statusCode: 401, body: { error: 'unauthorized' } };

    const repo = new PrismaAccessMembershipRepository();
    const access = new AccessControlService(repo);
    const isAdmin = await access.isAdmin(authUserId);
    if (!isAdmin) return { statusCode: 403, body: { error: 'forbidden' } };

    const parsed = schema.safeParse(request.body);
    if (!parsed.success) return { statusCode: 400, body: { error: 'invalid_request' } };

    const { userId, role, teamId } = parsed.data;
    if (role === 'ADMIN' && teamId) return { statusCode: 400, body: { error: 'admin_is_global' } };
    if ((role === 'MANAGER' || role === 'ASSISTANT' || role === 'PLAYER') && !teamId) {
      return { statusCode: 400, body: { error: 'team_required' } };
    }

    try {
      await access.revoke(userId, role, teamId ?? null);
      return { statusCode: 200, body: { ok: true } };
    } catch {
      return { statusCode: 500, body: { error: 'internal_error' } };
    }
  }
}

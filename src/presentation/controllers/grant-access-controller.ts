import { z } from 'zod';

import { Controller, HttpRequest, HttpResponse } from '../protocols/http.js';
import {
  UnauthorizedError,
  ForbiddenError,
  BadRequestError,
  ServerError,
} from '../errors/http-errors.js';
import { PrismaAccessMembershipRepository } from '../../infra/repositories/prisma-access-membership-repository.js';
import { AccessControlService } from '../../data/usecases/access-control-service.js';

const schema = z.object({
  userId: z.string().min(1),
  role: z.enum(['ADMIN', 'MANAGER', 'ASSISTANT', 'PLAYER']),
  teamId: z.string().min(1).optional(),
  leagueId: z.string().min(1).optional(),
});

export class GrantAccessController implements Controller {
  async handle(request: HttpRequest): Promise<HttpResponse> {
    const authUserId = request.user?.id;
    if (!authUserId) throw new UnauthorizedError();

    const repo = new PrismaAccessMembershipRepository();
    const access = new AccessControlService(repo);
    const isAdmin = await access.isAdmin(authUserId);
    if (!isAdmin) throw new ForbiddenError();

    const parsed = schema.safeParse(request.body);
    if (!parsed.success) {
      const flat = parsed.error.flatten();
      throw new BadRequestError('invalid_body', 'invalid request body', {
        formErrors: flat.formErrors,
        fieldErrors: flat.fieldErrors,
      });
    }

    const { userId, role, teamId, leagueId } = parsed.data;
    // Validation rules:
    // - ADMIN: can be global (no leagueId) or scoped to a league (leagueId provided). teamId must NOT be provided.
    // - MANAGER/ASSISTANT/PLAYER: must include both leagueId and teamId.
    if (role === 'ADMIN' && teamId)
      throw new BadRequestError('admin_no_team', 'admin role cannot be tied to a team');
    if (role !== 'ADMIN') {
      if (!leagueId)
        throw new BadRequestError('league_required', 'leagueId required for non-admin roles');
      if (!teamId)
        throw new BadRequestError('team_required', 'teamId required for non-admin roles');
    }

    try {
      const membership = await access.grant(userId, role, teamId ?? null, leagueId ?? null);
      return { statusCode: 200, body: { membership } };
    } catch (err) {
      if (
        err instanceof UnauthorizedError ||
        err instanceof ForbiddenError ||
        err instanceof BadRequestError
      ) {
        return { statusCode: err.statusCode, body: { error: err.code, details: err.details } };
      }
      const serverErr = new ServerError();
      return { statusCode: serverErr.statusCode, body: { error: serverErr.code } };
    }
  }
}

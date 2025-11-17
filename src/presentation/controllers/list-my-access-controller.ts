import { PrismaClient } from '@prisma/client';

import { Controller, HttpRequest, HttpResponse } from '../protocols/http.js';
import { UnauthorizedError } from '../errors/http-errors.js';
import { PrismaAccessMembershipRepository } from '../../infra/repositories/prisma-access-membership-repository.js';
import { ERROR_CODES } from '../../domain/constants.js';
import { AccessRole } from '../../domain/constants/access-roles.js';

const prisma = new PrismaClient();

export class ListMyAccessController implements Controller {
  async handle(request: HttpRequest): Promise<HttpResponse> {
    const authUserId = request.user?.id;
    if (!authUserId) throw new UnauthorizedError();
    try {
      const repo = new PrismaAccessMembershipRepository();
      const memberships = await repo.listByUserWithTeam(authUserId);

      // Busca informações do usuário
      const user = await prisma.user.findUnique({
        where: { id: authUserId },
        select: {
          id: true,
          email: true,
          displayName: true,
        },
      });

      // Se não tem memberships, o usuário é FAN
      const defaultRole = memberships.length === 0 ? AccessRole.FAN : null;

      return {
        statusCode: 200,
        body: {
          user,
          memberships,
          defaultRole,
        },
      };
    } catch (err) {
      if (err instanceof UnauthorizedError) {
        return { statusCode: err.statusCode, body: { error: err.code } };
      }
      return { statusCode: 500, body: { error: ERROR_CODES.INTERNAL_ERROR } };
    }
  }
}

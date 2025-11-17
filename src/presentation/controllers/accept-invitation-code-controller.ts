import { z } from 'zod';

import { Controller, HttpRequest, HttpResponse } from '../protocols/http.js';
import { BadRequestError, UnauthorizedError } from '../errors/http-errors.js';
import { PrismaInvitationCodeRepository } from '../../infra/repositories/prisma-invitation-code-repository.js';
import { PrismaPlayerRepository } from '../../infra/repositories/prisma-player-repository.js';
import { prisma } from '../../infra/prisma/client.js';
import { ERROR_CODES } from '../../domain/constants.js';

const schema = z.object({
  code: z.string().min(3),
});

export class AcceptInvitationCodeController implements Controller {
  async handle(request: HttpRequest): Promise<HttpResponse> {
    const userId = (request as HttpRequest & { user?: { id: string } }).user?.id;
    if (!userId) throw new UnauthorizedError();
    const parsed = schema.safeParse(request.body);
    if (!parsed.success) {
      const flat = parsed.error.flatten();
      throw new BadRequestError(ERROR_CODES.INVALID_BODY, 'invalid request body', {
        formErrors: flat.formErrors,
        fieldErrors: flat.fieldErrors,
      });
    }

    try {
      const playerRepo = new PrismaPlayerRepository();
      const player = await playerRepo.findByUserId(userId);
      if (!player) return { statusCode: 404, body: { error: 'player_not_found' } };
      const playerId = player.id;

      const inviteRepo = new PrismaInvitationCodeRepository();
      const code = await inviteRepo.findByCode(parsed.data.code);
      if (!code) return { statusCode: 404, body: { error: 'invite_not_found' } };

      const now = new Date();
      if (!code.isActive || (code.expiresAt && code.expiresAt <= now)) {
        return { statusCode: 400, body: { error: 'invite_expired' } };
      }
      if (code.uses >= code.maxUses) {
        return { statusCode: 400, body: { error: 'invite_maxed' } };
      }

      // Prevent duplicate linking
      const existingLink = await prisma.playersOnTeams.findUnique({
        where: { playerId_teamId: { playerId, teamId: code.teamId } },
      });
      if (existingLink) return { statusCode: 409, body: { error: 'already_member' } };

      // Atomic create link + increment uses
      await prisma.$transaction([
        prisma.playersOnTeams.create({
          data: { playerId, teamId: code.teamId, assignedBy: userId },
        }),
        prisma.invitationCode.update({ where: { id: code.id }, data: { uses: { increment: 1 } } }),
      ]);

      // If reached max uses, revoke
      const updated = await inviteRepo.findByCode(code.code);
      if (updated && updated.uses >= updated.maxUses) {
        await inviteRepo.revoke(updated.id);
      }

      return { statusCode: 200, body: { message: 'joined', teamId: code.teamId } };
    } catch (err) {
      console.error('[accept_invite_error]', (err as Error).message);
      return { statusCode: 500, body: { error: ERROR_CODES.INTERNAL_ERROR } };
    }
  }
}

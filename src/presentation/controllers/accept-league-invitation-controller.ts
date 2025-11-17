import { z } from 'zod';

import { Controller, HttpRequest, HttpResponse } from '../protocols/http.js';
import { ERROR_CODES } from '../../domain/constants.js';
import { AcceptLeagueInvitationUseCase } from '../../domain/usecases/accept-league-invitation/accept-league-invitation.usecase.js';
import { prisma } from '../../infra/prisma/client.js';

const schema = z.object({ code: z.string().min(3), teamId: z.string().min(1) });

export class AcceptLeagueInvitationController implements Controller {
  constructor(private readonly acceptLeagueInvitationUseCase: AcceptLeagueInvitationUseCase) {}

  async handle(request: HttpRequest): Promise<HttpResponse> {
    const user = request.user as { id: string } | undefined;
    if (!user) return { statusCode: 401, body: { error: ERROR_CODES.UNAUTHORIZED } };

    const parsed = schema.safeParse(request.body);
    if (!parsed.success) return { statusCode: 400, body: { error: 'invalid_body' } };

    const { code, teamId } = parsed.data;

    try {
      // Verify that user has managerial access to the team
      const access = await prisma.accessMembership.findFirst({
        where: { userId: user.id, teamId, role: { in: ['ADMIN', 'MANAGER'] } },
      });
      if (!access) return { statusCode: 403, body: { error: 'not_team_manager' } };

      const result = await this.acceptLeagueInvitationUseCase.execute({
        code,
        teamId,
        userId: user.id,
      });

      return {
        statusCode: 200,
        body: {
          message: result.message,
          leagueId: result.leagueId,
        },
      };
    } catch (err) {
      const error = err as Error;
      console.error('[accept_league_invite_error]', error.message);

      switch (error.message) {
        case 'TEAM_NOT_FOUND':
          return { statusCode: 404, body: { error: 'team_not_found' } };
        case 'INVITE_NOT_FOUND':
          return { statusCode: 404, body: { error: 'invite_not_found' } };
        case 'INVITE_EXPIRED':
          return { statusCode: 400, body: { error: 'invite_expired' } };
        case 'INVITE_MAXED':
          return { statusCode: 400, body: { error: 'invite_maxed' } };
        case 'INVITE_INVALID':
          return { statusCode: 400, body: { error: 'invite_invalid' } };
        case 'TEAM_ALREADY_IN_LEAGUE':
          return { statusCode: 409, body: { error: 'team_already_in_league' } };
        default:
          return { statusCode: 500, body: { error: ERROR_CODES.INTERNAL_ERROR } };
      }
    }
  }
}

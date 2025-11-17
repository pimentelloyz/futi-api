import { Controller, HttpRequest, HttpResponse } from '../protocols/http.js';
import { RevokeLeagueInvitationUseCase } from '../../domain/usecases/revoke-league-invitation/revoke-league-invitation.usecase.js';

export class RevokeLeagueInvitationController implements Controller {
  constructor(private readonly revokeLeagueInvitationUseCase: RevokeLeagueInvitationUseCase) {}

  async handle(request: HttpRequest): Promise<HttpResponse> {
    const id = (request.params as Record<string, string | undefined>)?.id;
    if (!id) return { statusCode: 400, body: { error: 'id required' } };

    try {
      await this.revokeLeagueInvitationUseCase.execute({ invitationId: id });
      return { statusCode: 204, body: { message: 'revoked' } };
    } catch (err) {
      const error = err as Error;
      console.error('[revoke_league_invitation_error]', error.message);

      if (error.message === 'INVITE_NOT_FOUND') {
        return { statusCode: 404, body: { error: 'invite_not_found' } };
      }

      return { statusCode: 500, body: { error: 'internal_error' } };
    }
  }
}

import { Controller, HttpRequest, HttpResponse } from '../protocols/http.js';
import { RevokeInvitationCodeUseCase } from '../../domain/usecases/revoke-invitation-code/revoke-invitation-code.usecase.js';

export class RevokeInvitationCodeController implements Controller {
  constructor(private readonly revokeInvitationCodeUseCase: RevokeInvitationCodeUseCase) {}

  async handle(request: HttpRequest): Promise<HttpResponse> {
    const id = request.params?.id as string | undefined;
    if (!id) return { statusCode: 400, body: { error: 'missing_id' } };

    try {
      await this.revokeInvitationCodeUseCase.execute({ invitationCodeId: id });
      return { statusCode: 204, body: { message: 'revoked' } };
    } catch (err) {
      console.error('[revoke_invitation_code_error]', (err as Error).message);
      return { statusCode: 500, body: { error: 'internal_error' } };
    }
  }
}

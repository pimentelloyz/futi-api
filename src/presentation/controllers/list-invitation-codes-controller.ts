import { Controller, HttpRequest, HttpResponse } from '../protocols/http.js';
import { ListInvitationCodesUseCase } from '../../domain/usecases/list-invitation-codes/list-invitation-codes.usecase.js';

export class ListInvitationCodesController implements Controller {
  constructor(private readonly listInvitationCodesUseCase: ListInvitationCodesUseCase) {}

  async handle(request: HttpRequest): Promise<HttpResponse> {
    const teamId = request.query?.teamId as string | undefined;
    if (!teamId) return { statusCode: 400, body: { error: 'missing_team_id' } };

    const isActive = request.query?.isActive ? request.query.isActive === 'true' : undefined;

    try {
      const result = await this.listInvitationCodesUseCase.execute({ teamId, isActive });
      return { statusCode: 200, body: result.invitationCodes };
    } catch (err) {
      console.error('[list_invitation_codes_error]', (err as Error).message);
      return { statusCode: 500, body: { error: 'internal_error' } };
    }
  }
}

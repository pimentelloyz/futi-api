import { Controller, HttpRequest, HttpResponse } from '../protocols/http.js';
import { ListLeagueInvitationsUseCase } from '../../domain/usecases/list-league-invitations/list-league-invitations.usecase.js';

export class ListLeagueInvitationsController implements Controller {
  constructor(private readonly listLeagueInvitationsUseCase: ListLeagueInvitationsUseCase) {}

  async handle(request: HttpRequest): Promise<HttpResponse> {
    const qp = (request.query as Record<string, unknown>) ?? {};
    const leagueId = qp.leagueId as string | undefined;
    if (!leagueId) return { statusCode: 400, body: { error: 'leagueId required' } };

    const isActive = qp.isActive ? qp.isActive === 'true' : undefined;

    try {
      const result = await this.listLeagueInvitationsUseCase.execute({ leagueId, isActive });
      return { statusCode: 200, body: { items: result.invitations } };
    } catch (err) {
      console.error('[list_league_invitations_error]', (err as Error).message);
      return { statusCode: 500, body: { error: 'internal_error' } };
    }
  }
}

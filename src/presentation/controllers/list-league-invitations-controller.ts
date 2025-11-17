import { Controller, HttpRequest, HttpResponse } from '../protocols/http.js';
import { prisma } from '../../infra/prisma/client.js';

export class ListLeagueInvitationsController implements Controller {
  async handle(request: HttpRequest): Promise<HttpResponse> {
    const qp = (request.query as Record<string, unknown>) ?? {};
    const leagueId = qp.leagueId as string | undefined;
    if (!leagueId) return { statusCode: 400, body: { error: 'leagueId required' } };
    const items = await prisma.leagueInvitation.findMany({ where: { leagueId } });
    return { statusCode: 200, body: { items } };
  }
}

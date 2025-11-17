import { Controller, HttpRequest, HttpResponse } from '../protocols/http.js';
import { prisma } from '../../infra/prisma/client.js';

export class RevokeLeagueInvitationController implements Controller {
  async handle(request: HttpRequest): Promise<HttpResponse> {
    const id = (request.params as Record<string, string | undefined>)?.id;
    if (!id) return { statusCode: 400, body: { error: 'id required' } };
    const inv = await prisma.leagueInvitation.findUnique({ where: { id } });
    if (!inv) return { statusCode: 404, body: { error: 'invite_not_found' } };
    await prisma.leagueInvitation.update({ where: { id }, data: { isActive: false } });
    return { statusCode: 204, body: {} };
  }
}

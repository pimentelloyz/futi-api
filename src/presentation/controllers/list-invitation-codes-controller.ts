import { Controller, HttpRequest, HttpResponse } from '../protocols/http.js';
import { PrismaInvitationCodeRepository } from '../../infra/repositories/prisma-invitation-code-repository.js';

export class ListInvitationCodesController implements Controller {
  constructor(private readonly repo = new PrismaInvitationCodeRepository()) {}

  async handle(request: HttpRequest): Promise<HttpResponse> {
    const teamId = request.query?.teamId as string | undefined;
    if (!teamId) return { statusCode: 400, body: { error: 'missing_team_id' } };
    const rows = await this.repo.listByTeam(teamId);
    return { statusCode: 200, body: rows };
  }
}

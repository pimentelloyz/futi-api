import { Controller, HttpRequest, HttpResponse } from '../protocols/http.js';
import { PrismaInvitationCodeRepository } from '../../infra/repositories/prisma-invitation-code-repository.js';

export class RevokeInvitationCodeController implements Controller {
  constructor(private readonly repo = new PrismaInvitationCodeRepository()) {}

  async handle(request: HttpRequest): Promise<HttpResponse> {
    const id = request.params?.id as string | undefined;
    if (!id) return { statusCode: 400, body: { error: 'missing_id' } };
    await this.repo.revoke(id);
    return { statusCode: 204 };
  }
}

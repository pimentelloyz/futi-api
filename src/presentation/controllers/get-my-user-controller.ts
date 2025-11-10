import { Controller, HttpRequest, HttpResponse } from '../protocols/http.js';
import { prisma } from '../../infra/prisma/client.js';

export class GetMyUserController implements Controller {
  async handle(request: HttpRequest): Promise<HttpResponse> {
    const userId = (request as HttpRequest & { user?: { id: string } }).user?.id;
    if (!userId) return { statusCode: 401, body: { error: 'unauthorized' } };
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          firebaseUid: true,
          email: true,
          displayName: true,
          player: { select: { id: true } },
        },
      });
      if (!user) return { statusCode: 404, body: { error: 'user_not_found' } };
      return {
        statusCode: 200,
        body: {
          id: user.id,
          firebaseUid: user.firebaseUid,
          email: user.email,
          displayName: user.displayName,
          playerId: user.player?.id ?? null,
        },
      };
    } catch {
      return { statusCode: 500, body: { error: 'internal_error' } };
    }
  }
}

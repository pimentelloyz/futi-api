import { Controller, HttpRequest, HttpResponse } from '../protocols/http.js';
import { UnauthorizedError, NotFoundError } from '../errors/http-errors.js';
import { prisma } from '../../infra/prisma/client.js';

export class GetMyUserController implements Controller {
  async handle(request: HttpRequest): Promise<HttpResponse> {
    const userId = (request as HttpRequest & { user?: { id: string } }).user?.id;
    if (!userId) throw new UnauthorizedError();
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
      if (!user) throw new NotFoundError('user_not_found', 'user not found');
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
    } catch (err) {
      if (err instanceof UnauthorizedError || err instanceof NotFoundError) {
        return { statusCode: err.statusCode, body: { error: err.code, details: err.details } };
      }
      return { statusCode: 500, body: { error: 'internal_error' } };
    }
  }
}

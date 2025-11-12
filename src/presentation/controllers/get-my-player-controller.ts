import { Controller, HttpRequest, HttpResponse } from '../protocols/http.js';
import { UnauthorizedError, NotFoundError } from '../errors/http-errors.js';
import { PlayerRepository } from '../../data/protocols/player-repository.js';
import { PrismaPlayerRepository } from '../../infra/repositories/prisma-player-repository.js';

export class GetMyPlayerController implements Controller {
  private readonly repo: PlayerRepository;
  constructor() {
    this.repo = new PrismaPlayerRepository();
  }
  async handle(request: HttpRequest): Promise<HttpResponse> {
    const userId = (request as HttpRequest & { user?: { id: string } }).user?.id;
    if (!userId) throw new UnauthorizedError();
    try {
      const player = await this.repo.findByUserId(userId);
      if (!player) throw new NotFoundError('player_not_found', 'player not found');
      return { statusCode: 200, body: player };
    } catch (err) {
      if (err instanceof UnauthorizedError || err instanceof NotFoundError) {
        return { statusCode: err.statusCode, body: { error: err.code, details: err.details } };
      }
      return { statusCode: 500, body: { error: 'internal_error' } };
    }
  }
}

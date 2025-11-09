import { Controller, HttpRequest, HttpResponse } from '../protocols/http.js';
import { PlayerRepository } from '../../data/protocols/player-repository.js';
import { PrismaPlayerRepository } from '../../infra/repositories/prisma-player-repository.js';

export class GetMyPlayerController implements Controller {
  private readonly repo: PlayerRepository;
  constructor() {
    this.repo = new PrismaPlayerRepository();
  }
  async handle(request: HttpRequest): Promise<HttpResponse> {
    const userId = (request as HttpRequest & { user?: { id: string } }).user?.id;
    if (!userId) return { statusCode: 401, body: { error: 'unauthorized' } };
    try {
      const player = await this.repo.findByUserId(userId);
      if (!player) return { statusCode: 404, body: { error: 'player_not_found' } };
      return { statusCode: 200, body: player };
    } catch {
      return { statusCode: 500, body: { error: 'internal_error' } };
    }
  }
}

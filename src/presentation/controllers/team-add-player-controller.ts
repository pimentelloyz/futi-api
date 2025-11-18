import { prisma } from '../../infra/prisma/client.js';
import { ERROR_CODES } from '../../domain/constants.js';

interface TeamAddPlayerParams {
  teamId: string;
  playerId: string;
}

export class TeamAddPlayerController {
  async handle(params: TeamAddPlayerParams): Promise<{ statusCode: number; body: unknown }> {
    const { teamId, playerId } = params;
    if (!teamId) return { statusCode: 400, body: { error: ERROR_CODES.INVALID_TEAM_ID } };
    if (!playerId) return { statusCode: 400, body: { error: ERROR_CODES.INVALID_PLAYER_ID } };
    try {
      const team = await prisma.team.findUnique({
        where: { id: teamId },
        select: { id: true, isActive: true },
      });
      if (!team || team.isActive === false)
        return { statusCode: 404, body: { error: ERROR_CODES.TEAM_NOT_FOUND } };
      try {
        await prisma.player.update({
          where: { id: playerId },
          data: { teams: { create: { teamId } } },
        });
      } catch (err) {
        const msg = (err as Error).message || '';
        if (!/unique/i.test(msg))
          return { statusCode: 500, body: { error: ERROR_CODES.INTERNAL_ERROR } };
        // se já existe, consideramos idempotente e retornamos 204
      }
      return { statusCode: 204, body: undefined };
    } catch (e) {
      console.error('[team_add_player_ctrl_error]', (e as Error).message);
      return { statusCode: 500, body: { error: ERROR_CODES.INTERNAL_ERROR } };
    }
  }
}

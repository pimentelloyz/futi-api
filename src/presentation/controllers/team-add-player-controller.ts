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
        const db1 = prisma as unknown as {
          player: { update: (args: Record<string, unknown>) => Promise<unknown> };
        };
        await db1.player.update({
          where: { id: playerId },
          data: { teams: { connect: [{ id: teamId }] } },
        });
      } catch (err1) {
        const msg1 = (err1 as Error).message || '';
        try {
          const db2 = prisma as unknown as {
            player: { update: (args: Record<string, unknown>) => Promise<unknown> };
          };
          await db2.player.update({
            where: { id: playerId },
            data: { teams: { create: { teamId } } },
          });
        } catch (err2) {
          const msg2 = (err2 as Error).message || '';
          if (!/unique/i.test(msg1) && !/unique/i.test(msg2))
            return { statusCode: 500, body: { error: ERROR_CODES.INTERNAL_ERROR } };
        }
      }
      return { statusCode: 204, body: undefined };
    } catch (e) {
      console.error('[team_add_player_ctrl_error]', (e as Error).message);
      return { statusCode: 500, body: { error: ERROR_CODES.INTERNAL_ERROR } };
    }
  }
}

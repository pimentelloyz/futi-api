import { prisma } from '../../infra/prisma/client.js';
import { ERROR_CODES } from '../../domain/constants.js';

interface TeamSoftDeleteParams {
  teamId: string;
}

export class TeamSoftDeleteController {
  async handle(params: TeamSoftDeleteParams): Promise<{ statusCode: number; body: unknown }> {
    const { teamId } = params;
    if (!teamId) return { statusCode: 400, body: { error: ERROR_CODES.INVALID_TEAM_ID } };
    try {
      const team = await prisma.team.findUnique({
        where: { id: teamId },
        select: { id: true, isActive: true },
      });
      if (!team) return { statusCode: 404, body: { error: ERROR_CODES.TEAM_NOT_FOUND } };
      if (team.isActive)
        await prisma.team.update({ where: { id: teamId }, data: { isActive: false } });
      return { statusCode: 204, body: undefined };
    } catch (e) {
      console.error('[team_soft_delete_ctrl_error]', (e as Error).message);
      return { statusCode: 500, body: { error: ERROR_CODES.INTERNAL_ERROR } };
    }
  }
}

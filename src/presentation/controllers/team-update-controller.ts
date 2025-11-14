import { prisma } from '../../infra/prisma/client.js';
import { ERROR_CODES } from '../../domain/constants.js';

interface TeamUpdateParams {
  teamId: string;
  data: { name?: string; icon?: string | null; description?: string | null; isActive?: boolean };
}

export class TeamUpdateController {
  async handle(params: TeamUpdateParams): Promise<{ statusCode: number; body: unknown }> {
    const { teamId, data } = params;
    if (!teamId) return { statusCode: 400, body: { error: ERROR_CODES.INVALID_TEAM_ID } };
    const updateData: Record<string, unknown> = {};
    if (typeof data.name === 'string') updateData.name = data.name;
    if (typeof data.icon === 'string' || data.icon === null) updateData.icon = data.icon;
    if (typeof data.description === 'string' || data.description === null)
      updateData.description = data.description;
    if (typeof data.isActive === 'boolean') updateData.isActive = data.isActive;
    if (!Object.keys(updateData).length)
      return { statusCode: 400, body: { error: ERROR_CODES.INVALID_BODY } };
    try {
      const team = await prisma.team.findUnique({ where: { id: teamId }, select: { id: true } });
      if (!team) return { statusCode: 404, body: { error: ERROR_CODES.TEAM_NOT_FOUND } };
      const updated = await prisma.team.update({ where: { id: teamId }, data: updateData });
      return {
        statusCode: 200,
        body: {
          id: updated.id,
          name: updated.name,
          icon: updated.icon,
          description: updated.description,
          isActive: updated.isActive,
        },
      };
    } catch (e) {
      console.error('[team_update_ctrl_error]', (e as Error).message);
      return { statusCode: 500, body: { error: ERROR_CODES.INTERNAL_ERROR } };
    }
  }
}

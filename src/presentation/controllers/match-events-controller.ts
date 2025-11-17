import { z } from 'zod';

import { PrismaMatchEventRepository } from '../../infra/repositories/prisma-match-event-repository.js';
import { ERROR_CODES } from '../../domain/constants.js';

export class MatchEventsListController {
  async handle(params: {
    matchId: string;
    type?: string;
  }): Promise<{ statusCode: number; body: unknown }> {
    const { matchId, type } = params;
    if (!matchId) return { statusCode: 400, body: { error: ERROR_CODES.INVALID_REQUEST } };
    try {
      const repo = new PrismaMatchEventRepository();
      let items = await repo.listByMatch(matchId);

      // Filtrar por tipo se fornecido
      if (type) {
        const types = type.split(',').map((t) => t.trim());
        items = items.filter((item) => types.includes(item.type));
      }

      return { statusCode: 200, body: { items } };
    } catch (e) {
      console.error('[match_events_list_ctrl_error]', (e as Error).message);
      return { statusCode: 500, body: { error: ERROR_CODES.INTERNAL_ERROR } };
    }
  }
}

const addEventSchema = z.object({
  type: z.enum(['GOAL', 'FOUL', 'YELLOW_CARD', 'RED_CARD', 'OWN_GOAL']),
  minute: z.number().int().min(0).max(130).optional(),
  teamId: z.string().optional(),
  playerId: z.string().optional(),
});

export class MatchEventCreateController {
  async handle(params: {
    matchId: string;
    body: unknown;
  }): Promise<{ statusCode: number; body: unknown }> {
    const { matchId, body } = params;
    const parsed = addEventSchema.safeParse(body);
    if (!parsed.success) return { statusCode: 400, body: { error: ERROR_CODES.INVALID_REQUEST } };
    try {
      const repo = new PrismaMatchEventRepository();
      const created = await repo.add({
        matchId,
        type: parsed.data.type,
        minute: parsed.data.minute,
        teamId: parsed.data.teamId,
        playerId: parsed.data.playerId,
      });
      return { statusCode: 201, body: created };
    } catch (e) {
      console.error('[match_event_create_ctrl_error]', (e as Error).message);
      return { statusCode: 500, body: { error: ERROR_CODES.INTERNAL_ERROR } };
    }
  }
}

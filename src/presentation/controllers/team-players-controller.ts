import { prisma } from '../../infra/prisma/client.js';
import { ERROR_CODES } from '../../domain/constants.js';

interface TeamPlayersParams {
  teamId: string;
  page: number;
  limit: number;
  sort: 'name' | 'number' | 'positionSlug' | 'isActive';
  order: 'asc' | 'desc';
  includeTeam: boolean;
}

export class TeamPlayersController {
  async handle(params: TeamPlayersParams): Promise<{ statusCode: number; body: unknown }> {
    const { teamId, page, limit, sort, order, includeTeam } = params;
    if (!teamId) return { statusCode: 400, body: { error: 'invalid_team_id' } };
    try {
      const prismaAny = prisma as unknown as {
        team: {
          findUnique: (args: Record<string, unknown>) => Promise<unknown>;
        };
      };
      const teamExplicit = (await prismaAny.team.findUnique({
        where: { id: teamId },
        select: {
          isActive: true,
          id: includeTeam ? true : undefined,
          name: includeTeam ? true : undefined,
          players: {
            include: {
              player: {
                select: { id: true, name: true, positionSlug: true, number: true, isActive: true },
              },
            },
          },
        },
      })) as unknown as {
        isActive: boolean;
        id?: string;
        name?: string;
        players: Array<{ player?: unknown }>;
      } | null;
      if (!teamExplicit || teamExplicit.isActive === false)
        return { statusCode: 404, body: { error: 'team_not_found' } };
      const isPlayerLite = (
        p: unknown,
      ): p is {
        id: string;
        name: string;
        positionSlug: string | null;
        number: number | null;
        isActive: boolean;
      } => {
        if (!p || typeof p !== 'object') return false;
        const o = p as Record<string, unknown>;
        return (
          typeof o.id === 'string' && typeof o.name === 'string' && typeof o.isActive === 'boolean'
        );
      };
      let players = (teamExplicit.players ?? [])
        .map((pt: { player?: unknown }) => pt?.player)
        .filter(isPlayerLite) as Array<{
        id: string;
        name: string;
        positionSlug: string | null;
        number: number | null;
        isActive: boolean;
      }>;
      let teamMeta: { id?: string; name?: string } = {
        id: teamExplicit.id,
        name: teamExplicit.name,
      };
      if (players.length === 0) {
        const legacy = (await prismaAny.team.findUnique({
          where: { id: teamId },
          select: {
            isActive: true,
            id: includeTeam ? true : undefined,
            name: includeTeam ? true : undefined,
            players: {
              select: { id: true, name: true, positionSlug: true, number: true, isActive: true },
            },
          },
        })) as unknown as {
          isActive: boolean;
          id?: string;
          name?: string;
          players: Array<{
            id: string;
            name: string;
            positionSlug: string | null;
            number: number | null;
            isActive: boolean;
          }>;
        } | null;
        if (!legacy || legacy.isActive === false)
          return { statusCode: 404, body: { error: 'team_not_found' } };
        teamMeta = { id: legacy.id, name: legacy.name };
        players = legacy.players ?? [];
      }
      const items = [...players].sort((a, b) => {
        const aVal = (a as Record<string, unknown>)[sort];
        const bVal = (b as Record<string, unknown>)[sort];
        if (aVal == null && bVal == null) return 0;
        if (aVal == null) return order === 'asc' ? -1 : 1;
        if (bVal == null) return order === 'asc' ? 1 : -1;
        if (typeof aVal === 'string' && typeof bVal === 'string')
          return order === 'asc'
            ? (aVal as string).localeCompare(bVal as string)
            : (bVal as string).localeCompare(aVal as string);
        if (aVal === bVal) return 0;
        return order === 'asc'
          ? (aVal as number) < (bVal as number)
            ? -1
            : 1
          : (aVal as number) > (bVal as number)
            ? -1
            : 1;
      });
      const total = items.length;
      const start = (page - 1) * limit;
      const paged = items.slice(start, start + limit);
      const payload: {
        items: typeof paged;
        page: number;
        limit: number;
        total: number;
        team?: { id: string; name: string };
      } = {
        items: paged,
        page,
        limit,
        total,
      };
      if (includeTeam) payload.team = { id: teamMeta.id!, name: teamMeta.name! };
      return { statusCode: 200, body: payload };
    } catch (e) {
      console.error('[team_players_ctrl_error]', (e as Error).message);
      return { statusCode: 500, body: { error: ERROR_CODES.INTERNAL_ERROR } };
    }
  }
}

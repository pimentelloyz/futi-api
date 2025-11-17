import { z } from 'zod';

import { Controller, HttpRequest, HttpResponse } from '../protocols/http.js';
import { BadRequestError } from '../errors/http-errors.js';
import { ERROR_CODES } from '../../domain/constants.js';
import { prisma } from '../../infra/prisma/client.js';

const schema = z.object({
  leagueId: z.string().min(1),
  maxUses: z.number().int().min(1).optional(),
  expiresAt: z.string().optional().nullable(),
});

function genCode() {
  return Math.random().toString(36).slice(2, 9).toUpperCase();
}

export class CreateLeagueInvitationController implements Controller {
  async handle(request: HttpRequest): Promise<HttpResponse> {
    const parsed = schema.safeParse(request.body);
    if (!parsed.success) {
      const flat = parsed.error.flatten();
      throw new BadRequestError(ERROR_CODES.INVALID_BODY, 'invalid request body', {
        formErrors: flat.formErrors,
        fieldErrors: flat.fieldErrors,
      });
    }
    const { leagueId, maxUses, expiresAt } = parsed.data;
    const league = await prisma.league.findUnique({ where: { id: leagueId } });
    if (!league) return { statusCode: 404, body: { error: 'league_not_found' } };
    const code = genCode();
    const created = await prisma.leagueInvitation.create({
      data: {
        code,
        leagueId,
        createdBy: request.user?.id ?? null,
        maxUses: maxUses ?? 1,
        expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      },
    });
    return { statusCode: 201, body: { id: created.id, code: created.code } };
  }
}

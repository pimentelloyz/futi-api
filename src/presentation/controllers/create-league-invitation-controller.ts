import { z } from 'zod';

import { Controller, HttpRequest, HttpResponse } from '../protocols/http.js';
import { BadRequestError } from '../errors/http-errors.js';
import { ERROR_CODES } from '../../domain/constants.js';
import { CreateLeagueInvitationUseCase } from '../../domain/usecases/create-league-invitation/create-league-invitation.usecase.js';

const schema = z.object({
  leagueId: z.string().min(1),
  maxUses: z.number().int().min(1).optional(),
  expiresAt: z.string().optional().nullable(),
});

export class CreateLeagueInvitationController implements Controller {
  constructor(private readonly createLeagueInvitationUseCase: CreateLeagueInvitationUseCase) {}

  async handle(request: HttpRequest): Promise<HttpResponse> {
    try {
      const parsed = schema.safeParse(request.body);
      if (!parsed.success) {
        const flat = parsed.error.flatten();
        throw new BadRequestError(ERROR_CODES.INVALID_BODY, 'invalid request body', {
          formErrors: flat.formErrors,
          fieldErrors: flat.fieldErrors,
        });
      }

      const { leagueId, maxUses, expiresAt } = parsed.data;

      const result = await this.createLeagueInvitationUseCase.execute({
        leagueId,
        createdBy: request.user?.id ?? null,
        maxUses,
        expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      });

      return { statusCode: 201, body: result };
    } catch (err) {
      const error = err as Error;
      console.error('[create_league_invite_error]', error.message);

      if (error.message === 'LEAGUE_NOT_FOUND') {
        return { statusCode: 404, body: { error: 'league_not_found' } };
      }

      if (err instanceof BadRequestError) {
        return { statusCode: err.statusCode, body: { error: err.code, details: err.details } };
      }

      return { statusCode: 500, body: { error: ERROR_CODES.INTERNAL_ERROR } };
    }
  }
}

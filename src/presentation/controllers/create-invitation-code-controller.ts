import { z } from 'zod';

import { Controller, HttpRequest, HttpResponse } from '../protocols/http.js';
import { BadRequestError, ServerError } from '../errors/http-errors.js';
import { ERROR_CODES } from '../../domain/constants.js';
import { CreateInvitationCodeUseCase } from '../../domain/usecases/create-invitation-code/create-invitation-code.usecase.js';

const schema = z.object({
  teamId: z.string().uuid(),
  maxUses: z.number().int().min(1).optional(),
  expiresAt: z.string().optional(),
});

export class CreateInvitationCodeController implements Controller {
  constructor(private readonly createInvitationCodeUseCase: CreateInvitationCodeUseCase) {}

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

      const expiresAt = parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : undefined;

      const result = await this.createInvitationCodeUseCase.execute({
        teamId: parsed.data.teamId,
        createdBy: request.user?.id ?? null,
        maxUses: parsed.data.maxUses,
        expiresAt,
      });

      return { statusCode: 201, body: result };
    } catch (err: unknown) {
      if (err instanceof BadRequestError) {
        return { statusCode: err.statusCode, body: { error: err.code, details: err.details } };
      }
      console.error('[create_invite_error]', err);
      const se = new ServerError(500, 'invite_create_failed', 'failed to create invite');
      return { statusCode: se.statusCode, body: { error: ERROR_CODES.INTERNAL_ERROR } };
    }
  }
}

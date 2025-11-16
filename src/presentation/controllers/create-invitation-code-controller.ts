import { z } from 'zod';

import { Controller, HttpRequest, HttpResponse } from '../protocols/http.js';
import { BadRequestError, ServerError } from '../errors/http-errors.js';
import { ERROR_CODES } from '../../domain/constants.js';
import { PrismaInvitationCodeRepository } from '../../infra/repositories/prisma-invitation-code-repository.js';

const schema = z.object({
  teamId: z.string().uuid(),
  maxUses: z.number().int().min(1).optional(),
  expiresAt: z.string().optional(),
});

export class CreateInvitationCodeController implements Controller {
  constructor(private readonly repo = new PrismaInvitationCodeRepository()) {}

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
      const code = Math.random().toString(36).slice(2, 10).toUpperCase();
      const expiresAt = parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : undefined;
      const created = await this.repo.create({
        code,
        teamId: parsed.data.teamId,
        maxUses: parsed.data.maxUses,
        expiresAt,
        createdBy: request.auth?.userId ?? null,
      });
      return { statusCode: 201, body: created };
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

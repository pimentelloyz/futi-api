import { z } from 'zod';

import { Controller, HttpRequest, HttpResponse } from '../protocols/http.js';
import { BadRequestError, UnauthorizedError } from '../errors/http-errors.js';
import { ERROR_CODES } from '../../domain/constants.js';
import { AcceptInvitationCodeUseCase } from '../../domain/usecases/accept-invitation-code/accept-invitation-code.usecase.js';

const schema = z.object({
  code: z.string().min(3),
});

export class AcceptInvitationCodeController implements Controller {
  constructor(private readonly acceptInvitationCodeUseCase: AcceptInvitationCodeUseCase) {}

  async handle(request: HttpRequest): Promise<HttpResponse> {
    const userId = (request as HttpRequest & { user?: { id: string } }).user?.id;
    if (!userId) throw new UnauthorizedError();

    const parsed = schema.safeParse(request.body);
    if (!parsed.success) {
      const flat = parsed.error.flatten();
      throw new BadRequestError(ERROR_CODES.INVALID_BODY, 'invalid request body', {
        formErrors: flat.formErrors,
        fieldErrors: flat.fieldErrors,
      });
    }

    try {
      const result = await this.acceptInvitationCodeUseCase.execute({
        code: parsed.data.code,
        userId,
      });

      return {
        statusCode: 200,
        body: {
          message: result.message,
          teamId: result.teamId,
        },
      };
    } catch (err) {
      const error = err as Error;
      console.error('[accept_invite_error]', error.message);

      switch (error.message) {
        case 'PLAYER_NOT_FOUND':
          return { statusCode: 404, body: { error: 'player_not_found' } };
        case 'INVITE_NOT_FOUND':
          return { statusCode: 404, body: { error: 'invite_not_found' } };
        case 'INVITE_EXPIRED':
          return { statusCode: 400, body: { error: 'invite_expired' } };
        case 'INVITE_MAXED':
          return { statusCode: 400, body: { error: 'invite_maxed' } };
        case 'INVITE_INVALID':
          return { statusCode: 400, body: { error: 'invite_invalid' } };
        case 'ALREADY_MEMBER':
          return { statusCode: 409, body: { error: 'already_member' } };
        default:
          return { statusCode: 500, body: { error: ERROR_CODES.INTERNAL_ERROR } };
      }
    }
  }
}

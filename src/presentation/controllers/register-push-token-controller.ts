import { z } from 'zod';

import { Controller, HttpRequest, HttpResponse } from '../protocols/http.js';
import { UnauthorizedError, BadRequestError, ServerError } from '../errors/http-errors.js';
import type { PushTokenRepository } from '../../data/protocols/push-token-repository.js';
import { PUSH_PLATFORM, ERROR_CODES } from '../../domain/constants.js';

const schema = z.object({
  token: z.string().min(10).max(512),
  platform: z.enum([PUSH_PLATFORM.IOS, PUSH_PLATFORM.ANDROID, PUSH_PLATFORM.WEB]).optional(),
});

export class RegisterPushTokenController implements Controller {
  constructor(private readonly repo: PushTokenRepository) {}
  async handle(request: HttpRequest & { user?: { id: string } }): Promise<HttpResponse> {
    try {
      const userId = request.user?.id;
      if (!userId) throw new UnauthorizedError();
      const parsed = schema.safeParse(request.body);
      if (!parsed.success) {
        const flat = parsed.error.flatten();
        throw new BadRequestError(ERROR_CODES.INVALID_BODY, 'invalid request body', {
          formErrors: flat.formErrors,
          fieldErrors: flat.fieldErrors,
        });
      }
      const { token, platform } = parsed.data;
      await this.repo.upsert(userId, token, platform ?? null);
      return { statusCode: 204, body: {} };
    } catch (err) {
      if (err instanceof UnauthorizedError || err instanceof BadRequestError) {
        return { statusCode: err.statusCode, body: { error: err.code, details: err.details } };
      }
      console.error('[register_push_token_error]', (err as Error).message);
      const serverErr = new ServerError();
      return { statusCode: serverErr.statusCode, body: { error: serverErr.code } };
    }
  }
}

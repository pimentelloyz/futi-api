import { z } from 'zod';

import { Controller, HttpRequest, HttpResponse } from '../protocols/http.js';
import { UnauthorizedError, BadRequestError, ServerError } from '../errors/http-errors.js';
import { prisma } from '../../infra/prisma/client.js';

const schema = z.object({
  token: z.string().min(10).max(512),
  platform: z.enum(['ios', 'android', 'web']).optional(),
});

export class RegisterPushTokenController implements Controller {
  async handle(request: HttpRequest & { user?: { id: string } }): Promise<HttpResponse> {
    try {
      const userId = request.user?.id;
      if (!userId) throw new UnauthorizedError();
      const parsed = schema.safeParse(request.body);
      if (!parsed.success) {
        const flat = parsed.error.flatten();
        throw new BadRequestError('invalid_body', 'invalid request body', {
          formErrors: flat.formErrors,
          fieldErrors: flat.fieldErrors,
        });
      }
      const { token, platform } = parsed.data;
      await prisma.userPushToken.upsert({
        where: { userId_token: { userId, token } },
        update: { platform: platform ?? null },
        create: { userId, token, platform: platform ?? null },
      });
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

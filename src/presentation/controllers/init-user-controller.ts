import { z } from 'zod';

import { Controller, HttpRequest, HttpResponse } from '../protocols/http.js';
import { BadRequestError, UnauthorizedError } from '../errors/http-errors.js';
import { verifyIdToken } from '../../infra/firebase/admin.js';
import { PrismaUserRepository } from '../../infra/repositories/prisma-user-repository.js';
import { DbEnsureUser } from '../../data/usecases/db-ensure-user.js';

const schema = z.object({ idToken: z.string().min(10), role: z.enum(['PLAYER']).optional() });

export class InitUserController implements Controller {
  async handle(request: HttpRequest): Promise<HttpResponse> {
    const parsed = schema.safeParse(request.body);
    if (!parsed.success) {
      const flat = parsed.error.flatten();
      throw new BadRequestError('invalid_body', 'invalid request body', {
        formErrors: flat.formErrors,
        fieldErrors: flat.fieldErrors,
      });
    }
    try {
      const decoded = await verifyIdToken(parsed.data.idToken);
      if (!decoded || !decoded.uid)
        throw new UnauthorizedError('invalid_token', 'invalid firebase token');

      const userRepo = new PrismaUserRepository();
      const ensureUser = new DbEnsureUser(userRepo);
      const user = await ensureUser.ensure({
        firebaseUid: decoded.uid,
        email: decoded.email ?? null,
        displayName: decoded.name ?? null,
      });

      let playerId: string | null = null;
      if (parsed.data.role === 'PLAYER') {
        const { PrismaPlayerRepository } = await import(
          '../../infra/repositories/prisma-player-repository.js'
        );
        const { DbEnsurePlayerForUser } = await import(
          '../../data/usecases/db-ensure-player-for-user.js'
        );
        const playerRepo = new PrismaPlayerRepository();
        const ensurePlayer = new DbEnsurePlayerForUser(playerRepo);
        const defaultName =
          decoded.name || (decoded.email ? decoded.email.split('@')[0] : 'Player');
        const res = await ensurePlayer.ensure({ userId: user.id, name: defaultName });
        playerId = res.id;
      }

      return {
        statusCode: 200,
        body: {
          id: user.id,
          firebaseUid: user.firebaseUid,
          email: decoded.email ?? null,
          displayName: decoded.name ?? null,
          playerId,
        },
      };
    } catch (err) {
      if (err instanceof BadRequestError || err instanceof UnauthorizedError) {
        return { statusCode: err.statusCode, body: { error: err.code, details: err.details } };
      }
      return { statusCode: 500, body: { error: 'internal_error' } };
    }
  }
}

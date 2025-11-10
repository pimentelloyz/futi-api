import { z } from 'zod';

import { Controller, HttpRequest, HttpResponse } from '../protocols/http.js';
import { verifyIdToken } from '../../infra/firebase/admin.js';
import { PrismaUserRepository } from '../../infra/repositories/prisma-user-repository.js';
import { DbEnsureUser } from '../../data/usecases/db-ensure-user.js';

const schema = z.object({ idToken: z.string().min(10), role: z.enum(['PLAYER']).optional() });

export class InitUserController implements Controller {
  async handle(request: HttpRequest): Promise<HttpResponse> {
    const parsed = schema.safeParse(request.body);
    if (!parsed.success) return { statusCode: 400, body: { error: 'invalid_request' } };
    try {
      const decoded = await verifyIdToken(parsed.data.idToken);
      if (!decoded || !decoded.uid) return { statusCode: 401, body: { error: 'invalid_token' } };

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
    } catch {
      return { statusCode: 401, body: { error: 'invalid_token' } };
    }
  }
}

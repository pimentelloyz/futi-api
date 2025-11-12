import { z } from 'zod';

import { verifyIdToken } from '../../infra/firebase/admin.js';
import { DbEnsureUser } from '../../data/usecases/db-ensure-user.js';
import { PrismaUserRepository } from '../../infra/repositories/prisma-user-repository.js';
import { IssueTokensUseCase } from '../../data/usecases/issue-tokens.js';
import { PrismaRefreshTokenRepository } from '../../infra/repositories/prisma-refresh-token-repository.js';
import { Controller, HttpRequest, HttpResponse } from '../protocols/http.js';
import { BadRequestError, UnauthorizedError, ServerError } from '../errors/http-errors.js';

const schema = z.object({ idToken: z.string().min(10), role: z.enum(['PLAYER']).optional() });

export class ExchangeFirebaseTokenController implements Controller {
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
      if (!decoded || !decoded.uid) {
        throw new UnauthorizedError('invalid_token', 'invalid firebase token');
      }
      const userRepo = new PrismaUserRepository();
      const ensureUser = new DbEnsureUser(userRepo);
      const user = await ensureUser.ensure({
        firebaseUid: decoded.uid,
        email: decoded.email ?? null,
        displayName: decoded.name ?? null,
      });
      // Se role=PLAYER, garantir criação do Player vinculado caso não exista
      if (parsed.data.role === 'PLAYER') {
        const { PrismaPlayerRepository } = await import(
          '../../infra/repositories/prisma-player-repository.js'
        );
        const { DbEnsurePlayerForUser } = await import(
          '../../data/usecases/db-ensure-player-for-user.js'
        );
        const playerRepo = new PrismaPlayerRepository();
        const ensurePlayer = new DbEnsurePlayerForUser(playerRepo);
        // Nome default: displayName/email/localpart; sem times inicialmente
        const defaultName =
          decoded.name || (decoded.email ? decoded.email.split('@')[0] : 'Player');
        await ensurePlayer.ensure({ userId: user.id, name: defaultName });
      }
      // Issue access + refresh
      const refreshRepo = new PrismaRefreshTokenRepository();
      const issueTokens = new IssueTokensUseCase(refreshRepo);
      const { accessToken, refreshToken } = await issueTokens.issue({
        userId: user.id,
        firebaseUid: decoded.uid,
      });
      // Também setamos o refreshToken em cookie HttpOnly
      const isProd = process.env.NODE_ENV === 'production';
      const resp: HttpResponse<{ accessToken: string; refreshToken: string }> = {
        statusCode: 200,
        body: { accessToken, refreshToken },
        setCookie: {
          name: 'refreshToken',
          value: refreshToken,
          options: {
            httpOnly: true,
            sameSite: isProd ? 'strict' : 'lax',
            secure: isProd,
            path: '/api/auth',
            maxAge: 60 * 60 * 24 * 30,
          },
        },
      };
      return resp;
    } catch (e: unknown) {
      if (e instanceof BadRequestError || e instanceof UnauthorizedError) {
        return { statusCode: e.statusCode, body: { error: e.code, details: e.details } };
      }
      const message = (e as Error).message;
      if (message === 'firebase_verify_failed') {
        return { statusCode: 401, body: { error: 'invalid_token' } };
      }
      console.error('[firebase_exchange_error]', {
        errorMessage: message,
        stack: (e as Error).stack,
        env: {
          FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID?.slice(0, 20),
          FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL?.slice(0, 30),
          FIREBASE_PRIVATE_KEY_PRESENT: Boolean(process.env.FIREBASE_PRIVATE_KEY),
        },
      });
      const serverErr = new ServerError(
        500,
        'firebase_config_error',
        'firebase configuration error',
      );
      return { statusCode: serverErr.statusCode, body: { error: serverErr.code } };
    }
  }
}

import { z } from 'zod';

import { verifyIdToken } from '../../infra/firebase/admin.js';
import { DbEnsureUser } from '../../data/usecases/db-ensure-user.js';
import { PrismaUserRepository } from '../../infra/repositories/prisma-user-repository.js';
import { IssueTokensUseCase } from '../../data/usecases/issue-tokens.js';
import { PrismaRefreshTokenRepository } from '../../infra/repositories/prisma-refresh-token-repository.js';
import { PrismaAccessMembershipRepository } from '../../infra/repositories/prisma-access-membership-repository.js';
import { Controller, HttpRequest, HttpResponse } from '../protocols/http.js';

// Apenas idToken; sem role=PLAYER aqui porque é exclusivo para painel administrativo.
const schema = z.object({ idToken: z.string().min(10) });

export class ExchangeFirebaseAdminTokenController implements Controller {
  async handle(request: HttpRequest): Promise<HttpResponse> {
    const parsed = schema.safeParse(request.body);
    if (!parsed.success) {
      return { statusCode: 400, body: { error: 'invalid_request' } };
    }
    try {
      const decoded = await verifyIdToken(parsed.data.idToken);
      if (!decoded || !decoded.uid) {
        return { statusCode: 401, body: { error: 'invalid_token' } };
      }
      const userRepo = new PrismaUserRepository();
      const ensureUser = new DbEnsureUser(userRepo);
      const user = await ensureUser.ensure({
        firebaseUid: decoded.uid,
        email: decoded.email ?? null,
        displayName: decoded.name ?? null,
      });

      // Verificar se usuário possui ALGUMA das roles administrativas (ADMIN, MANAGER, ASSISTANT)
      const membershipRepo = new PrismaAccessMembershipRepository();
      const hasAdmin = await membershipRepo.hasRole(user.id, 'ADMIN');
      const hasManager = await membershipRepo.hasRole(user.id, 'MANAGER');
      const hasAssistant = await membershipRepo.hasRole(user.id, 'ASSISTANT');
      if (!hasAdmin && !hasManager && !hasAssistant) {
        return { statusCode: 403, body: { error: 'not_authorized' } };
      }

      // Emitir tokens internos
      const refreshRepo = new PrismaRefreshTokenRepository();
      const issueTokens = new IssueTokensUseCase(refreshRepo);
      const { accessToken, refreshToken } = await issueTokens.issue({
        userId: user.id,
        firebaseUid: decoded.uid,
      });
      const isProd = process.env.NODE_ENV === 'production';
      return {
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
    } catch (e: unknown) {
      const message = (e as Error).message;
      if (message === 'firebase_verify_failed') {
        return { statusCode: 401, body: { error: 'invalid_token' } };
      }
      console.error('[firebase_exchange_admin_error]', {
        errorMessage: message,
        stack: (e as Error).stack,
        env: {
          FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID?.slice(0, 20),
          FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL?.slice(0, 30),
          FIREBASE_PRIVATE_KEY_PRESENT: Boolean(process.env.FIREBASE_PRIVATE_KEY),
        },
      });
      return { statusCode: 500, body: { error: 'firebase_config_error' } };
    }
  }
}

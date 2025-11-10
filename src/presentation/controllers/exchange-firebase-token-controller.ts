import { z } from 'zod';

import { verifyIdToken } from '../../infra/firebase/admin.js';
import { DbEnsureUser } from '../../data/usecases/db-ensure-user.js';
import { PrismaUserRepository } from '../../infra/repositories/prisma-user-repository.js';
import { IssueTokensUseCase } from '../../data/usecases/issue-tokens.js';
import { PrismaRefreshTokenRepository } from '../../infra/repositories/prisma-refresh-token-repository.js';
import { Controller, HttpRequest, HttpResponse } from '../protocols/http.js';

const schema = z.object({ idToken: z.string().min(10) });

export class ExchangeFirebaseTokenController implements Controller {
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
      const repo = new PrismaUserRepository();
      const ensureUser = new DbEnsureUser(repo);
      const user = await ensureUser.ensure({
        firebaseUid: decoded.uid,
        email: decoded.email ?? null,
        displayName: decoded.name ?? null,
      });
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
    } catch {
      return { statusCode: 401, body: { error: 'invalid_token' } };
    }
  }
}

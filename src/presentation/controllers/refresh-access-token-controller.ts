import { z } from 'zod';

import { Controller, HttpRequest, HttpResponse } from '../protocols/http.js';
import { BadRequestError } from '../errors/http-errors.js';
import { PrismaRefreshTokenRepository } from '../../infra/repositories/prisma-refresh-token-repository.js';
import { RefreshAccessTokenUseCase } from '../../data/usecases/refresh-access-token.js';

const schema = z.object({ refreshToken: z.string().min(20) });

export class RefreshAccessTokenController implements Controller {
  async handle(request: HttpRequest): Promise<HttpResponse> {
    try {
      let incomingRefresh: string | undefined;
      // Permitir via corpo ou (fallback) campo injected de cookie
      if (request.body && typeof request.body === 'object') {
        const parsedBody = schema.safeParse(request.body);
        if (parsedBody.success) incomingRefresh = parsedBody.data.refreshToken;
      }
      if (!incomingRefresh && typeof request.cookies?.refreshToken === 'string') {
        const candidate = request.cookies.refreshToken as string;
        if (candidate.length >= 20) incomingRefresh = candidate;
      }
      if (!incomingRefresh) throw new BadRequestError('invalid_request');
      const repo = new PrismaRefreshTokenRepository();
      const usecase = new RefreshAccessTokenUseCase(repo);
      const result = await usecase.refresh(incomingRefresh);
      if (!result) return { statusCode: 401, body: { error: 'invalid_refresh' } };
      const isProd = process.env.NODE_ENV === 'production';
      return {
        statusCode: 200,
        body: result,
        setCookie: {
          name: 'refreshToken',
          value: result.refreshToken,
          options: {
            httpOnly: true,
            sameSite: isProd ? 'strict' : 'lax',
            secure: isProd,
            path: '/api/auth',
            maxAge: 60 * 60 * 24 * 30,
          },
        },
      };
    } catch (err) {
      if (err instanceof BadRequestError)
        return { statusCode: err.statusCode, body: { error: err.code } };
      return { statusCode: 500, body: { error: 'internal_error' } };
    }
  }
}

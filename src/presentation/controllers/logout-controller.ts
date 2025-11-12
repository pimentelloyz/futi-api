import { Controller, HttpRequest, HttpResponse } from '../protocols/http.js';
import { BadRequestError, UnauthorizedError } from '../errors/http-errors.js';
import { PrismaRefreshTokenRepository } from '../../infra/repositories/prisma-refresh-token-repository.js';
import { refreshTokenService } from '../../infra/security/refresh-token-service.js';

export class LogoutController implements Controller {
  async handle(request: HttpRequest): Promise<HttpResponse> {
    const tokenBody =
      typeof request.body === 'object' && request.body !== null
        ? (request.body as Record<string, unknown>).refreshToken
        : undefined;
    const tokenCookie =
      typeof request.cookies?.refreshToken === 'string'
        ? (request.cookies?.refreshToken as string)
        : undefined;
    const token = (tokenCookie as string | undefined) || (tokenBody as string | undefined);
    if (!token)
      throw new BadRequestError('invalid_request', 'refreshToken required in body or cookie');
    const repo = new PrismaRefreshTokenRepository();
    const hash = refreshTokenService.hash(token);
    try {
      const rec = await repo.findByHash(hash);
      if (rec && !rec.revokedAt) {
        await repo.revokeById(rec.id);
      }
      return {
        statusCode: 200,
        body: { ok: true },
        clearCookie: { name: 'refreshToken', options: { path: '/api/auth' } },
      };
    } catch (err) {
      if (err instanceof BadRequestError) {
        return { statusCode: err.statusCode, body: { error: err.code, details: err.details } };
      }
      return { statusCode: 500, body: { error: 'internal_error' } };
    }
  }
}

export class LogoutAllController implements Controller {
  async handle(request: HttpRequest & { user?: { id: string } }): Promise<HttpResponse> {
    const userId = request.user?.id;
    if (!userId) throw new UnauthorizedError();
    try {
      const repo = new PrismaRefreshTokenRepository();
      await repo.revokeAllForUser?.(userId);
      return {
        statusCode: 200,
        body: { ok: true },
        clearCookie: { name: 'refreshToken', options: { path: '/api/auth' } },
      };
    } catch (err) {
      if (err instanceof UnauthorizedError) {
        return { statusCode: err.statusCode, body: { error: err.code } };
      }
      return { statusCode: 500, body: { error: 'internal_error' } };
    }
  }
}

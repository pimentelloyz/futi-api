import { jwtService } from '../../infra/security/jwt-service.js';
import { RefreshTokenRepository } from '../protocols/refresh-token-repository.js';
import { refreshTokenService } from '../../infra/security/refresh-token-service.js';
import { getEnv } from '../../main/config/env.js';

export interface IssueTokensInput {
  userId: string;
  firebaseUid: string;
}

export class IssueTokensUseCase {
  constructor(private readonly refreshRepo: RefreshTokenRepository) {}

  async issue(input: IssueTokensInput): Promise<{ accessToken: string; refreshToken: string }> {
    // Access token short-lived (15m). Could be configurable later.
    const accessToken = jwtService.sign({ sub: input.userId, uid: input.firebaseUid }, '15m');
    // Refresh token TTL (default 30 days) configurable via env REFRESH_TOKEN_TTL_DAYS
    const { REFRESH_TOKEN_TTL_DAYS } = getEnv() as unknown as { REFRESH_TOKEN_TTL_DAYS?: string };
    const days = Number(REFRESH_TOKEN_TTL_DAYS) > 0 ? Number(REFRESH_TOKEN_TTL_DAYS) : 30;
    const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    const raw = refreshTokenService.generateRaw();
    const hash = refreshTokenService.hash(raw);
    await this.refreshRepo.create(input.userId, hash, expiresAt);
    return { accessToken, refreshToken: raw };
  }
}

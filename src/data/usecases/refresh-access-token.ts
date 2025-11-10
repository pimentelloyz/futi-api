import { RefreshTokenRepository } from '../protocols/refresh-token-repository.js';
import { refreshTokenService } from '../../infra/security/refresh-token-service.js';
import { jwtService } from '../../infra/security/jwt-service.js';
import { getEnv } from '../../main/config/env.js';
import { prisma } from '../../infra/prisma/client.js';

export class RefreshAccessTokenUseCase {
  constructor(private readonly refreshRepo: RefreshTokenRepository) {}

  async refresh(
    rawRefreshToken: string,
  ): Promise<{ accessToken: string; refreshToken: string } | null> {
    if (!rawRefreshToken || rawRefreshToken.length < 20) return null;
    const hash = refreshTokenService.hash(rawRefreshToken);
    const record = await this.refreshRepo.findByHash(hash);
    if (!record) return null;
    if (record.revokedAt) return null;
    if (record.expiresAt.getTime() < Date.now()) return null;
    // rotate: revoke old and create new
    await this.refreshRepo.revokeById(record.id);
    const { REFRESH_TOKEN_TTL_DAYS } = getEnv() as unknown as { REFRESH_TOKEN_TTL_DAYS?: string };
    const days = Number(REFRESH_TOKEN_TTL_DAYS) > 0 ? Number(REFRESH_TOKEN_TTL_DAYS) : 30;
    const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    const newRaw = refreshTokenService.generateRaw();
    const newHash = refreshTokenService.hash(newRaw);
    await this.refreshRepo.create(record.userId, newHash, expiresAt);
    const user = await prisma.user.findUnique({
      where: { id: record.userId },
      select: { firebaseUid: true },
    });
    const accessToken = jwtService.sign(
      { sub: record.userId, uid: user?.firebaseUid ?? '' },
      '15m',
    );
    // NOTE: We don't have firebase uid stored in refresh token row; for now payload uses userId only.
    // In future we could embed uid into tokenHash encoding or store firebaseUid in RefreshToken table.
    return { accessToken, refreshToken: newRaw };
  }
}

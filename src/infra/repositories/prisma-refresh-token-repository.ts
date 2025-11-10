import { prisma } from '../prisma/client.js';
import {
  RefreshTokenRepository,
  RefreshTokenRecord,
} from '../../data/protocols/refresh-token-repository.js';

export class PrismaRefreshTokenRepository implements RefreshTokenRepository {
  async create(userId: string, tokenHash: string, expiresAt: Date): Promise<RefreshTokenRecord> {
    const rec = await prisma.refreshToken.create({
      data: { userId, tokenHash, expiresAt },
    });
    return rec as RefreshTokenRecord;
  }
  async findByHash(tokenHash: string): Promise<RefreshTokenRecord | null> {
    const rec = await prisma.refreshToken.findUnique({ where: { tokenHash } });
    return (rec as RefreshTokenRecord) || null;
  }
  async revokeById(id: string, revokedAt: Date = new Date()): Promise<void> {
    await prisma.refreshToken.update({ where: { id }, data: { revokedAt } });
  }
  async revokeAllForUser(userId: string): Promise<void> {
    await prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
}

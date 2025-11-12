import { prisma } from '../prisma/client.js';
import type { PushTokenRepository } from '../../data/protocols/push-token-repository.js';

export class PrismaPushTokenRepository implements PushTokenRepository {
  async upsert(userId: string, token: string, platform: string | null): Promise<void> {
    await prisma.userPushToken.upsert({
      where: { userId_token: { userId, token } },
      update: { platform },
      create: { userId, token, platform },
    });
  }
}

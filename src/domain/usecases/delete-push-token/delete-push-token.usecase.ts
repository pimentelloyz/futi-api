import { PrismaClient } from '@prisma/client';

import { PushTokenService } from '../../services/push-token.service.js';

import type {
  DeletePushTokenInput,
  DeletePushTokenOutput,
  DeleteAllPushTokensOutput,
} from './delete-push-token.dto.js';

export class DeletePushTokenUseCase {
  private pushTokenService: PushTokenService;

  constructor(private readonly prisma: PrismaClient) {
    this.pushTokenService = new PushTokenService(prisma);
  }

  /**
   * Deletar um token específico do usuário
   * Usado quando usuário faz logout em um dispositivo
   */
  async execute(userId: string, input: DeletePushTokenInput): Promise<DeletePushTokenOutput> {
    const deleted = await this.pushTokenService.deleteToken({
      userId,
      token: input.token,
    });

    return { success: deleted };
  }

  /**
   * Deletar todos os tokens do usuário
   * Usado quando usuário faz logout em todos os dispositivos ou deleta conta
   */
  async deleteAll(userId: string): Promise<DeleteAllPushTokensOutput> {
    const tokensDeleted = await this.pushTokenService.deleteAllUserTokens(userId);

    return {
      success: true,
      tokensDeleted,
    };
  }
}

import { PrismaClient } from '@prisma/client';

export interface SaveTokenInput {
  userId: string;
  token: string;
  platform: 'ios' | 'android' | 'web';
}

export interface DeleteTokenInput {
  userId: string;
  token: string;
}

/**
 * Serviço para gerenciar tokens de push notification
 */
export class PushTokenService {
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Salvar ou atualizar token FCM do usuário
   * Se o token já existir, apenas atualiza o timestamp
   */
  async saveToken(input: SaveTokenInput): Promise<void> {
    const { userId, token, platform } = input;

    await this.prisma.userPushToken.upsert({
      where: {
        userId_token: {
          userId,
          token,
        },
      },
      create: {
        userId,
        token,
        platform,
      },
      update: {
        platform,
        createdAt: new Date(), // Atualiza timestamp para saber que token está ativo
      },
    });
  }

  /**
   * Deletar token específico de um usuário
   * Útil quando usuário faz logout ou desinstala o app
   */
  async deleteToken(input: DeleteTokenInput): Promise<boolean> {
    const { userId, token } = input;

    const result = await this.prisma.userPushToken.deleteMany({
      where: {
        userId,
        token,
      },
    });

    return result.count > 0;
  }

  /**
   * Deletar todos os tokens de um usuário
   * Útil quando usuário deleta a conta
   */
  async deleteAllUserTokens(userId: string): Promise<number> {
    const result = await this.prisma.userPushToken.deleteMany({
      where: { userId },
    });

    return result.count;
  }

  /**
   * Buscar todos os tokens ativos de um usuário
   */
  async getUserTokens(userId: string): Promise<string[]> {
    const tokens = await this.prisma.userPushToken.findMany({
      where: { userId },
      select: { token: true },
    });

    return tokens.map((t) => t.token);
  }

  /**
   * Buscar todos os tokens de múltiplos usuários
   * Usado para enviar notificações em batch
   */
  async getTokensForUsers(userIds: string[]): Promise<Map<string, string[]>> {
    const tokens = await this.prisma.userPushToken.findMany({
      where: {
        userId: {
          in: userIds,
        },
      },
      select: {
        userId: true,
        token: true,
      },
    });

    // Agrupar tokens por userId
    const tokensMap = new Map<string, string[]>();

    for (const item of tokens) {
      const userTokens = tokensMap.get(item.userId) || [];
      userTokens.push(item.token);
      tokensMap.set(item.userId, userTokens);
    }

    return tokensMap;
  }

  /**
   * Deletar tokens inválidos ou expirados
   * Tokens que o Firebase retornou erro ao enviar
   */
  async deleteInvalidTokens(tokens: string[]): Promise<number> {
    if (tokens.length === 0) return 0;

    const result = await this.prisma.userPushToken.deleteMany({
      where: {
        token: {
          in: tokens,
        },
      },
    });

    return result.count;
  }

  /**
   * Limpar tokens antigos (mais de 90 dias sem atualizar)
   * Útil para rodar em cron job
   */
  async cleanupOldTokens(daysOld: number = 90): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await this.prisma.userPushToken.deleteMany({
      where: {
        createdAt: {
          lt: cutoffDate,
        },
      },
    });

    return result.count;
  }

  /**
   * Contar quantos tokens um usuário tem
   */
  async countUserTokens(userId: string): Promise<number> {
    return this.prisma.userPushToken.count({
      where: { userId },
    });
  }

  /**
   * Verificar se um token existe
   */
  async tokenExists(userId: string, token: string): Promise<boolean> {
    const count = await this.prisma.userPushToken.count({
      where: {
        userId,
        token,
      },
    });

    return count > 0;
  }
}

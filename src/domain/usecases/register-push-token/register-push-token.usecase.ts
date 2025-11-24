import { PrismaClient } from '@prisma/client';

import type { RegisterPushTokenInput, RegisterPushTokenOutput } from './register-push-token.dto.js';

export class RegisterPushTokenUseCase {
  constructor(private readonly prisma: PrismaClient) {}

  async execute(input: RegisterPushTokenInput): Promise<RegisterPushTokenOutput> {
    try {
      // Upsert: cria ou atualiza se já existir
      await this.prisma.userPushToken.upsert({
        where: {
          userId_token: {
            userId: input.userId,
            token: input.token,
          },
        },
        create: {
          userId: input.userId,
          token: input.token,
          platform: input.platform || null,
        },
        update: {
          platform: input.platform || null,
        },
      });

      return {
        success: true,
        message: 'Push token registrado com sucesso',
      };
    } catch (error) {
      console.error('Erro ao registrar push token:', error);
      return {
        success: false,
        message: 'Erro ao registrar push token',
      };
    }
  }
}

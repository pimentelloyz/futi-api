import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

import { DeletePushTokenUseCase } from '../../domain/usecases/delete-push-token/delete-push-token.usecase.js';
import { deletePushTokenSchema } from '../../domain/usecases/delete-push-token/delete-push-token.dto.js';

/**
 * DELETE /api/users/push-tokens
 * Deletar token FCM específico
 */
export class DeletePushTokenController {
  private useCase: DeletePushTokenUseCase;

  constructor(private readonly prisma: PrismaClient) {
    this.useCase = new DeletePushTokenUseCase(prisma);
  }

  async handle(req: Request, res: Response): Promise<Response> {
    try {
      // Validar autenticação
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Não autorizado' });
      }

      // Validar body
      const validation = deletePushTokenSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          error: 'Dados inválidos',
          details: validation.error.issues,
        });
      }

      // Executar caso de uso
      const result = await this.useCase.execute(userId, validation.data);

      if (!result.success) {
        return res.status(404).json({ error: 'Token não encontrado' });
      }

      return res.status(204).send();
    } catch (error) {
      console.error('Erro ao deletar token FCM:', error);
      return res.status(500).json({ error: 'Erro ao deletar token' });
    }
  }
}

/**
 * DELETE /api/users/push-tokens/all
 * Deletar todos os tokens FCM do usuário
 */
export class DeleteAllPushTokensController {
  private useCase: DeletePushTokenUseCase;

  constructor(private readonly prisma: PrismaClient) {
    this.useCase = new DeletePushTokenUseCase(prisma);
  }

  async handle(req: Request, res: Response): Promise<Response> {
    try {
      // Validar autenticação
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Não autorizado' });
      }

      // Executar caso de uso
      const result = await this.useCase.deleteAll(userId);

      return res.status(200).json(result);
    } catch (error) {
      console.error('Erro ao deletar todos os tokens FCM:', error);
      return res.status(500).json({ error: 'Erro ao deletar tokens' });
    }
  }
}

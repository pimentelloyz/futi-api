import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

import { ManageTopicsUseCase } from '../../domain/usecases/manage-topics/manage-topics.usecase.js';
import {
  subscribeToTopicSchema,
  unsubscribeFromTopicSchema,
  sendToTopicSchema,
} from '../../domain/usecases/manage-topics/manage-topics.dto.js';

/**
 * POST /api/topics/subscribe
 * Inscrever usuário em um tópico
 */
export class SubscribeToTopicController {
  private useCase: ManageTopicsUseCase;

  constructor(private readonly prisma: PrismaClient) {
    this.useCase = new ManageTopicsUseCase(prisma);
  }

  async handle(req: Request, res: Response): Promise<Response> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Não autorizado' });
      }

      const validation = subscribeToTopicSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          error: 'Dados inválidos',
          details: validation.error.issues,
        });
      }

      const result = await this.useCase.subscribe(userId, validation.data);

      return res.status(200).json(result);
    } catch (error) {
      console.error('Erro ao inscrever em tópico:', error);
      return res.status(500).json({ error: 'Erro ao inscrever em tópico' });
    }
  }
}

/**
 * POST /api/topics/unsubscribe
 * Desinscrever usuário de um tópico
 */
export class UnsubscribeFromTopicController {
  private useCase: ManageTopicsUseCase;

  constructor(private readonly prisma: PrismaClient) {
    this.useCase = new ManageTopicsUseCase(prisma);
  }

  async handle(req: Request, res: Response): Promise<Response> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Não autorizado' });
      }

      const validation = unsubscribeFromTopicSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          error: 'Dados inválidos',
          details: validation.error.issues,
        });
      }

      const result = await this.useCase.unsubscribe(userId, validation.data);

      return res.status(200).json(result);
    } catch (error) {
      console.error('Erro ao desinscrever de tópico:', error);
      return res.status(500).json({ error: 'Erro ao desinscrever de tópico' });
    }
  }
}

/**
 * POST /api/topics/send (admin only)
 * Enviar notificação para todos os inscritos em um tópico
 */
export class SendToTopicController {
  private useCase: ManageTopicsUseCase;

  constructor(private readonly prisma: PrismaClient) {
    this.useCase = new ManageTopicsUseCase(prisma);
  }

  async handle(req: Request, res: Response): Promise<Response> {
    try {
      // TODO: Adicionar verificação de admin
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Não autorizado' });
      }

      const validation = sendToTopicSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          error: 'Dados inválidos',
          details: validation.error.issues,
        });
      }

      const result = await this.useCase.sendToTopic(validation.data);

      return res.status(200).json(result);
    } catch (error) {
      console.error('Erro ao enviar notificação para tópico:', error);
      return res.status(500).json({ error: 'Erro ao enviar notificação' });
    }
  }
}

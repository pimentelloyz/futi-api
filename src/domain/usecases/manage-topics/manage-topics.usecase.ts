import { PrismaClient } from '@prisma/client';

import { TopicService } from '../../services/topic.service.js';
import { FirebaseMessagingService } from '../../../infra/services/firebase-messaging.service.js';

import type {
  SubscribeToTopicInput,
  SubscribeToTopicOutput,
  UnsubscribeFromTopicInput,
  UnsubscribeFromTopicOutput,
  SendToTopicInput,
  SendToTopicOutput,
} from './manage-topics.dto.js';

export class ManageTopicsUseCase {
  private topicService: TopicService;

  constructor(private readonly prisma: PrismaClient) {
    const messagingService = new FirebaseMessagingService();
    this.topicService = new TopicService(messagingService, prisma);
  }

  /**
   * Inscrever usuário em um tópico
   */
  async subscribe(userId: string, input: SubscribeToTopicInput): Promise<SubscribeToTopicOutput> {
    const success = await this.topicService.subscribeToTopic({
      userId,
      topic: input.topic,
    });

    return { success };
  }

  /**
   * Desinscrever usuário de um tópico
   */
  async unsubscribe(
    userId: string,
    input: UnsubscribeFromTopicInput,
  ): Promise<UnsubscribeFromTopicOutput> {
    const success = await this.topicService.unsubscribeFromTopic({
      userId,
      topic: input.topic,
    });

    return { success };
  }

  /**
   * Enviar notificação para um tópico (admin only)
   */
  async sendToTopic(input: SendToTopicInput): Promise<SendToTopicOutput> {
    const success = await this.topicService.sendToTopic({
      topic: input.topic,
      title: input.title,
      body: input.body,
      data: input.data as Record<string, string>,
      imageUrl: input.imageUrl,
    });

    return { success };
  }

  /**
   * Inscrever usuário automaticamente quando entra em uma liga
   */
  async subscribeToLeague(userId: string, leagueId: string): Promise<boolean> {
    const topic = TopicService.getLeagueTopic(leagueId);
    return this.topicService.subscribeToTopic({ userId, topic });
  }

  /**
   * Desinscrever usuário quando sai de uma liga
   */
  async unsubscribeFromLeague(userId: string, leagueId: string): Promise<boolean> {
    const topic = TopicService.getLeagueTopic(leagueId);
    return this.topicService.unsubscribeFromTopic({ userId, topic });
  }

  /**
   * Inscrever usuário quando entra em um time
   */
  async subscribeToTeam(userId: string, teamId: string): Promise<boolean> {
    const topic = TopicService.getTeamTopic(teamId);
    return this.topicService.subscribeToTopic({ userId, topic });
  }

  /**
   * Desinscrever usuário quando sai de um time
   */
  async unsubscribeFromTeam(userId: string, teamId: string): Promise<boolean> {
    const topic = TopicService.getTeamTopic(teamId);
    return this.topicService.unsubscribeFromTopic({ userId, topic });
  }

  /**
   * Inscrever em partida (para receber atualizações em tempo real)
   */
  async subscribeToMatch(userId: string, matchId: string): Promise<boolean> {
    const topic = TopicService.getMatchTopic(matchId);
    return this.topicService.subscribeToTopic({ userId, topic });
  }
}

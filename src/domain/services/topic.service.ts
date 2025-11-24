import { PrismaClient } from '@prisma/client';

import { FirebaseMessagingService } from '../../infra/services/firebase-messaging.service.js';

export interface SubscribeToTopicInput {
  userId: string;
  topic: string;
}

export interface UnsubscribeFromTopicInput {
  userId: string;
  topic: string;
}

export interface SendToTopicInput {
  topic: string;
  title: string;
  body: string;
  data?: Record<string, string>;
  imageUrl?: string;
}

/**
 * Serviço para gerenciar tópicos (topics) do Firebase Cloud Messaging
 * Permite agrupar usuários por interesse (times, ligas, etc)
 */
export class TopicService {
  constructor(
    private readonly firebaseMessaging: FirebaseMessagingService,
    private readonly prisma: PrismaClient,
  ) {}

  /**
   * Inscrever usuário em um tópico
   * Exemplo: time_flamengo, liga_brasileirao, torneio_2024
   */
  async subscribeToTopic(input: SubscribeToTopicInput): Promise<boolean> {
    try {
      const { userId, topic } = input;

      // Buscar todos os tokens do usuário
      const userTokens = await this.prisma.userPushToken.findMany({
        where: { userId },
        select: { token: true },
      });

      if (userTokens.length === 0) {
        console.log(`⚠️ Usuário ${userId} não tem tokens para inscrever no tópico ${topic}`);
        return false;
      }

      const tokens = userTokens.map((t) => t.token);

      // Inscrever todos os tokens no tópico
      await this.firebaseMessaging.subscribeToTopic(tokens, topic);

      console.log(`✅ ${tokens.length} dispositivos inscritos no tópico ${topic}`);
      return true;
    } catch (error) {
      console.error('Erro ao inscrever em tópico:', error);
      return false;
    }
  }

  /**
   * Desinscrever usuário de um tópico
   */
  async unsubscribeFromTopic(input: UnsubscribeFromTopicInput): Promise<boolean> {
    try {
      const { userId, topic } = input;

      // Buscar todos os tokens do usuário
      const userTokens = await this.prisma.userPushToken.findMany({
        where: { userId },
        select: { token: true },
      });

      if (userTokens.length === 0) {
        return false;
      }

      const tokens = userTokens.map((t) => t.token);

      // Desinscrever todos os tokens do tópico
      await this.firebaseMessaging.unsubscribeFromTopic(tokens, topic);

      console.log(`✅ ${tokens.length} dispositivos desinscrito do tópico ${topic}`);
      return true;
    } catch (error) {
      console.error('Erro ao desinscrever de tópico:', error);
      return false;
    }
  }

  /**
   * Inscrever múltiplos usuários em um tópico
   * Usado quando usuário entra em uma liga ou time
   */
  async subscribeUsersToTopic(userIds: string[], topic: string): Promise<number> {
    let subscribedCount = 0;

    for (const userId of userIds) {
      const success = await this.subscribeToTopic({ userId, topic });
      if (success) subscribedCount++;
    }

    return subscribedCount;
  }

  /**
   * Enviar notificação para um tópico
   * Todos os usuários inscritos no tópico receberão
   */
  async sendToTopic(input: SendToTopicInput): Promise<boolean> {
    try {
      const { topic, title, body, data, imageUrl } = input;

      await this.firebaseMessaging.sendToTopic(topic, {
        title,
        body,
        data,
        imageUrl,
      });

      console.log(`✅ Notificação enviada para tópico ${topic}`);
      return true;
    } catch (error) {
      console.error('Erro ao enviar para tópico:', error);
      return false;
    }
  }

  /**
   * Gerar nome de tópico para time
   * Exemplo: team_cm3w7abc123
   */
  static getTeamTopic(teamId: string): string {
    return `team_${teamId}`;
  }

  /**
   * Gerar nome de tópico para liga
   * Exemplo: league_cm3w5xyz789
   */
  static getLeagueTopic(leagueId: string): string {
    return `league_${leagueId}`;
  }

  /**
   * Gerar nome de tópico para partida
   * Exemplo: match_cm3w8def456
   */
  static getMatchTopic(matchId: string): string {
    return `match_${matchId}`;
  }

  /**
   * Gerar nome de tópico para torneio
   * Exemplo: tournament_cm3w9ghi789
   */
  static getTournamentTopic(tournamentId: string): string {
    return `tournament_${tournamentId}`;
  }
}

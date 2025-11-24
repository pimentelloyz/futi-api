import {
  FirebaseMessagingService,
  NotificationPayload,
} from '../../infra/services/firebase-messaging.service.js';

import { PushTokenService } from './push-token.service.js';

export interface SendNotificationToUserInput {
  userId: string;
  title: string;
  body: string;
  data?: Record<string, string>;
  imageUrl?: string;
}

export interface SendNotificationToUsersInput {
  userIds: string[];
  title: string;
  body: string;
  data?: Record<string, string>;
  imageUrl?: string;
}

export interface NotificationResult {
  successCount: number;
  failureCount: number;
  invalidTokens: string[];
}

/**
 * Serviço de alto nível para envio de notificações
 * Gerencia tokens, envia notificações e limpa tokens inválidos
 */
export class NotificationService {
  constructor(
    private readonly firebaseMessaging: FirebaseMessagingService,
    private readonly pushTokenService: PushTokenService,
  ) {}

  /**
   * Enviar notificação para um único usuário
   * Busca todos os tokens do usuário e envia para todos os dispositivos
   */
  async sendToUser(input: SendNotificationToUserInput): Promise<NotificationResult> {
    const { userId, title, body, data, imageUrl } = input;

    // Buscar tokens do usuário
    const tokens = await this.pushTokenService.getUserTokens(userId);

    if (tokens.length === 0) {
      return {
        successCount: 0,
        failureCount: 0,
        invalidTokens: [],
      };
    }

    const payload: NotificationPayload = {
      title,
      body,
      data,
      imageUrl,
    };

    // Enviar para todos os dispositivos do usuário
    const result = await this.firebaseMessaging.sendToMultipleTokens(tokens, payload);

    // Limpar tokens inválidos
    if (result.invalidTokens.length > 0) {
      await this.pushTokenService.deleteInvalidTokens(result.invalidTokens);
    }

    return result;
  }

  /**
   * Enviar notificação para múltiplos usuários
   * Agrupa tokens de todos os usuários e envia em batch
   */
  async sendToUsers(input: SendNotificationToUsersInput): Promise<NotificationResult> {
    const { userIds, title, body, data, imageUrl } = input;

    // Buscar tokens de todos os usuários
    const tokensMap = await this.pushTokenService.getTokensForUsers(userIds);

    // Agrupar todos os tokens em um array único
    const allTokens: string[] = [];
    for (const tokens of tokensMap.values()) {
      allTokens.push(...tokens);
    }

    if (allTokens.length === 0) {
      return {
        successCount: 0,
        failureCount: 0,
        invalidTokens: [],
      };
    }

    const payload: NotificationPayload = {
      title,
      body,
      data,
      imageUrl,
    };

    // Enviar para todos os dispositivos
    const result = await this.firebaseMessaging.sendToMultipleTokens(allTokens, payload);

    // Limpar tokens inválidos
    if (result.invalidTokens.length > 0) {
      await this.pushTokenService.deleteInvalidTokens(result.invalidTokens);
    }

    return result;
  }

  /**
   * Enviar notificação de gol
   * Formato específico para notificação de gol com emoji
   */
  async sendGoalNotification(input: {
    userIds: string[];
    playerName: string;
    homeTeam: string;
    awayTeam: string;
    homeScore: number;
    awayScore: number;
    minute: number;
    matchId: string;
    leagueId: string;
  }): Promise<NotificationResult> {
    const {
      userIds,
      playerName,
      homeTeam,
      awayTeam,
      homeScore,
      awayScore,
      minute,
      matchId,
      leagueId,
    } = input;

    return this.sendToUsers({
      userIds,
      title: `⚽ GOOOL! ${playerName}`,
      body: `${homeTeam} ${homeScore} x ${awayScore} ${awayTeam} • ${minute}'`,
      data: {
        type: 'goal',
        matchId,
        leagueId,
        playerName,
        minute: minute.toString(),
      },
    });
  }

  /**
   * Enviar notificação de início de partida
   */
  async sendMatchStartNotification(input: {
    userIds: string[];
    homeTeam: string;
    awayTeam: string;
    matchId: string;
    leagueId: string;
    scheduledTime: Date;
  }): Promise<NotificationResult> {
    const { userIds, homeTeam, awayTeam, matchId, leagueId, scheduledTime } = input;

    const timeStr = scheduledTime.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });

    return this.sendToUsers({
      userIds,
      title: '🏁 Partida começando!',
      body: `${homeTeam} x ${awayTeam} • ${timeStr}`,
      data: {
        type: 'match_start',
        matchId,
        leagueId,
      },
    });
  }

  /**
   * Enviar notificação de fim de partida
   */
  async sendMatchEndNotification(input: {
    userIds: string[];
    homeTeam: string;
    awayTeam: string;
    homeScore: number;
    awayScore: number;
    matchId: string;
    leagueId: string;
  }): Promise<NotificationResult> {
    const { userIds, homeTeam, awayTeam, homeScore, awayScore, matchId, leagueId } = input;

    return this.sendToUsers({
      userIds,
      title: '🏆 Partida finalizada!',
      body: `${homeTeam} ${homeScore} x ${awayScore} ${awayTeam}`,
      data: {
        type: 'match_end',
        matchId,
        leagueId,
      },
    });
  }

  /**
   * Enviar notificação de cartão vermelho
   */
  async sendRedCardNotification(input: {
    userIds: string[];
    playerName: string;
    teamName: string;
    minute: number;
    matchId: string;
    leagueId: string;
  }): Promise<NotificationResult> {
    const { userIds, playerName, teamName, minute, matchId, leagueId } = input;

    return this.sendToUsers({
      userIds,
      title: '🟥 Cartão vermelho!',
      body: `${playerName} (${teamName}) expulso aos ${minute}'`,
      data: {
        type: 'red_card',
        matchId,
        leagueId,
        playerName,
        minute: minute.toString(),
      },
    });
  }

  /**
   * Enviar notificação personalizada
   */
  async sendCustomNotification(input: {
    userIds: string[];
    title: string;
    body: string;
    type: string;
    data?: Record<string, string>;
  }): Promise<NotificationResult> {
    const { userIds, title, body, type, data = {} } = input;

    return this.sendToUsers({
      userIds,
      title,
      body,
      data: {
        type,
        ...data,
      },
    });
  }
}

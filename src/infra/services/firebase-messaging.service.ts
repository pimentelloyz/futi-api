import admin from 'firebase-admin';

export interface NotificationPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
  imageUrl?: string;
}

// Alias para compatibilidade
export type PushNotificationPayload = NotificationPayload;

export class FirebaseMessagingService {
  async sendToToken(token: string, payload: PushNotificationPayload): Promise<void> {
    try {
      await admin.messaging().send({
        token,
        notification: {
          title: payload.title,
          body: payload.body,
          imageUrl: payload.imageUrl,
        },
        data: payload.data,
        android: {
          priority: 'high',
          notification: {
            sound: 'default',
            channelId: 'goals', // Canal específico para gols
          },
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1,
            },
          },
        },
      });
    } catch (error) {
      console.error('Erro ao enviar notificação:', error);
      throw error;
    }
  }

  async sendToMultipleTokens(
    tokens: string[],
    payload: NotificationPayload,
  ): Promise<{ successCount: number; failureCount: number; invalidTokens: string[] }> {
    if (tokens.length === 0) {
      return { successCount: 0, failureCount: 0, invalidTokens: [] };
    }

    try {
      const message = {
        notification: {
          title: payload.title,
          body: payload.body,
          imageUrl: payload.imageUrl,
        },
        data: payload.data,
        android: {
          priority: 'high' as const,
          notification: {
            sound: 'default',
            channelId: 'goals',
          },
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1,
            },
          },
        },
      };

      let successCount = 0;
      let failureCount = 0;
      const invalidTokens: string[] = [];

      // Firebase suporta até 500 tokens por batch
      const batchSize = 500;
      for (let i = 0; i < tokens.length; i += batchSize) {
        const batch = tokens.slice(i, i + batchSize);
        const response = await admin.messaging().sendEachForMulticast({
          tokens: batch,
          ...message,
        });

        successCount += response.successCount;
        failureCount += response.failureCount;

        // Coletar tokens inválidos
        response.responses.forEach((resp, idx) => {
          if (!resp.success && resp.error) {
            const errorCode = resp.error.code;
            if (
              errorCode === 'messaging/invalid-registration-token' ||
              errorCode === 'messaging/registration-token-not-registered'
            ) {
              invalidTokens.push(batch[idx]);
            }
          }
        });
      }

      return { successCount, failureCount, invalidTokens };
    } catch (error) {
      console.error('Erro ao enviar notificações em lote:', error);
      throw error;
    }
  }

  /**
   * Inscrever tokens em um tópico
   * Exemplo: team_flamengo, league_brasileirao
   */
  async subscribeToTopic(tokens: string[], topic: string): Promise<void> {
    if (tokens.length === 0) return;

    try {
      const response = await admin.messaging().subscribeToTopic(tokens, topic);
      console.log(`✅ ${response.successCount} tokens inscritos no tópico ${topic}`);

      if (response.failureCount > 0) {
        console.warn(`⚠️ ${response.failureCount} tokens falharam ao inscrever no tópico ${topic}`);
      }
    } catch (error) {
      console.error(`Erro ao inscrever tokens no tópico ${topic}:`, error);
      throw error;
    }
  }

  /**
   * Desinscrever tokens de um tópico
   */
  async unsubscribeFromTopic(tokens: string[], topic: string): Promise<void> {
    if (tokens.length === 0) return;

    try {
      const response = await admin.messaging().unsubscribeFromTopic(tokens, topic);
      console.log(`✅ ${response.successCount} tokens desinscrito do tópico ${topic}`);

      if (response.failureCount > 0) {
        console.warn(
          `⚠️ ${response.failureCount} tokens falharam ao desinscrever do tópico ${topic}`,
        );
      }
    } catch (error) {
      console.error(`Erro ao desinscrever tokens do tópico ${topic}:`, error);
      throw error;
    }
  }

  /**
   * Enviar notificação para todos os inscritos em um tópico
   */
  async sendToTopic(topic: string, payload: NotificationPayload): Promise<void> {
    try {
      await admin.messaging().send({
        topic,
        notification: {
          title: payload.title,
          body: payload.body,
          imageUrl: payload.imageUrl,
        },
        data: payload.data,
        android: {
          priority: 'high',
          notification: {
            sound: 'default',
            channelId: 'goals',
          },
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1,
            },
          },
        },
      });

      console.log(`✅ Notificação enviada para tópico ${topic}`);
    } catch (error) {
      console.error(`Erro ao enviar notificação para tópico ${topic}:`, error);
      throw error;
    }
  }
}

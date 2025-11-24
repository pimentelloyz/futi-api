import { PrismaClient } from '@prisma/client';

import { NotificationService } from '../../services/notification.service.js';
import { PushTokenService } from '../../services/push-token.service.js';
import { FirebaseMessagingService } from '../../../infra/services/firebase-messaging.service.js';

import type { NotifyGoalInput, NotifyGoalOutput } from './notify-goal.dto.js';

export class NotifyGoalUseCase {
  private notificationService: NotificationService;

  constructor(private readonly prisma: PrismaClient) {
    const messagingService = new FirebaseMessagingService();
    const pushTokenService = new PushTokenService(prisma);
    this.notificationService = new NotificationService(messagingService, pushTokenService);
  }

  async execute(input: NotifyGoalInput): Promise<NotifyGoalOutput> {
    try {
      // 1. Buscar todos os usuários interessados nessa partida
      const interestedUsers = await this.getInterestedUsers(input.matchId, input.teamId);

      if (interestedUsers.length === 0) {
        return { success: true, notificationsSent: 0 };
      }

      // 2. Enviar notificação de gol usando o serviço
      const result = await this.notificationService.sendGoalNotification({
        userIds: interestedUsers.map((u) => u.id),
        playerName: input.playerName,
        homeTeam: input.homeTeam,
        awayTeam: input.awayTeam,
        homeScore: input.homeScore,
        awayScore: input.awayScore,
        minute: input.minute,
        matchId: input.matchId,
        leagueId: interestedUsers[0]?.leagueId || '',
      });

      return {
        success: true,
        notificationsSent: result.successCount,
      };
    } catch (error) {
      console.error('Erro ao notificar gol:', error);
      return {
        success: false,
        notificationsSent: 0,
      };
    }
  }

  private async getInterestedUsers(matchId: string, teamId: string) {
    // Busca usuários que deveriam receber notificação:
    // 1. Jogadores do time que fez o gol
    // 2. Membros com acesso à liga da partida
    // 3. Usuários que "seguem" o time (futuro)

    const match = await this.prisma.match.findUnique({
      where: { id: matchId },
      include: {
        league: {
          include: {
            accessMemberships: {
              select: {
                userId: true,
              },
            },
          },
        },
      },
    });

    if (!match) return [];

    // Coletar IDs de usuários interessados
    const userIds = new Set<string>();

    // 1. Membros da liga
    match.league.accessMemberships.forEach((membership) => {
      userIds.add(membership.userId);
    });

    // 2. Jogadores do time (com usuário associado)
    const teamPlayers = await this.prisma.playersOnTeams.findMany({
      where: { teamId },
      include: {
        player: {
          include: {
            user: true,
          },
        },
      },
    });

    teamPlayers.forEach((pt) => {
      if (pt.player.user) {
        userIds.add(pt.player.user.id);
      }
    });

    return Array.from(userIds).map((id) => ({ id, leagueId: match.leagueId }));
  }
}

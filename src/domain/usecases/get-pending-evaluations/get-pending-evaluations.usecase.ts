import { PrismaClient } from '@prisma/client';

import {
  GetPendingEvaluationsInput,
  GetPendingEvaluationsOutput,
} from './get-pending-evaluations.dto.js';

export class PlayerNotFoundError extends Error {
  constructor() {
    super('Player not found');
    this.name = 'PlayerNotFoundError';
  }
}

export class GetPendingEvaluationsUseCase {
  constructor(private readonly prisma: PrismaClient) {}

  async execute(input: GetPendingEvaluationsInput): Promise<GetPendingEvaluationsOutput> {
    // Buscar player pelo userId
    const player = await this.prisma.player.findUnique({
      where: { userId: input.userId },
      select: { id: true },
    });

    if (!player) {
      throw new PlayerNotFoundError();
    }

    // Buscar assignments pendentes com join otimizado
    const assignments = await this.prisma.matchPlayerEvaluationAssignment.findMany({
      where: {
        evaluatorPlayerId: player.id,
        completedAt: null,
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        matchId: true,
        targetPlayerId: true,
        target: {
          select: { id: true, name: true },
        },
      },
    });

    return {
      items: assignments.map((a) => ({
        id: a.id,
        matchId: a.matchId,
        targetPlayerId: a.targetPlayerId,
        targetName: a.target.name,
      })),
    };
  }
}

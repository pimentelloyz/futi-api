import { prisma } from '../prisma/client.js';

export type MatchEventType = 'GOAL' | 'FOUL' | 'YELLOW_CARD' | 'RED_CARD' | 'OWN_GOAL';

export interface AddMatchEventInput {
  matchId: string;
  teamId?: string | null;
  playerId?: string | null;
  minute?: number | null;
  type: MatchEventType;
}

export class PrismaMatchEventRepository {
  async add(data: AddMatchEventInput) {
    const rec = await prisma.matchEvent.create({
      data: {
        matchId: data.matchId,
        teamId: data.teamId ?? null,
        playerId: data.playerId ?? null,
        minute: data.minute ?? null,
        type: data.type,
      },
      select: { id: true },
    });
    return rec;
  }

  async listByMatch(matchId: string) {
    return prisma.matchEvent.findMany({
      where: { matchId },
      orderBy: { createdAt: 'asc' },
    });
  }
}

// Prisma enum PreferredFoot não está gerando tipo separado; usar união literal definida localmente
import { prisma } from '../prisma/client.js';

export interface UpsertPlayerSkillInput {
  playerId: string;
  preferredFoot: 'LEFT' | 'RIGHT' | 'BOTH';
  attack: number;
  defense: number;
  shooting: number;
  ballControl: number;
  pace: number;
  passing?: number;
  dribbling?: number;
  physical?: number;
}

export class PrismaPlayerSkillRepository {
  async upsert(input: UpsertPlayerSkillInput) {
    const rec = await prisma.playerSkill.upsert({
      where: { playerId: input.playerId },
      create: {
        playerId: input.playerId,
        preferredFoot: input.preferredFoot,
        attack: input.attack,
        defense: input.defense,
        shooting: input.shooting,
        ballControl: input.ballControl,
        pace: input.pace,
        passing: input.passing ?? 50,
        dribbling: input.dribbling ?? 50,
        physical: input.physical ?? 50,
      },
      update: {
        preferredFoot: input.preferredFoot,
        attack: input.attack,
        defense: input.defense,
        shooting: input.shooting,
        ballControl: input.ballControl,
        pace: input.pace,
        passing: input.passing ?? 50,
        dribbling: input.dribbling ?? 50,
        physical: input.physical ?? 50,
      },
    });
    return rec;
  }

  async findByPlayerId(playerId: string) {
    return prisma.playerSkill.findUnique({ where: { playerId } });
  }
}

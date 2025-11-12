import { prisma } from '../prisma/client.js';
import { PlayerRepository } from '../../data/protocols/player-repository.js';
import { AddPlayerInput } from '../../domain/usecases/add-player.js';

export class PrismaPlayerRepository implements PlayerRepository {
  async add(data: AddPlayerInput): Promise<{ id: string }> {
    const connectTeams = (data.teamIds ?? []).map((id) => ({ id }));
    const created = await prisma.player.create({
      data: {
        name: data.name,
        position: data.position ?? null,
        number: data.number ?? null,
        isActive: data.isActive ?? true,
        photo: data.photo ?? null,
        teams: connectTeams.length ? { connect: connectTeams } : undefined,
      },
      select: { id: true },
    });
    return created;
  }

  async addForUser(userId: string, data: AddPlayerInput): Promise<{ id: string }> {
    const connectTeams = (data.teamIds ?? []).map((id) => ({ id }));
    return prisma.player.create({
      data: {
        name: data.name,
        position: data.position ?? null,
        number: data.number ?? null,
        isActive: data.isActive ?? true,
        userId,
        photo: data.photo ?? null,
        teams: connectTeams.length ? { connect: connectTeams } : undefined,
      },
      select: { id: true },
    });
  }

  async findByUserId(userId: string) {
    return prisma.player.findUnique({
      where: { userId },
      select: { id: true, name: true, position: true, number: true, isActive: true },
    });
  }
}

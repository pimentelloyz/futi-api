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
        teams: connectTeams.length ? { connect: connectTeams } : undefined,
      },
      select: { id: true },
    });
    return created;
  }
}

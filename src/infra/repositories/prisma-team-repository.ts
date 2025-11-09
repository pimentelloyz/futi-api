import { prisma } from '../prisma/client.js';
import { TeamRepository } from '../../data/protocols/team-repository.js';
import { AddTeamInput } from '../../domain/usecases/add-team.js';

export class PrismaTeamRepository implements TeamRepository {
  async add(data: AddTeamInput): Promise<{ id: string }> {
    const created = await prisma.team.create({
      data: {
        name: data.name,
        icon: data.icon ?? null,
        description: data.description ?? null,
        isActive: data.isActive ?? true,
      },
      select: { id: true },
    });
    return created;
  }
}

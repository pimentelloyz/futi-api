import { prisma } from '../prisma/client.js';
import { TeamBasic, TeamRepository } from '../../data/protocols/team-repository.js';
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

  async list(params?: { isActive?: boolean }): Promise<TeamBasic[]> {
    const where = params?.isActive == null ? {} : { isActive: params.isActive };
    const items = await prisma.team.findMany({
      where,
      orderBy: { name: 'asc' },
      select: { id: true, name: true, icon: true, description: true, isActive: true },
    });
    return items as TeamBasic[];
  }
}

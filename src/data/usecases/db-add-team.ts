import type { PrismaClient } from '@prisma/client';

import { AddTeam, AddTeamInput } from '../../domain/usecases/add-team.js';
import { TeamRepository } from '../protocols/team-repository.js';
import { AccessRole } from '../../domain/constants/access-roles.js';

export class DbAddTeam implements AddTeam {
  constructor(
    private readonly teamRepository: TeamRepository,
    private readonly prisma: PrismaClient,
  ) {}

  async add(input: AddTeamInput): Promise<{ id: string }> {
    const isActive = input.isActive ?? true;
    const team = await this.teamRepository.add({ ...input, isActive });

    // Criar membership de MANAGER para o criador do time
    await this.prisma.accessMembership.create({
      data: {
        userId: input.userId,
        teamId: team.id,
        role: AccessRole.MANAGER,
      },
    });

    return team;
  }
}

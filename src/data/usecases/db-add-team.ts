import { AddTeam, AddTeamInput } from '../../domain/usecases/add-team.js';
import { TeamRepository } from '../protocols/team-repository.js';

export class DbAddTeam implements AddTeam {
  constructor(private readonly teamRepository: TeamRepository) {}

  async add(input: AddTeamInput): Promise<{ id: string }> {
    const isActive = input.isActive ?? true;
    return this.teamRepository.add({ ...input, isActive });
  }
}

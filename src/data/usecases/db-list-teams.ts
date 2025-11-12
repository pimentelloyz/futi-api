import { ListTeams, ListTeamsInput, ListTeamsOutput } from '../../domain/usecases/list-teams.js';
import { TeamRepository } from '../protocols/team-repository.js';

export class DbListTeams implements ListTeams {
  constructor(private readonly repo: TeamRepository) {}

  async list(input?: ListTeamsInput): Promise<ListTeamsOutput> {
    return this.repo.list({ isActive: input?.isActive });
  }
}

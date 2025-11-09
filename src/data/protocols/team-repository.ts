import { AddTeamInput } from '../../domain/usecases/add-team.js';

export interface TeamRepository {
  add(data: AddTeamInput): Promise<{ id: string }>;
}

import { AddTeamInput } from '../../domain/usecases/add-team.js';

export type TeamBasic = {
  id: string;
  name: string;
  icon: string | null;
  description: string | null;
  isActive: boolean;
};

export interface TeamRepository {
  add(data: AddTeamInput): Promise<{ id: string }>;
  list(params?: { isActive?: boolean }): Promise<TeamBasic[]>;
}

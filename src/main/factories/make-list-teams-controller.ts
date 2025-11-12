import { ListTeamsController } from '../../presentation/controllers/list-teams-controller.js';
import { PrismaTeamRepository } from '../../infra/repositories/prisma-team-repository.js';
import { DbListTeams } from '../../data/usecases/db-list-teams.js';

export function makeListTeamsController() {
  const repo = new PrismaTeamRepository();
  const usecase = new DbListTeams(repo);
  return new ListTeamsController(usecase);
}

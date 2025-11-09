import { AddTeamController } from '../../presentation/controllers/add-team-controller.js';
import { DbAddTeam } from '../../data/usecases/db-add-team.js';
import { PrismaTeamRepository } from '../../infra/repositories/prisma-team-repository.js';

export function makeAddTeamController() {
  const repo = new PrismaTeamRepository();
  const usecase = new DbAddTeam(repo);
  return new AddTeamController(usecase);
}

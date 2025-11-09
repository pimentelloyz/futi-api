import { AddMatchController } from '../../presentation/controllers/add-match-controller.js';
import { DbAddMatch } from '../../data/usecases/db-add-match.js';
import { PrismaMatchRepository } from '../../infra/repositories/prisma-match-repository.js';

export function makeAddMatchController() {
  const repo = new PrismaMatchRepository();
  const usecase = new DbAddMatch(repo);
  return new AddMatchController(usecase);
}

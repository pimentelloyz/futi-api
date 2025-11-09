import { ListMatchesController } from '../../presentation/controllers/list-matches-controller.js';
import { DbListMatches } from '../../data/usecases/db-list-matches.js';
import { PrismaMatchRepository } from '../../infra/repositories/prisma-match-repository.js';

export function makeListMatchesController() {
  const repo = new PrismaMatchRepository();
  const usecase = new DbListMatches(repo);
  return new ListMatchesController(usecase);
}

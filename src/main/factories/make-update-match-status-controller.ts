import { UpdateMatchStatusController } from '../../presentation/controllers/update-match-status-controller.js';
import { DbUpdateMatchStatus } from '../../data/usecases/db-update-match-status.js';
import { PrismaMatchRepository } from '../../infra/repositories/prisma-match-repository.js';

export function makeUpdateMatchStatusController() {
  const repo = new PrismaMatchRepository();
  const usecase = new DbUpdateMatchStatus(repo);
  return new UpdateMatchStatusController(usecase);
}

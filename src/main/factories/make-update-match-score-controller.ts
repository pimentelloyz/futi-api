import { UpdateMatchScoreController } from '../../presentation/controllers/update-match-score-controller.js';
import { DbUpdateMatchScore } from '../../data/usecases/db-update-match-score.js';
import { PrismaMatchRepository } from '../../infra/repositories/prisma-match-repository.js';

export function makeUpdateMatchScoreController() {
  const repo = new PrismaMatchRepository();
  const usecase = new DbUpdateMatchScore(repo);
  return new UpdateMatchScoreController(usecase);
}

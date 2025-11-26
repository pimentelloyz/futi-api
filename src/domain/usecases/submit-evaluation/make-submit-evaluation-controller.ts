import { SubmitEvaluationUseCase } from './submit-evaluation.usecase.js';
import { SubmitEvaluationController } from './submit-evaluation-controller.js';
import { PrismaMatchPlayerEvaluationRepository } from '../../../infra/repositories/prisma-match-player-evaluation-repository.js';

export function makeSubmitEvaluationController() {
  const repository = new PrismaMatchPlayerEvaluationRepository();
  const useCase = new SubmitEvaluationUseCase(repository);
  return new SubmitEvaluationController(useCase);
}

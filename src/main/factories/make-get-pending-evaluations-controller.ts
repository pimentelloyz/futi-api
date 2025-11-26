import { prisma } from '../../infra/prisma/client.js';
import { GetPendingEvaluationsUseCase } from '../../domain/usecases/get-pending-evaluations/get-pending-evaluations.usecase.js';
import { GetPendingEvaluationsController } from '../../presentation/controllers/get-pending-evaluations-controller.js';

export function makeGetPendingEvaluationsController(): GetPendingEvaluationsController {
  const useCase = new GetPendingEvaluationsUseCase(prisma);
  return new GetPendingEvaluationsController(useCase);
}

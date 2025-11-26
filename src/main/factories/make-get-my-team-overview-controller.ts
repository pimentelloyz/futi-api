import { GetMyTeamOverviewController } from '../../presentation/controllers/get-my-team-overview-controller.js';
import { GetMyTeamOverviewUseCase } from '../../domain/usecases/get-my-team-overview/get-my-team-overview.usecase.js';
import { prisma } from '../../infra/prisma/client.js';

export function makeGetMyTeamOverviewController(): GetMyTeamOverviewController {
  const useCase = new GetMyTeamOverviewUseCase(prisma);
  return new GetMyTeamOverviewController(useCase);
}

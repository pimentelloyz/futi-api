import { PrismaLeagueRepository } from '../../infra/repositories/prisma-league-repository.js';
import { GetLeagueSetupProgressUseCase } from '../../domain/usecases/get-league-setup-progress/get-league-setup-progress.usecase.js';
import { GetLeagueSetupProgressController } from '../../presentation/controllers/get-league-setup-progress-controller.js';

export function makeGetLeagueSetupProgressController(): GetLeagueSetupProgressController {
  const repository = new PrismaLeagueRepository();
  const useCase = new GetLeagueSetupProgressUseCase(repository);
  return new GetLeagueSetupProgressController(useCase);
}

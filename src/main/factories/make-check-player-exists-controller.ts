import { PrismaPlayerRepository } from '../../infra/repositories/prisma-player-repository.js';
import { CheckPlayerExistsUseCase } from '../../domain/usecases/check-player-exists/check-player-exists.usecase.js';
import { CheckPlayerExistsController } from '../../presentation/controllers/check-player-exists-controller.js';

export function makeCheckPlayerExistsController(): CheckPlayerExistsController {
  const repository = new PrismaPlayerRepository();
  const useCase = new CheckPlayerExistsUseCase(repository);
  return new CheckPlayerExistsController(useCase);
}

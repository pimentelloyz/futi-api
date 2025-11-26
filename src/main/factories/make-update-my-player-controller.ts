import { PrismaPlayerRepository } from '../../infra/repositories/prisma-player-repository.js';
import { UpdateMyPlayerUseCase } from '../../domain/usecases/update-my-player/update-my-player.usecase.js';
import { UpdateMyPlayerController } from '../../presentation/controllers/update-my-player-controller.ts';

export function makeUpdateMyPlayerController(): UpdateMyPlayerController {
  const playerRepository = new PrismaPlayerRepository();
  const useCase = new UpdateMyPlayerUseCase(playerRepository);
  return new UpdateMyPlayerController(useCase);
}

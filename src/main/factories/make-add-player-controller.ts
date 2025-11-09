import { AddPlayerController } from '../../presentation/controllers/add-player-controller.js';
import { DbAddPlayer } from '../../data/usecases/db-add-player.js';
import { PrismaPlayerRepository } from '../../infra/repositories/prisma-player-repository.js';

export function makeAddPlayerController() {
  const repo = new PrismaPlayerRepository();
  const usecase = new DbAddPlayer(repo);
  return new AddPlayerController(usecase);
}

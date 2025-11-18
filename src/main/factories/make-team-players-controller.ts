import { TeamPlayersController } from '../../presentation/controllers/team-players-controller.js';
import { PrismaPlayerRepository } from '../../infra/repositories/prisma-player-repository.js';
import { PrismaTeamRepository } from '../../infra/repositories/prisma-team-repository.js';
import { ListTeamPlayersUseCase } from '../../domain/usecases/list-team-players.js';

export function makeTeamPlayersController() {
  const players = new PrismaPlayerRepository();
  const teams = new PrismaTeamRepository();
  const usecase = new ListTeamPlayersUseCase(players, teams);
  return new TeamPlayersController(usecase);
}

import { PrismaTeamRepository } from '../../infra/repositories/prisma-team-repository.js';
import { PrismaLeagueRepository } from '../../infra/repositories/prisma-league-repository.js';
import { ListTeamLeaguesUseCase } from '../../domain/usecases/list-team-leagues/list-team-leagues.usecase.js';
import { ListTeamLeaguesController } from '../../presentation/controllers/list-team-leagues-controller.js';

export function makeListTeamLeaguesController() {
  const teamRepository = new PrismaTeamRepository();
  const leagueRepository = new PrismaLeagueRepository();
  const useCase = new ListTeamLeaguesUseCase(teamRepository, leagueRepository);
  return new ListTeamLeaguesController(useCase);
}

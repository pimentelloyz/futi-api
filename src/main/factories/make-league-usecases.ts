import { PrismaClient } from '@prisma/client';

import { CreateLeagueUseCase } from '../../domain/usecases/create-league/create-league.usecase.js';
import { DeleteLeagueUseCase } from '../../domain/usecases/delete-league/delete-league.usecase.js';
import { GetLeagueUseCase } from '../../domain/usecases/get-league/get-league.usecase.js';
import { ListLeaguesUseCase } from '../../domain/usecases/list-leagues/list-leagues.usecase.js';
import { ListMyLeaguesUseCase } from '../../domain/usecases/list-my-leagues/list-my-leagues.usecase.js';
import { UpdateLeagueUseCase } from '../../domain/usecases/update-league/update-league.usecase.js';
import { PrismaLeagueRepository } from '../../infra/repositories/prisma-league-repository.js';
import { PrismaUserAccessRepository } from '../../infra/repositories/prisma-user-access-repository.js';

const prisma = new PrismaClient();
const leagueRepository = new PrismaLeagueRepository(prisma);
const userAccessRepository = new PrismaUserAccessRepository(prisma);

export function makeCreateLeagueUseCase() {
  return new CreateLeagueUseCase(leagueRepository);
}

export function makeListLeaguesUseCase() {
  return new ListLeaguesUseCase(leagueRepository);
}

export function makeListMyLeaguesUseCase() {
  return new ListMyLeaguesUseCase(leagueRepository, userAccessRepository);
}

export function makeGetLeagueUseCase() {
  return new GetLeagueUseCase(leagueRepository);
}

export function makeUpdateLeagueUseCase() {
  return new UpdateLeagueUseCase(leagueRepository);
}

export function makeDeleteLeagueUseCase() {
  return new DeleteLeagueUseCase(leagueRepository);
}
